import { restoreProgress } from './progress';
import type { Progress } from './progress';

export interface AccountCache {
  settings: Record<string, unknown>;
  progress: Progress;
  settingsRevision: number | null;
  resetGeneration: number | null;
  settingsPending: boolean;
  progressPending: boolean;
  resetPending: boolean;
}

// The user ID is part of every account key; the unscoped legacy keys remain untouched.
export const accountCacheKey = (userId: string) => `fret-atlas-account:${encodeURIComponent(userId)}`;

export function readAccountCache(storage: Pick<Storage, 'getItem'>, userId: string): AccountCache | null {
  const saved = storage.getItem(accountCacheKey(userId));
  if (!saved) return null;
  try {
    const value: unknown = JSON.parse(saved);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid account cache');
    const data = value as Record<string, unknown>;
    const validRevision = (n: unknown) => n === null || (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0);
    if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings) ||
      !validRevision(data.settingsRevision) || !validRevision(data.resetGeneration) ||
      typeof data.settingsPending !== 'boolean' || typeof data.progressPending !== 'boolean' || typeof data.resetPending !== 'boolean') throw new Error('Invalid account cache');
    if (!data.progress || typeof data.progress !== 'object' || Array.isArray(data.progress)) throw new Error('Invalid progress');
    const progress = restoreProgress(data.progress);
    if (Object.keys(progress).length !== Object.keys(data.progress).length) throw new Error('Invalid progress');
    return { settings: data.settings as Record<string, unknown>, progress,
      settingsRevision: data.settingsRevision as number | null, resetGeneration: data.resetGeneration as number | null,
      settingsPending: data.settingsPending, progressPending: data.progressPending, resetPending: data.resetPending };
  } catch { throw new Error('Invalid account cache; saved data has been preserved'); }
}

export function writeAccountCache(storage: Pick<Storage, 'setItem'>, userId: string, cache: AccountCache): void {
  storage.setItem(accountCacheKey(userId), JSON.stringify(cache));
}
