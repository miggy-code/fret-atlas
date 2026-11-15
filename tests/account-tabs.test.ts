import test from 'node:test';
import assert from 'node:assert/strict';
import { TabSession } from '../src/core/account-tabs';
import type { Leader, Locks, TabView } from '../src/core/account-tabs';
import { applyEdit } from '../src/core/sync-edit';
import type { Edit } from '../src/core/sync-edit';
import { SyncCoordinator } from '../src/core/sync-coordinator';
import type { AccountCache } from '../src/core/sync-cache';
import type { SyncOperation, SyncRow } from '../src/core/sync-api';

/** A Web Lock manager in miniature: one exclusive lock per name, granted in request order. */
class FakeLocks implements Locks {
  private queues = new Map<string, Promise<unknown>>();
  request(name: string, hold: () => Promise<void>) {
    const run = (this.queues.get(name) ?? Promise.resolve()).then(hold);
    this.queues.set(name, run.catch(() => {}));
    return run;
  }
}

async function until(condition: () => boolean, what: string) {
  for (let waited = 0; waited < 4000; waited += 10) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.fail(`timed out waiting for ${what}`);
}

/** One browser profile: the shared locks, the shared account cache in local storage, and the server. */
function world() {
  const channel = `account-${Math.random()}`;
  const locks = new FakeLocks();
  const server: SyncRow = { user_id: 'user_a', settings: { view: {}, theme: 'light', sound: 'on' }, settings_revision: 1, progress: {}, reset_generation: 0 };
  const stored: { cache: AccountCache } = { cache: { settings: { ...server.settings }, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: false, progressPending: false, resetPending: false } };
  const calls: SyncOperation[] = [];

  function tab() {
    const views: { view: TabView; displayChanged: boolean }[] = [];
    const failures: unknown[] = [];
    const waits: boolean[] = [];
    let coordinator: SyncCoordinator | undefined;
    const session = new TabSession({
      locks, lock: 'lock', channel: () => new BroadcastChannel(channel),
      show: (view, displayChanged) => views.push({ view, displayChanged }),
      fail: error => failures.push(error), waiting: waiting => waits.push(waiting),
      lead: async changed => {
        // Like the app: the new leader starts from what the previous one saved.
        const current = new SyncCoordinator(stored.cache, {
          save: cache => { stored.cache = cache; },
          update: (_cache, _status, displayChanged) => changed(displayChanged),
          confirm: async () => true,
          call: async operation => {
            calls.push(operation);
            if (operation.operation === 'settings' && operation.expected === server.settings_revision) { server.settings = operation.data; server.settings_revision++; }
            return { status: 'ok', row: { ...server } };
          },
        }, true);
        coordinator = current;
        const leader: Leader = {
          start: () => current.start(), stop: () => current.stop(),
          apply: (edit: Edit) => applyEdit(current, edit),
          view: () => ({ cache: current.snapshot.cache, status: current.snapshot.status, deciding: current.snapshot.deciding !== null }),
        };
        return leader;
      },
    });
    return { session, views, failures, waits, last: () => views.at(-1)!.view, coordinator: () => coordinator };
  }
  return { tab, server, stored, calls };
}

test('the first tab leads and the second follows what it publishes', async () => {
  const { tab } = world();
  const first = tab();
  first.session.start();
  await until(() => first.views.length > 0, 'the leader view');
  const second = tab();
  second.session.start();
  await until(() => second.views.length > 0, 'the follower view');
  assert.equal(first.session.role, 'leader');
  assert.equal(second.session.role, 'follower');
  assert.deepEqual(second.last().cache.settings, first.last().cache.settings);
  first.session.stop(); second.session.stop();
});

test('an edit made in a follower tab syncs to the account and shows in the leader', async () => {
  const { tab, server } = world();
  const leader = tab();
  const follower = tab();
  leader.session.start();
  await until(() => leader.views.length > 0, 'the leader');
  follower.session.start();
  await until(() => follower.views.length > 0, 'the follower');
  follower.session.edit({ settings: { theme: 'dark' } });
  await until(() => server.settings.theme === 'dark', 'the account to receive the edit');
  assert.equal(server.settings_revision, 2);
  // The leader's screen takes up the follower's change; the follower already shows its own.
  await until(() => leader.views.some(entry => entry.displayChanged && entry.view.cache.settings.theme === 'dark'), 'the leader to show the edit');
  await until(() => follower.last().status === 'Synced', 'the follower to see the sync finish');
  assert.equal(follower.views.some(entry => entry.displayChanged), false);
  leader.session.stop(); follower.session.stop();
});

test('a follower reports that it holds unconfirmed edits until the leader takes them', async () => {
  const { tab } = world();
  const leader = tab();
  const follower = tab();
  leader.session.start();
  await until(() => leader.views.length > 0, 'the leader');
  follower.session.start();
  await until(() => follower.views.length > 0, 'the follower');
  follower.session.edit({ settings: { theme: 'dark' } });
  assert.deepEqual(follower.waits, [true]);
  await until(() => follower.waits.length === 2, 'the leader to confirm');
  assert.deepEqual(follower.waits, [true, false]);
  assert.deepEqual(leader.waits, [], 'the leader saves its own edits and never waits');
  leader.session.stop(); follower.session.stop();
});

test('closing the leader hands over to the next tab, which keeps syncing', async () => {
  const { tab, server, calls } = world();
  const first = tab();
  const second = tab();
  const third = tab();
  first.session.start();
  await until(() => first.views.length > 0, 'the first leader');
  second.session.start();
  third.session.start();
  await until(() => second.views.length > 0 && third.views.length > 0, 'the followers');
  second.session.edit({ settings: { view: { root: 2 } } });
  await until(() => (server.settings.view as Record<string, unknown>).root === 2, 'the first sync');
  first.session.stop();
  await until(() => second.session.role === 'leader', 'the next tab to take over');
  assert.equal(third.session.role, 'follower');
  // The new leader starts from the cache the old one saved, and edits from the other follower reach it.
  assert.deepEqual((second.last().cache.settings.view as Record<string, unknown>).root, 2);
  third.session.edit({ settings: { sound: 'off' } });
  await until(() => server.settings.sound === 'off', 'the new leader to sync');
  assert.deepEqual(server.settings.view, { root: 2 });
  assert.ok(calls.filter(call => call.operation === 'settings').length >= 2);
  second.session.stop(); third.session.stop();
});

test('an edit made while there is no leader is applied by the tab that takes over', async () => {
  const { tab, server } = world();
  const first = tab();
  const second = tab();
  first.session.start();
  await until(() => first.views.length > 0, 'the leader');
  second.session.start();
  await until(() => second.views.length > 0, 'the follower');
  first.session.stop();
  second.session.edit({ settings: { theme: 'dark' } });
  await until(() => server.settings.theme === 'dark', 'the edit to reach the account');
  assert.equal(second.session.role, 'leader');
  second.session.stop();
});

test('no edit is lost when two tabs change different settings at once', async () => {
  const { tab, server, stored } = world();
  const leader = tab();
  const follower = tab();
  leader.session.start();
  await until(() => leader.views.length > 0, 'the leader');
  follower.session.start();
  await until(() => follower.views.length > 0, 'the follower');
  // Neither tab has seen the other's change: each sends only what it changed.
  leader.session.edit({ settings: { view: { leftHanded: true } } });
  follower.session.edit({ settings: { theme: 'dark' } });
  follower.session.edit({ progress: { 'minor:9:1': 2 } });
  leader.session.edit({ progress: { 'minor:9:2': 1 } });
  await until(() => server.settings.theme === 'dark' && (server.settings.view as Record<string, unknown>).leftHanded === true, 'both settings to reach the account');
  assert.equal(server.settings.sound, 'on');
  await until(() => leader.last().cache.progress['minor:9:1'] === 2 && follower.last().cache.progress['minor:9:2'] === 1, 'both tabs to hold both progress marks');
  assert.deepEqual(stored.cache.progress, { 'minor:9:1': 2, 'minor:9:2': 1 });
  // Each tab is told about the change it did not make.
  assert.ok(follower.views.some(entry => entry.displayChanged && (entry.view.cache.settings.view as Record<string, unknown>).leftHanded === true));
  assert.ok(leader.views.some(entry => entry.displayChanged && entry.view.cache.settings.theme === 'dark'));
  leader.session.stop(); follower.session.stop();
});

test('a leader that cannot start reports it instead of leaving the tab waiting', async () => {
  const locks = new FakeLocks();
  const failures: unknown[] = [];
  const session = new TabSession({
    locks, lock: 'lock', channel: () => new BroadcastChannel(`account-${Math.random()}`), show: () => {}, fail: error => failures.push(error), waiting: () => {},
    lead: async () => { throw new Error('damaged'); },
  });
  session.start();
  await until(() => failures.length === 1, 'the failure');
  session.stop();
});
