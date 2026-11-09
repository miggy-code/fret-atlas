import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { SOUND_KEY, THEME_KEY } from '../core/device-copy';
import { STORAGE_KEY } from '../core/state';
import type { State } from '../core/state';
import { appSettings, diffSettings } from '../core/sync-edit';
import type { AppSettings } from '../core/sync-edit';
import type { Progress } from '../core/progress';
import type { AccountView } from './App';


/** Theme and sound belong to the device (or the account), never to the saved or shared view. */
export function useDevicePreferences(account: AccountView | undefined) {
  const [darkMode, setDarkMode] = useState(() => {
    if (account) return appSettings(account.settings).theme === 'dark';
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });
  const [sound, setSound] = useState(() => {
    if (account) return appSettings(account.settings).sound === 'on';
    try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch { return true; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    if (!account) try { localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light'); } catch { /* The visual preference is optional. */ }
  }, [darkMode]);
  useEffect(() => {
    if (!account) try { localStorage.setItem(SOUND_KEY, sound ? 'on' : 'off'); } catch { /* The sound preference is optional. */ }
  }, [sound]);
  return {
    darkMode, sound,
    toggleDarkMode: () => setDarkMode(value => !value),
    toggleSound: () => setSound(value => !value),
    restore: (settings: AppSettings) => { setDarkMode(settings.theme === 'dark'); setSound(settings.sound === 'on'); },
  };
}

/**
 * Saves the view on every change. Signed in, it sends only what this screen changed since the account last
 * matched it (a tab never writes back a value it did not touch). Returns whether device storage works.
 */
export function useSavedView(state: State, darkMode: boolean, sound: boolean, account: AccountView | undefined) {
  const [storageWorks, setStorageWorks] = useState(true);
  const base = useRef<AppSettings | undefined>(undefined);
  useLayoutEffect(() => {
    if (account) {
      const next: AppSettings = { view: state, theme: darkMode ? 'dark' : 'light', sound: sound ? 'on' : 'off' };
      // The first pass shows the account's own settings, so it is the baseline, not an edit.
      const delta = base.current && diffSettings(base.current, next);
      base.current = next;
      if (delta) account.onSettings(delta);
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageWorks(true); }
    catch { setStorageWorks(false); }
  }, [state, darkMode, sound]);
  return { storageWorks, matched: (settings: AppSettings) => { base.current = settings; } };
}

/**
 * Shows what changed in the account or in another tab, without remounting the app. A drill holds changes
 * back so the board never changes under it; they appear when it ends.
 */
export function useAccountChanges(account: AccountView | undefined, hold: boolean, show: (settings: AppSettings, progress: Progress) => void) {
  const shown = useRef(account?.version);
  useEffect(() => {
    if (!account || hold || account.version === shown.current) return;
    shown.current = account.version;
    show(appSettings(account.settings), account.progress);
  }, [account?.version, hold]);
}
