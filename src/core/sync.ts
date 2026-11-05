import type { Progress } from './progress';

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
