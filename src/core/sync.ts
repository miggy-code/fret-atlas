import type { Progress } from './progress';
import type { AccountCache } from './sync-cache';
import type { SyncRow } from './sync-api';

/** Merge only progress from the same reset generation. */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const merged = { ...remote };
  for (const [key, level] of Object.entries(local)) {
    if ((merged[key] ?? 0) < level) merged[key] = level;
  }
  return merged;
}

export type ProgressSync =
  | { kind: 'merge'; progress: Progress; generation: number }
  | { kind: 'reset-conflict'; local: Progress; remote: Progress; generation: number };

/** A stale device must never automatically resurrect progress cleared elsewhere. */
export function reconcileProgress(local: Progress, localGeneration: number, remote: Progress, remoteGeneration: number, pending: boolean): ProgressSync {
  if (localGeneration !== remoteGeneration) {
    if (pending) return { kind: 'reset-conflict', local, remote, generation: remoteGeneration };
    return { kind: 'merge', progress: remote, generation: remoteGeneration };
  }
  return { kind: 'merge', progress: mergeProgress(local, remote), generation: remoteGeneration };
}

export type SettingsSync<T> =
  | { kind: 'remote'; value: T; revision: number }
  | { kind: 'upload'; value: T; expectedRevision: number }
  | { kind: 'conflict'; local: T; remote: T; revision: number };

/** Revisions are assigned by the server; device clocks never decide the winner. */
export function reconcileSettings<T>(local: T, baseRevision: number | null, remote: T, remoteRevision: number, pending: boolean): SettingsSync<T> {
  if (!pending) return { kind: 'remote', value: remote, revision: remoteRevision };
  if (baseRevision === remoteRevision) return { kind: 'upload', value: local, expectedRevision: remoteRevision };
  return { kind: 'conflict', local, remote, revision: remoteRevision };
}

export type SyncConflict = 'settings' | 'progress-reset';
export type Reconciliation = { kind: 'ready'; cache: AccountCache; displayChanged: boolean } | { kind: 'conflict'; conflict: SyncConflict };
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Reconcile one server snapshot. A conflict must be resolved before any upload. */
export function reconcileAccount(cache: AccountCache, remote: SyncRow, choices: Partial<Record<SyncConflict, boolean>> = {}): Reconciliation {
  let current = cache;
  let displayChanged = false;
  const settingsConflict = current.settingsPending && (current.settingsRevision === null ? remote.settings_revision > 0 : current.settingsRevision !== remote.settings_revision);
  if (settingsConflict) {
    if (choices.settings === undefined) return { kind: 'conflict', conflict: 'settings' };
    if (choices.settings) current = { ...current, settingsRevision: remote.settings_revision };
    else { current = { ...current, settings: remote.settings, settingsRevision: remote.settings_revision, settingsPending: false }; displayChanged = true; }
  } else if (!current.settingsPending) {
    const changed = !equal(current.settings, remote.settings) && remote.settings_revision > 0;
    current = { ...current, settings: changed ? remote.settings : current.settings, settingsRevision: remote.settings_revision };
    displayChanged ||= changed;
  } else if (current.settingsRevision === null) current = { ...current, settingsRevision: remote.settings_revision };

  const generationChanged = current.resetGeneration !== null && current.resetGeneration !== remote.reset_generation;
  const importedAfterReset = current.resetGeneration === null && current.progressPending && remote.reset_generation > 0;
  if ((generationChanged && (current.progressPending || current.resetPending)) || importedAfterReset) {
    if (choices['progress-reset'] === undefined) return { kind: 'conflict', conflict: 'progress-reset' };
    if (choices['progress-reset']) current = { ...current, resetGeneration: remote.reset_generation };
    else { current = { ...current, progress: remote.progress, resetGeneration: remote.reset_generation, progressPending: false, resetPending: false }; displayChanged = true; }
  } else if (generationChanged || (current.resetGeneration === null && !current.progressPending)) {
    displayChanged ||= !equal(current.progress, remote.progress);
    current = { ...current, progress: remote.progress, resetGeneration: remote.reset_generation };
  } else if (current.resetPending) current = { ...current, resetGeneration: remote.reset_generation };
  else {
    const progress = mergeProgress(current.progress, remote.progress);
    displayChanged ||= !equal(current.progress, progress);
    current = { ...current, progress, resetGeneration: remote.reset_generation };
  }
  return { kind: 'ready', cache: current, displayChanged };
}
