import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { App } from './App';
import { SyncDecision } from './SyncDecision';
import type { Decision, Question } from './SyncDecision';
import { defaultState, loadState } from '../core/state';
import { PROGRESS_KEY, SOUND_KEY, THEME_KEY } from '../core/device-copy';
import { restoreProgress } from '../core/progress';
import type { Progress } from '../core/progress';
import { SyncCoordinator } from '../core/sync-coordinator';
import { readAccountCache, writeAccountCache } from '../core/sync-cache';
import type { AccountCache } from '../core/sync-cache';
import { syncChange } from '../core/sync-api';
import { TabSession } from '../core/account-tabs';
import type { Leader, TabView } from '../core/account-tabs';
import { applyEdit } from '../core/sync-edit';
import type { Edit } from '../core/sync-edit';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const sameProgress = (a: Progress, b: Progress) => JSON.stringify(a) === JSON.stringify(b);

async function initialCache(userId: string, ask: (decision: Decision) => Promise<boolean>): Promise<AccountCache> {
  const saved = readAccountCache(localStorage, userId);
  if (saved) return saved;
  const useDevice = await ask('import');
  let progress = {};
  if (useDevice) {
    try { progress = restoreProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')); } catch { /* Keep the original device copy. */ }
  }
  const cache: AccountCache = {
    settings: { view: useDevice ? loadState() : defaultState(), theme: useDevice ? (localStorage.getItem(THEME_KEY) ?? 'light') : 'light', sound: useDevice ? (localStorage.getItem(SOUND_KEY) ?? 'on') : 'on' },
    // A declined import only has defaults, so the account's settings win without a second question.
    progress, settingsRevision: null, resetGeneration: null, settingsPending: useDevice,
    progressPending: useDevice && Object.keys(progress).length > 0, resetPending: false,
  };
  writeAccountCache(localStorage, userId, cache);
  return cache;
}

interface AccountAppProps {
  userId: string;
  getToken: () => Promise<string | null>;
  syncUrl?: string;
  syncKey?: string;
  /** Sign-in and account controls for the top bar. */
  accountMenu?: ReactNode;
  /** Changes made on this device before the account loaded; they are applied on top of the account's data. */
  deviceEdits?: Edit;
}

export function AccountApp(props: AccountAppProps) {
  // Tabs coordinate through a Web Lock and a BroadcastChannel; without both, sharing the cache would be unsafe.
  if (!navigator.locks || typeof BroadcastChannel === 'undefined') {
    return <div role="alert"><p>This browser cannot safely coordinate account data between tabs. Use a current browser or sign out.</p>{props.accountMenu}</div>;
  }
  return <AccountSession {...props} />;
}

function AccountSession({ userId, getToken, syncUrl = url, syncKey = key, accountMenu, deviceEdits }: AccountAppProps) {
  const [shown, setShown] = useState<{ view: TabView; version: number } | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [failure, setFailure] = useState('');
  const tokenRef = useRef(getToken);
  tokenRef.current = getToken;
  const latest = useRef<AccountCache | null>(null);
  const [session] = useState(() => {
    const ask = (decision: Decision) => new Promise<boolean>(resolve => setQuestion({ decision, resolve }));
    return new TabSession({
      locks: { request: (name, hold) => navigator.locks.request(name, hold) },
      lock: `fret-atlas:${userId}`,
      channel: () => new BroadcastChannel(`fret-atlas:${userId}`),
      // Each change from elsewhere moves the version, which tells the app to show it.
      show: (view, displayChanged) => { latest.current = view.cache; setShown(previous => ({ view, version: (previous?.version ?? 0) + (displayChanged ? 1 : 0) })); },
      fail: () => setFailure('Account storage is unavailable or damaged. Your saved data has been preserved.'),
      lead: async changed => {
        const coordinator = new SyncCoordinator(await initialCache(userId, ask), {
          save: next => writeAccountCache(localStorage, userId, next),
          call: async (operation, current) => {
            const result = await syncChange(syncUrl!, syncKey!, async () => {
              const token = await tokenRef.current();
              if (!token || !current()) return null;
              try {
                const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                if (payload.sub !== userId) throw new Error('Account changed');
              } catch { throw new Error('Account changed'); }
              return token;
            }, operation);
            if (result.row.user_id !== userId) throw new Error('Account mismatch');
            return result;
          },
          confirm: conflict => ask(conflict),
          update: (_cache, _status, displayChanged) => changed(displayChanged),
        }, !!syncUrl && !!syncKey);
        const wake = () => coordinator.wake();
        const leader: Leader = {
          start: () => { coordinator.start(); window.addEventListener('online', wake); },
          stop: () => { window.removeEventListener('online', wake); coordinator.stop(); },
          apply: edit => applyEdit(coordinator, edit),
          view: () => ({ cache: coordinator.snapshot.cache, status: coordinator.snapshot.status, deciding: coordinator.snapshot.deciding !== null }),
        };
        return leader;
      },
    });
  });

  useEffect(() => {
    session.start();
    if (deviceEdits) session.edit(deviceEdits);
    return () => session.stop();
  }, [session]);

  const answer = question && ((keepDevice: boolean) => { setQuestion(null); question.resolve(keepDevice); });
  const decision = question && answer && <SyncDecision question={question} onAnswer={answer} />;
  if (failure) return <p role="alert">{failure}</p>;
  // Until the account's data arrives (from this tab's own start-up, or from the leader), the board shows but cannot be used.
  if (!shown) return <><div inert><App accountMenu={accountMenu} /></div>{decision}</>;

  const { view, version } = shown;
  // Only the leader can answer a question, so another tab says where to look.
  const status = view.deciding && !question ? 'Sync paused · decide in your other Fretory tab' : view.status;
  return <>
    <App accountMenu={accountMenu} account={{
      settings: view.cache.settings, progress: view.cache.progress, version, status,
      onSettings: settings => session.edit({ settings }),
      // The app reports its progress when it starts; only a real difference is an edit.
      onProgress: progress => { if (!latest.current || !sameProgress(progress, latest.current.progress)) session.edit({ progress }); },
      onClear: () => session.edit({ clear: true }),
    }} />
    {decision}
  </>;
}
