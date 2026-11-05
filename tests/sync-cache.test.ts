import test from 'node:test';
import assert from 'node:assert/strict';
import { accountCacheKey, readAccountCache, writeAccountCache } from '../src/core/sync-cache';
import type { AccountCache } from '../src/core/sync-cache';

test('account caches are isolated and leave the original device data intact', () => {
  const values = new Map([['fret-atlas-progress', '{"minor:9:1":2}']]);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const cache: AccountCache = { settings: { theme: 'dark' }, progress: { 'minor:9:1': 2 }, settingsRevision: 3, resetGeneration: 1, settingsPending: true, progressPending: false, resetPending: false };
  writeAccountCache(storage, 'user/a', cache);
  assert.deepEqual(readAccountCache(storage, 'user/a'), cache);
  assert.equal(readAccountCache(storage, 'user/b'), null);
  assert.equal(values.get('fret-atlas-progress'), '{"minor:9:1":2}');
  assert.notEqual(accountCacheKey('user/a'), accountCacheKey('user%2Fa'));
});

test('malformed cache is rejected rather than interpreted as a clean sync', () => {
  const storage = { getItem: () => '{"settings":{},"settingsRevision":0,"resetGeneration":0}' };
  assert.throws(() => readAccountCache(storage, 'user'), /saved data has been preserved/);
});
