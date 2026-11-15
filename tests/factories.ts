import type { Page } from '@playwright/test';
import { accountCacheKey } from '../src/core/sync-cache';
import type { AccountCache } from '../src/core/sync-cache';
import type { SyncRow } from '../src/core/sync-api';

// Typed with the production shapes so a schema change breaks here, not silently in a test.
// Defaults are a settled, signed-in account; each test overrides only the fields its assertions use.

export const buildSyncRow = (overrides: Partial<SyncRow> = {}): SyncRow => ({
  user_id: 'user_a', settings: { view: {}, theme: 'light', sound: 'on' }, settings_revision: 1, progress: {}, reset_generation: 0, ...overrides,
});

export const buildAccountCache = (overrides: Partial<AccountCache> = {}): AccountCache => ({
  settings: { view: {}, theme: 'light', sound: 'on' }, progress: {}, settingsRevision: 1, resetGeneration: 0,
  settingsPending: false, progressPending: false, resetPending: false, ...overrides,
});

export const seedAccountCache = (page: Page, userId: string, overrides: Partial<AccountCache> = {}) =>
  page.addInitScript(([key, value]) => localStorage.setItem(key, value), [accountCacheKey(userId), JSON.stringify(buildAccountCache(overrides))]);
