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
