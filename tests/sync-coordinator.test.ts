import test from 'node:test';
import assert from 'node:assert/strict';
import { DECISION_STATUS, SyncCoordinator } from '../src/core/sync-coordinator';
import type { AccountCache } from '../src/core/sync-cache';
import type { SyncOperation, SyncResult, SyncRow } from '../src/core/sync-api';

const tick = () => new Promise<void>(resolve => setImmediate(resolve));
const initial = (): AccountCache => ({ settings: { theme: 'light' }, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: false, progressPending: false, resetPending: false });
const row = (): SyncRow => ({ user_id: 'user_a', settings: { theme: 'light' }, settings_revision: 1, progress: {}, reset_generation: 0 });

test('an edit during a settings upload remains pending and is uploaded next', async () => {
  let cache = initial();
  const remote = row();
  const operations: SyncOperation[] = [];
  let finish: ((result: SyncResult) => void) | undefined;
  const coordinator = new SyncCoordinator(cache, {
    save: value => { cache = value; }, update: () => {}, confirm: async () => true,
    call: async operation => {
      operations.push(operation);
      if (operation.operation === 'settings' && !finish) return new Promise(resolve => { finish = resolve; });
      if (operation.operation === 'settings') { remote.settings = operation.data; remote.settings_revision++; }
      return { status: 'ok', row: { ...remote } };
    },
  }, true);
  coordinator.settings({ theme: 'dark' });
  coordinator.start();
  await tick();
  coordinator.settings({ theme: 'blue' });
  remote.settings_revision++;
  finish!({ status: 'ok', row: { ...remote, settings: { theme: 'dark' } } });
  await tick();
  assert.equal(cache.settingsPending, true);
  assert.deepEqual(cache.settings, { theme: 'blue' });
  coordinator.wake();
  await tick();
  assert.equal(cache.settingsPending, false);
  assert.deepEqual(remote.settings, { theme: 'blue' });
  assert.equal(operations.filter(op => op.operation === 'settings').length, 2);
  coordinator.stop();
});

test('a reset during a progress upload never merges its stale response', async () => {
  let cache = initial();
  const remote = row();
  let finish: ((result: SyncResult) => void) | undefined;
  const operations: SyncOperation[] = [];
  const coordinator = new SyncCoordinator(cache, {
    save: value => { cache = value; }, update: () => {}, confirm: async () => true,
    call: async operation => {
      operations.push(operation);
      if (operation.operation === 'progress') return new Promise(resolve => { finish = resolve; });
      if (operation.operation === 'reset') { remote.progress = {}; remote.reset_generation++; }
      return { status: 'ok', row: { ...remote } };
    },
  }, true);
  coordinator.progress({ 'minor:9:1': 2 });
  coordinator.start();
  await tick();
  coordinator.clear();
  finish!({ status: 'ok', row: { ...remote, progress: { 'minor:9:1': 2 } } });
  await tick();
  assert.deepEqual(cache.progress, {});
  assert.equal(cache.resetPending, true);
  coordinator.wake();
  await tick();
  assert.equal(cache.resetPending, false);
  assert.equal(cache.resetGeneration, 1);
  assert.deepEqual(cache.progress, {});
  assert.equal(operations.filter(op => op.operation === 'reset').length, 1);
  coordinator.stop();
});

test('a stopped session ignores an in-flight response even after restart', async () => {
  let cache = initial();
  const resolvers: ((result: SyncResult) => void)[] = [];
  const coordinator = new SyncCoordinator(cache, {
    save: value => { cache = value; }, update: () => {}, confirm: async () => true,
    call: () => new Promise(resolve => resolvers.push(resolve)),
  }, true);
  coordinator.start();
  coordinator.stop();
  coordinator.start();
  resolvers[0]({ status: 'ok', row: { ...row(), settings: { theme: 'old' }, settings_revision: 5 } });
  await tick();
  assert.deepEqual(cache.settings, { theme: 'light' });
  resolvers[1]({ status: 'ok', row: row() });
  await tick();
  assert.deepEqual(cache.settings, { theme: 'light' });
  coordinator.stop();
});

test('a second clear during a reset remains pending until another reset succeeds', async () => {
  let cache = initial();
  const remote = row();
  let finish: ((result: SyncResult) => void) | undefined;
  let resets = 0;
  const coordinator = new SyncCoordinator(cache, {
    save: value => { cache = value; }, update: () => {}, confirm: async () => true,
    call: async operation => {
      if (operation.operation === 'reset') {
        resets++;
        if (resets === 1) return new Promise(resolve => { finish = resolve; });
        remote.reset_generation++;
      }
      return { status: 'ok', row: { ...remote } };
    },
  }, true);
  coordinator.clear();
  coordinator.start();
  await tick();
  coordinator.clear();
  remote.reset_generation++;
  finish!({ status: 'ok', row: { ...remote } });
  await tick();
  assert.equal(cache.resetPending, true);
  coordinator.wake();
  await tick();
  assert.equal(resets, 2);
  assert.equal(cache.resetPending, false);
  assert.equal(cache.resetGeneration, 2);
  coordinator.stop();
});

test('storage failure does not replace the saved cache or send an unsaved edit', async () => {
  const cache = initial();
  const operations: SyncOperation[] = [];
  const statuses: string[] = [];
  const coordinator = new SyncCoordinator(cache, {
    save: () => { throw new Error('disk full'); },
    update: (_cache, status) => statuses.push(status), confirm: async () => true,
    call: async operation => { operations.push(operation); return { status: 'ok', row: row() }; },
  }, true);
  coordinator.settings({ theme: 'dark' });
  assert.match(statuses.at(-1)!, /Storage unavailable/);
  assert.deepEqual(cache.settings, { theme: 'light' });
  assert.deepEqual(operations, []);
});

// A device edit made against revision 1 while the account moved on to revision 2.
const conflicted = (): AccountCache => ({ ...initial(), settings: { theme: 'dark' }, settingsPending: true });
const moved = (): SyncRow => ({ ...row(), settings: { theme: 'light', sound: 'off' }, settings_revision: 2 });

function conflictFixture() {
  let cache = conflicted();
  const remote = moved();
  const operations: SyncOperation[] = [];
  const statuses: string[] = [];
  const questions: { conflict: string; answer: (keepDevice: boolean) => void }[] = [];
  const coordinator = new SyncCoordinator(cache, {
    save: value => { cache = value; },
    update: (_cache, status) => statuses.push(status),
    confirm: conflict => new Promise(resolve => questions.push({ conflict, answer: resolve })),
    call: async operation => {
      operations.push(operation);
      if (operation.operation === 'settings') { remote.settings = operation.data; remote.settings_revision++; }
      return { status: 'ok', row: { ...remote } };
    },
  }, true);
  return { coordinator, operations, statuses, questions, remote, cache: () => cache };
}

test('a conflict waits for the answer and sends nothing meanwhile', async () => {
  const { coordinator, operations, statuses, questions, cache } = conflictFixture();
  coordinator.start();
  await tick();
  assert.deepEqual(questions.map(question => question.conflict), ['settings']);
  assert.equal(statuses.at(-1), DECISION_STATUS);
  assert.equal(coordinator.snapshot.deciding, 'settings');
  assert.deepEqual(operations.map(op => op.operation), ['initialize']);
  coordinator.wake();
  await tick();
  assert.equal(questions.length, 1, 'a second wake-up must not ask again');
  assert.deepEqual(cache().settings, { theme: 'dark' });
  coordinator.stop();
});

test('keeping this device uploads its settings against the account revision', async () => {
  const { coordinator, operations, remote, questions, cache } = conflictFixture();
  coordinator.start();
  await tick();
  coordinator.settings({ theme: 'blue' });
  questions[0].answer(true);
  await tick();
  const upload = operations.find(op => op.operation === 'settings');
  assert.deepEqual(upload, { operation: 'settings', data: { theme: 'blue' }, expected: 2 });
  assert.deepEqual(remote.settings, { theme: 'blue' });
  assert.equal(cache().settingsPending, false);
  assert.equal(coordinator.snapshot.deciding, null);
  coordinator.stop();
});

test('using the account discards the device edit and uploads nothing', async () => {
  const { coordinator, operations, questions, cache } = conflictFixture();
  coordinator.start();
  await tick();
  questions[0].answer(false);
  await tick();
  assert.deepEqual(cache().settings, { theme: 'light', sound: 'off' });
  assert.equal(cache().settingsPending, false);
  assert.equal(operations.some(op => op.operation === 'settings'), false);
  coordinator.stop();
});

test('an answer that arrives after the session stopped changes nothing', async () => {
  const { coordinator, operations, questions, cache } = conflictFixture();
  coordinator.start();
  await tick();
  coordinator.stop();
  questions[0].answer(false);
  await tick();
  assert.deepEqual(cache().settings, { theme: 'dark' });
  assert.deepEqual(operations.map(op => op.operation), ['initialize']);
});
