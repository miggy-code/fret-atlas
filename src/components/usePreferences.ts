import { useEffect, useLayoutEffect, useState } from 'react';
import { STORAGE_KEY } from '../core/state';
import type { State } from '../core/state';
import type { AccountView } from './App';

const THEME_KEY = 'fret-atlas-theme';
const SOUND_KEY = 'fret-atlas-sound';

/** Theme and sound belong to the device (or the account), never to the saved or shared view. */
export function useDevicePreferences(account: AccountView | undefined) {
  const [darkMode, setDarkMode] = useState(() => {
    if (account) return account.settings.theme === 'dark';
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });
  const [sound, setSound] = useState(() => {
    if (account) return account.settings.sound !== 'off';
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
  };
}

/** Saves the view on every change, to the account when signed in. Returns whether device storage works. */
export function useSavedView(state: State, darkMode: boolean, sound: boolean, account: AccountView | undefined) {
  const [storageWorks, setStorageWorks] = useState(true);
  useLayoutEffect(() => {
    if (account) { account.onSettings({ view: state, theme: darkMode ? 'dark' : 'light', sound: sound ? 'on' : 'off' }); return; }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageWorks(true); }
    catch { setStorageWorks(false); }
  }, [state, darkMode, sound]);
  return storageWorks;
}
