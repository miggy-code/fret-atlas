import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/react';
import { App } from './App';
import { defaultState, loadState } from '../core/state';
import { restoreProgress } from '../core/progress';
import { mergeProgress } from '../core/sync';
import { readAccountCache, writeAccountCache } from '../core/sync-cache';
import type { AccountCache } from '../core/sync-cache';
import { syncChange } from '../core/sync-api';
import type { SyncRow } from '../core/sync-api';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

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
    progress, settingsRevision: null, resetGeneration: null, settingsPending: true,
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
  const cache = useRef<AccountCache | null>(initial);
  const [status, setStatus] = useState('Sync pending');
  const [version, setVersion] = useState(0);
  const [wake, setWake] = useState(0);
  const stopped = useRef(false);
  const busy = useRef(false);
  const queued = useRef(false);
  const resetSerial = useRef(0);
  const wakeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rerender = () => setVersion(v => v + 1);
  const schedule = () => { clearTimeout(wakeRef.current); wakeRef.current = setTimeout(() => setWake(n => n + 1), 500); };
  const save = (next: AccountCache) => {
    try { writeAccountCache(localStorage, userId, next); cache.current = next; return true; }
    catch { setStatus('Storage unavailable · changes cannot be synced'); return false; }
  };
  const onSettings = (settings: Record<string, unknown>) => {
    const current = cache.current;
    if (!current || equal(current.settings, settings)) return;
    if (save({ ...current, settings, settingsPending: true })) { setStatus('Sync pending'); schedule(); }
  };
  const onProgress = (progress: AccountCache['progress']) => {
    const current = cache.current;
    if (!current || equal(current.progress, progress)) return;
    if (save({ ...current, progress, progressPending: true })) { setStatus('Sync pending'); schedule(); }
  };
  const onClear = () => {
    const current = cache.current;
    if (!current) return;
    if (save({ ...current, progress: {}, progressPending: false, resetPending: true })) { resetSerial.current++; setStatus('Sync pending'); schedule(); }
  };

  useEffect(() => {
    stopped.current = false;
    const online = () => setWake(n => n + 1);
    window.addEventListener('online', online);
    const interval = setInterval(online, 30000);
    return () => { stopped.current = true; clearTimeout(wakeRef.current); clearInterval(interval); window.removeEventListener('online', online); };
  }, []);

  useEffect(() => {
    if (!cache.current || !syncUrl || !syncKey) { if (!syncUrl || !syncKey) setStatus('Sync unavailable · missing configuration'); return; }
    if (busy.current) { queued.current = true; return; }
    busy.current = true;
    const run = async () => {
      const call = async (operation: Parameters<typeof syncChange>[3]) => {
        if (stopped.current) throw new Error('Account changed');
        const result = await syncChange(syncUrl, syncKey, async () => {
          const token = await getToken();
          if (!token || stopped.current) return null;
          try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.sub !== userId) throw new Error('Account changed');
          } catch { throw new Error('Account changed'); }
          return token;
        }, operation);
        if (result.row.user_id !== userId) throw new Error('Account mismatch');
        return result;
      };
      const apply = (next: AccountCache, display = false) => {
        if (stopped.current) return false;
        if (!save(next)) throw new Error('Local storage unavailable');
        if (display) rerender();
        return true;
      };
      let response = await call({ operation: 'initialize' });
      if (stopped.current) return;
      let remote: SyncRow = response.row;
      if (remote.user_id !== userId) throw new Error('Account mismatch');
      let current = cache.current!;
      if (current.settingsPending && (current.settingsRevision === null ? remote.settings_revision > 0 : current.settingsRevision !== remote.settings_revision)) {
        const keep = window.confirm('The account has different saved settings. Select OK to keep this device’s settings, or Cancel to use the account settings.');
        current = keep ? { ...current, settingsRevision: remote.settings_revision } : { ...current, settings: remote.settings, settingsRevision: remote.settings_revision, settingsPending: false };
        apply(current, !keep);
      } else if (!current.settingsPending) {
        const changed = !equal(current.settings, remote.settings) && remote.settings_revision > 0;
        current = { ...current, settings: changed ? remote.settings : current.settings, settingsRevision: remote.settings_revision };
        apply(current, changed);
      } else if (current.settingsRevision === null) {
        current = { ...current, settingsRevision: remote.settings_revision };
        apply(current);
      }
      current = cache.current!;
      const generationChanged = current.resetGeneration !== null && current.resetGeneration !== remote.reset_generation;
      const importedAfterReset = current.resetGeneration === null && current.progressPending && remote.reset_generation > 0;
      if ((generationChanged && (current.progressPending || current.resetPending)) || importedAfterReset) {
        const keep = window.confirm('Progress was cleared on another device. Select OK to keep this device’s pending changes, or Cancel to use the account progress.');
        current = keep ? { ...current, resetGeneration: remote.reset_generation } : { ...current, progress: remote.progress, resetGeneration: remote.reset_generation, progressPending: false, resetPending: false };
        apply(current, !keep);
      } else if (generationChanged || (current.resetGeneration === null && !current.progressPending)) {
        current = { ...current, progress: remote.progress, resetGeneration: remote.reset_generation };
        apply(current, !equal(cache.current!.progress, remote.progress));
      } else if (current.resetPending) {
        current = { ...current, resetGeneration: remote.reset_generation };
        apply(current);
      } else {
        const merged = mergeProgress(current.progress, remote.progress);
        const changed = !equal(current.progress, merged);
        current = { ...current, progress: merged, resetGeneration: remote.reset_generation };
        apply(current, changed);
      }
      current = cache.current!;
      if (current.settingsPending) {
        const sent = current.settings;
        response = await call({ operation: 'settings', data: sent, expected: current.settingsRevision! });
        if (stopped.current) return;
        if (response.status !== 'ok') { schedule(); return; }
        current = cache.current!;
        apply({ ...current, settingsRevision: response.row.settings_revision, settingsPending: !equal(current.settings, sent) });
      }
      current = cache.current!;
      if (current.resetPending) {
        const serial = resetSerial.current;
        response = await call({ operation: 'reset', expected: current.resetGeneration! });
        if (stopped.current) return;
        if (response.status !== 'ok') { schedule(); return; }
        current = cache.current!;
        apply({ ...current, resetGeneration: response.row.reset_generation, resetPending: resetSerial.current !== serial, progressPending: Object.keys(current.progress).length > 0 });
      }
      current = cache.current!;
      if (current.resetPending) { schedule(); return; }
      if (current.progressPending) {
        const sent = current.progress;
        response = await call({ operation: 'progress', data: sent, expected: current.resetGeneration! });
        if (stopped.current) return;
        if (response.status !== 'ok') { schedule(); return; }
        current = cache.current!;
        if (current.resetPending) { schedule(); return; }
        const merged = mergeProgress(current.progress, response.row.progress);
        const changed = !equal(current.progress, merged);
        apply({ ...current, progress: merged, progressPending: !equal(current.progress, sent) }, changed);
      }
      current = cache.current!;
      if (current.settingsPending || current.progressPending || current.resetPending) { setStatus('Sync pending'); schedule(); }
      else setStatus('Synced');
    };
    run().catch((error: unknown) => { if (!stopped.current) setStatus(error instanceof Error && error.message === 'Local storage unavailable' ? 'Storage unavailable · changes cannot be synced' : 'Sync failed · changes saved on this device'); }).finally(() => {
      busy.current = false;
      if (queued.current && !stopped.current) { queued.current = false; schedule(); }
    });
  }, [wake]);

  if (!cache.current) return <p role="alert">{status}</p>;
  return <App key={version} accountsEnabled={showAccount} account={{ settings: cache.current.settings, progress: cache.current.progress, status, onSettings, onProgress, onClear }} />;
}
