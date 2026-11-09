import { restoreState } from './state';
import type { State } from './state';
import { mergeProgress } from './sync';
import type { Progress } from './progress';
import type { SyncCoordinator } from './sync-coordinator';

/** What the app shows and saves for an account: the view, the theme and the sound setting. */
export interface AppSettings { view: State; theme: 'light' | 'dark'; sound: 'on' | 'off' }

/** The app's reading of the stored settings, so that anything missing means its default. */
export function appSettings(raw: Record<string, unknown>): AppSettings {
  return { view: restoreState(raw.view), theme: raw.theme === 'dark' ? 'dark' : 'light', sound: raw.sound === 'off' ? 'off' : 'on' };
}

/** Only the settings a person changed, so that a tab never writes back values it did not touch. */
export interface SettingsDelta { view?: Partial<State>; theme?: AppSettings['theme']; sound?: AppSettings['sound'] }

/** One change from one tab, sent to the tab that owns the sync. */
export interface Edit { settings?: SettingsDelta; progress?: Progress; clear?: true }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Compares field by field so that two tabs changing different settings never overwrite each other. */
export function diffSettings(base: AppSettings, next: AppSettings): SettingsDelta | undefined {
  const delta: SettingsDelta = {};
  const view: Record<string, unknown> = {};
  for (const key of Object.keys(next.view) as (keyof State)[]) if (!same(base.view[key], next.view[key])) view[key] = next.view[key];
  if (Object.keys(view).length) delta.view = view as Partial<State>;
  if (base.theme !== next.theme) delta.theme = next.theme;
  if (base.sound !== next.sound) delta.sound = next.sound;
  return Object.keys(delta).length ? delta : undefined;
}

/** Lays a delta over the stored settings, leaving every other stored value as it was. */
export function applySettings(stored: Record<string, unknown>, delta: SettingsDelta): Record<string, unknown> {
  const storedView = stored.view && typeof stored.view === 'object' && !Array.isArray(stored.view) ? stored.view : {};
  return { ...stored, ...(delta.view && { view: { ...storedView, ...delta.view } }), ...(delta.theme && { theme: delta.theme }), ...(delta.sound && { sound: delta.sound }) };
}

/** Progress only grows, so a tab's copy can be merged without losing another tab's marks. Clearing is its own edit. */
export function applyEdit(coordinator: SyncCoordinator, edit: Edit) {
  const { cache } = coordinator.snapshot;
  if (edit.settings) coordinator.settings(applySettings(cache.settings, edit.settings));
  if (edit.progress) coordinator.progress(mergeProgress(cache.progress, edit.progress));
  if (edit.clear) coordinator.clear();
}
