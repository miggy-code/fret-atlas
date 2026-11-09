import { defaultState, restoreState, STORAGE_KEY } from './state';
import { restoreProgress } from './progress';
import type { Progress } from './progress';
import { diffSettings } from './sync-edit';
import type { AppSettings, Edit } from './sync-edit';

export const THEME_KEY = 'fret-atlas-theme';
export const SOUND_KEY = 'fret-atlas-sound';
export const PROGRESS_KEY = 'fret-atlas-progress';

/** What the device itself has saved: the view, theme and sound, and progress. */
export interface DeviceCopy { settings: AppSettings; progress: Progress }

export function readDevice(storage: Pick<Storage, 'getItem'>): DeviceCopy {
  const read = (key: string) => { try { return storage.getItem(key); } catch { return null; } };
  const parse = (text: string | null) => { try { return JSON.parse(text ?? 'null'); } catch { return null; } };
  const saved = parse(read(STORAGE_KEY));
  return {
    settings: { view: saved ? restoreState(saved) : defaultState(), theme: read(THEME_KEY) === 'dark' ? 'dark' : 'light', sound: read(SOUND_KEY) === 'off' ? 'off' : 'on' },
    progress: restoreProgress(parse(read(PROGRESS_KEY))),
  };
}

/**
 * What a visitor changed on this device between two readings. A signed-in visitor can start using the
 * board before the account has loaded; this carries those changes (and only those) over to the account.
 */
export function deviceEdits(before: DeviceCopy, after: DeviceCopy): Edit | undefined {
  const settings = diffSettings(before.settings, after.settings);
  const progress = JSON.stringify(before.progress) === JSON.stringify(after.progress) ? undefined : after.progress;
  return settings || progress ? { ...(settings && { settings }), ...(progress && { progress }) } : undefined;
}
