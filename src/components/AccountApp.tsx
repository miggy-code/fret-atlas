import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/react';
import { App } from './App';
import { defaultState, loadState } from '../core/state';
import { restoreProgress } from '../core/progress';
import { SyncCoordinator } from '../core/sync-coordinator';
import { readAccountCache, writeAccountCache } from '../core/sync-cache';
import type { AccountCache } from '../core/sync-cache';
import { syncChange } from '../core/sync-api';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function initialCache(userId: string): AccountCache {
  const saved = readAccountCache(localStorage, userId);
  if (saved) return saved;
  const useDevice = window.confirm('Import this device’s existing view, settings, and progress into this account? Your device copy will be kept.');
  let progress = {};
  if (useDevice) {
    try { progress = restoreProgress(JSON.parse(localStorage.getItem('fret-atlas-progress') ?? '{}')); } catch { /* Keep the original device copy. */ }
  }
  const cache: AccountCache = {
    settings: { view: useDevice ? loadState() : defaultState(), theme: useDevice ? (localStorage.getItem('fret-atlas-theme') ?? 'light') : 'light', sound: useDevice ? (localStorage.getItem('fret-atlas-sound') ?? 'on') : 'on' },
    // A declined import only has defaults, so the account's settings win without a second question.
    progress, settingsRevision: null, resetGeneration: null, settingsPending: useDevice,
    progressPending: useDevice && Object.keys(progress).length > 0, resetPending: false,
  };
  writeAccountCache(localStorage, userId, cache);
  return cache;
}

export function AccountsRoot() {
  const { isLoaded, userId, getToken } = useAuth();
  if (!isLoaded) return <p role="status">Loading account…</p>;
  return userId ? <AccountApp key={userId} userId={userId} getToken={getToken} /> : <App accountsEnabled />;
}

export function AccountApp({ userId, getToken, syncUrl = url, syncKey = key, showAccount = true }: { userId: string; getToken: () => Promise<string | null>; syncUrl?: string; syncKey?: string; showAccount?: boolean }) {
  const [access, setAccess] = useState<'checking' | 'ready' | 'busy' | 'unsupported'>('checking');
  useEffect(() => {
    let active = true;
    let release: (() => void) | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    if (!navigator.locks) { setAccess('unsupported'); return; }
    const acquire = (retried: boolean) => navigator.locks.request(`fret-atlas:${userId}`, { ifAvailable: true }, async lock => {
      if (!active) return;
      if (!lock) {
        if (!retried) retry = setTimeout(() => { if (active) acquire(true); }, 250);
        else setAccess('busy');
        return;
      }
      setAccess('ready');
      await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => { if (active) setAccess('unsupported'); });
    acquire(false);
    return () => { active = false; clearTimeout(retry); release?.(); };
  }, [userId]);
  if (access === 'checking') return <p role="status">Loading account…</p>;
  if (access !== 'ready') return <div role="alert"><p>{access === 'busy' ? 'This account is open in another tab. Close that tab and reload to protect pending changes.' : 'This browser cannot safely coordinate account data between tabs. Use a current browser or sign out.'}</p>{showAccount && <UserButton />}</div>;
  return <AccountLoader userId={userId} getToken={getToken} syncUrl={syncUrl} syncKey={syncKey} showAccount={showAccount} />;
}

function AccountLoader({ userId, getToken, syncUrl, syncKey, showAccount }: { userId: string; getToken: () => Promise<string | null>; syncUrl?: string; syncKey?: string; showAccount: boolean }) {
  const [initial, setInitial] = useState<{ cache: AccountCache | null; error: string } | null>(null);
  useEffect(() => {
    try { setInitial({ cache: initialCache(userId), error: '' }); }
    catch { setInitial({ cache: null, error: 'Account storage is unavailable or damaged. Your saved data has been preserved.' }); }
  }, [userId]);
  if (!initial) return <p role="status">Loading account…</p>;
  if (!initial.cache) return <p role="alert">{initial.error}</p>;
  return <AccountSession userId={userId} getToken={getToken} syncUrl={syncUrl} syncKey={syncKey} showAccount={showAccount} initial={initial.cache} />;
}

function AccountSession({ userId, getToken, syncUrl, syncKey, showAccount, initial }: { userId: string; getToken: () => Promise<string | null>; syncUrl?: string; syncKey?: string; showAccount: boolean; initial: AccountCache }) {
  const [view, setView] = useState({ cache: initial, status: 'Sync pending', version: 0 });
  const tokenRef = useRef(getToken);
  tokenRef.current = getToken;
  const [coordinator] = useState(() => new SyncCoordinator(initial, {
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
    confirm: conflict => window.confirm(conflict === 'settings'
      ? 'The account has different saved settings. Select OK to keep this device’s settings, or Cancel to use the account settings.'
      : 'Progress was cleared on another device. Select OK to keep this device’s pending changes, or Cancel to use the account progress.'),
    update: (cache, status, displayChanged) => setView(previous => ({ cache, status, version: previous.version + (displayChanged ? 1 : 0) })),
  }, !!syncUrl && !!syncKey));

  useEffect(() => {
    coordinator.start();
    const online = () => coordinator.wake();
    window.addEventListener('online', online);
    return () => { window.removeEventListener('online', online); coordinator.stop(); };
  }, [coordinator]);

  return <App key={view.version} accountsEnabled={showAccount} account={{ settings: view.cache.settings, progress: view.cache.progress, status: view.status,
    onSettings: value => coordinator.settings(value), onProgress: value => coordinator.progress(value), onClear: () => coordinator.clear() }} />;
}
