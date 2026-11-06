import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeProgress, reconcileProgress, reconcileSettings } from '../src/core/sync';

test('progress merges by maximum within one generation', () => {
  assert.deepEqual(mergeProgress({ 'minor:9:1': 2, 'major:0:2': 1 }, { 'minor:9:1': 1, 'minor:9:2': 2 }),
    { 'minor:9:1': 2, 'minor:9:2': 2, 'major:0:2': 1 });
  assert.equal(reconcileProgress({}, 1, {}, 1, true).kind, 'merge');
});

test('a reset preserves pending stale progress for an explicit choice', () => {
  const local = { 'minor:9:1': 2 as const };
  assert.deepEqual(reconcileProgress(local, 1, {}, 2, true), { kind: 'reset-conflict', local, remote: {}, generation: 2 });
  assert.deepEqual(reconcileProgress(local, 1, {}, 2, false), { kind: 'merge', progress: {}, generation: 2 });
});

test('settings require a choice when the server revision has changed or the local copy has no base', () => {
  assert.deepEqual(reconcileSettings('local', 3, 'remote', 4, true), { kind: 'conflict', local: 'local', remote: 'remote', revision: 4 });
  assert.equal(reconcileSettings('local', null, 'remote', 4, true).kind, 'conflict');
  assert.deepEqual(reconcileSettings('local', 4, 'remote', 4, true), { kind: 'upload', value: 'local', expectedRevision: 4 });
  assert.deepEqual(reconcileSettings('local', 3, 'remote', 4, false), { kind: 'remote', value: 'remote', revision: 4 });
});

import { reconcileAccount } from '../src/core/sync';
import type { AccountCache } from '../src/core/sync-cache';
import type { SyncRow } from '../src/core/sync-api';

test('account reconciliation requires both conflict decisions and preserves pending edits when chosen', () => {
  const cache: AccountCache = { settings: { theme: 'dark' }, progress: { 'minor:9:1': 2 }, settingsRevision: 1, resetGeneration: 1, settingsPending: true, progressPending: true, resetPending: false };
  const remote: SyncRow = { user_id: 'user_1', settings: { theme: 'light' }, settings_revision: 2, progress: {}, reset_generation: 2 };
  assert.deepEqual(reconcileAccount(cache, remote), { kind: 'conflict', conflict: 'settings' });
  assert.deepEqual(reconcileAccount(cache, remote, { settings: true }), { kind: 'conflict', conflict: 'progress-reset' });
  const keep = reconcileAccount(cache, remote, { settings: true, 'progress-reset': true });
  assert.equal(keep.kind, 'ready');
  if (keep.kind !== 'ready') throw new Error('expected ready');
  assert.equal(keep.cache.settingsRevision, 2);
  assert.equal(keep.cache.resetGeneration, 2);
  assert.equal(keep.cache.progress['minor:9:1'], 2);
  assert.equal(keep.cache.progressPending, true);
  const discard = reconcileAccount(cache, remote, { settings: false, 'progress-reset': false });
  assert.equal(discard.kind, 'ready');
  if (discard.kind !== 'ready') throw new Error('expected ready');
  assert.deepEqual(discard.cache.settings, { theme: 'light' });
  assert.deepEqual(discard.cache.progress, {});
  assert.equal(discard.cache.settingsPending, false);
  assert.equal(discard.cache.progressPending, false);
});
