import { test, expect } from '@playwright/test';
import { buildSyncRow, seedAccountCache } from './factories';
import type { Progress } from '../src/core/progress';
import type { Page } from '@playwright/test';

// Sync questions are in-app dialogs; each button names what it keeps.
const answer = (page: Page, name: string) => page.getByRole('dialog').getByRole('button', { name }).click();
const IMPORT = 'Import this device’s data';
const NO_IMPORT = 'Use the account without importing';
const KEEP_SETTINGS = 'Keep this device’s settings';
const USE_PROGRESS = 'Use account progress';

test('does not send an account cache with a different user token', async ({ page }) => {
  let calls = 0;
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => { calls++; await route.fulfill({ status: 500 }); });
  await page.goto('/tests/sync-harness.html?user=user_a&tokenUser=user_b');
  await answer(page, NO_IMPORT);
  await expect(page.getByRole('status').filter({ hasText: 'Sync failed' })).toBeVisible();
  expect(calls).toBe(0);
});

test('imports device data, syncs edits, retains failures and isolates accounts', async ({ page }) => {
  let offline = false;
  const rows: Record<string, { user_id: string; settings: Record<string, unknown>; settings_revision: number; progress: Record<string, number>; reset_generation: number }> = {};
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    if (offline) return route.fulfill({ status: 503, body: '' });
    const request = route.request();
    const token = request.headers().authorization.split(' ')[1];
    const userId = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub;
    const row = rows[userId] ??= { user_id: userId, settings: {}, settings_revision: 0, progress: {}, reset_generation: 0 };
    const operation = request.postDataJSON();
    let status = 'ok';
    if (operation.operation === 'settings') {
      if (operation.expected !== row.settings_revision) status = 'conflict';
      else { row.settings = operation.data; row.settings_revision++; }
    }
    if (operation.operation === 'progress') {
      if (operation.expected !== row.reset_generation) status = 'reset_conflict';
      else for (const [key, level] of Object.entries(operation.data)) row.progress[key] = Math.max(row.progress[key] ?? 0, level as number);
    }
    if (operation.operation === 'reset') {
      if (operation.expected !== row.reset_generation) status = 'reset_conflict';
      else { row.progress = {}; row.reset_generation++; }
    }
    await route.fulfill({ json: { status, row } });
  });
  await page.addInitScript(() => { localStorage.setItem('fret-atlas-progress', '{"minor:9:1":2}'); });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await answer(page, IMPORT);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(rows.user_a.progress['minor:9:1']).toBe(2);
  expect(await page.evaluate(() => localStorage.getItem('fret-atlas-progress'))).toBe('{"minor:9:1":2}');
  offline = true;
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect(page.getByRole('status').filter({ hasText: 'Sync failed' })).toBeVisible();
  const cache = await page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-account:user_a')!));
  expect(cache.settingsPending).toBe(true);
  offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(rows.user_a.settings.view).toMatchObject({ leftHanded: true });
  await page.goto('/tests/sync-harness.html?user=user_b');
  await answer(page, IMPORT);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(rows.user_b.settings.view).toMatchObject({ leftHanded: false });
  expect(rows.user_a.settings.view).toMatchObject({ leftHanded: true });
});

test('declining the device import adopts the account settings without a second question', async ({ page }) => {
  const row = buildSyncRow({ settings: { view: { leftHanded: true }, theme: 'dark', sound: 'on' }, settings_revision: 3, progress: { 'minor:9:1': 2 } });
  const uploads: Record<string, unknown>[] = [];
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    const operation = route.request().postDataJSON();
    if (operation.operation === 'settings') { uploads.push(operation.data); row.settings = operation.data; row.settings_revision++; }
    await route.fulfill({ json: { status: 'ok', row } });
  });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('dialog', { name: 'Set up your account' })).toBeVisible();
  await answer(page, NO_IMPORT);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  // Only the account's own settings, normalized by the app, may be written back; never device defaults.
  for (const upload of uploads) expect(upload).toMatchObject({ view: { leftHanded: true }, theme: 'dark' });
  const cache = await page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-account:user_a')!));
  expect(cache).toMatchObject({ settingsPending: false, progress: { 'minor:9:1': 2 } });
});

test('retains stale offline progress until the user resolves a reset', async ({ page }) => {
  const operations: string[] = [];
  const row = buildSyncRow({ settings_revision: 2, reset_generation: 1 });
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    const op = route.request().postDataJSON();
    operations.push(op.operation);
    await route.fulfill({ json: { status: 'ok', row } });
  });
  await seedAccountCache(page, 'user_a', { progress: { 'minor:9:1': 2 }, settingsRevision: 2, resetGeneration: 0, progressPending: true });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('dialog', { name: 'Progress was cleared elsewhere' })).toBeVisible();
  await answer(page, USE_PROGRESS);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-account:user_a')!));
  expect(saved.progress).toEqual({});
  expect(saved.resetGeneration).toBe(1);
  expect(operations).not.toContain('progress');
});

test('settings conflict keeps the chosen device copy using the current revision', async ({ page }) => {
  let revision = 2;
  let savedSettings: Record<string, unknown> = { view: {}, theme: 'light', sound: 'on' };
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    const op = route.request().postDataJSON();
    if (op.operation === 'settings') {
      expect(op.expected).toBe(revision);
      savedSettings = op.data;
      revision++;
    }
    await route.fulfill({ json: { status: 'ok', row: buildSyncRow({ settings: savedSettings, settings_revision: revision }) } });
  });
  await seedAccountCache(page, 'user_a', { settings: { view: {}, theme: 'dark', sound: 'on' }, settingsRevision: 1, settingsPending: true });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await answer(page, KEEP_SETTINGS);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(savedSettings.theme).toBe('dark');
  expect(revision).toBe(3);
});

test('clearing progress queues a reset and does not restore pre-reset progress', async ({ page }) => {
  let offline = false;
  let generation = 0;
  let serverProgress: Progress = { 'minor:9:1': 2 };
  const settings = { view: {}, theme: 'light', sound: 'on' };
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    if (offline) return route.fulfill({ status: 503, body: '' });
    const op = route.request().postDataJSON();
    if (op.operation === 'reset') { expect(op.expected).toBe(generation); generation++; serverProgress = {}; }
    if (op.operation === 'progress') Object.assign(serverProgress, op.data);
    await route.fulfill({ json: { status: 'ok', row: buildSyncRow({ settings, progress: serverProgress, reset_generation: generation }) } });
  });
  await seedAccountCache(page, 'user_a', { progress: { 'minor:9:1': 2 }, resetGeneration: 0 });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  offline = true;
  await page.getByRole('tab', { name: 'Practice' }).click();
  await page.getByRole('button', { name: 'Clear progress' }).click();
  // The account-wide wording is shown when signed in.
  await expect(page.getByRole('dialog', { name: 'Clear all progress?' })).toContainText('every device signed in to this account');
  await answer(page, 'Clear progress');
  await expect(page.getByRole('status').filter({ hasText: 'Sync failed' })).toBeVisible();
  const pending = await page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-account:user_a')!));
  expect(pending.resetPending).toBe(true);
  expect(pending.progress).toEqual({});
  offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(generation).toBe(1);
  expect(serverProgress).toEqual({});
});

/** A server that keeps one account's row, shared by every tab and device that routes to it. */
function accountServer(initial: { settings?: Record<string, unknown>; progress?: Record<string, number> } = {}) {
  const row = { user_id: 'user_a', settings: initial.settings ?? { view: {}, theme: 'light', sound: 'on' }, settings_revision: 1, progress: initial.progress ?? {}, reset_generation: 0 };
  const operations: string[] = [];
  const handler = async (route: import('@playwright/test').Route) => {
    const op = route.request().postDataJSON();
    operations.push(op.operation);
    let status = 'ok';
    if (op.operation === 'settings') {
      if (op.expected !== row.settings_revision) status = 'conflict';
      else { row.settings = op.data; row.settings_revision++; }
    }
    if (op.operation === 'progress') for (const [key, level] of Object.entries(op.data)) row.progress[key] = Math.max(row.progress[key] ?? 0, level as number);
    await route.fulfill({ json: { status, row } });
  };
  return { row, operations, handler };
}
const cached = (settings: Record<string, unknown>) => JSON.stringify({ settings, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: false, progressPending: false, resetPending: false });
const READY = { view: {}, theme: 'light', sound: 'on' };
const SYNC_URL = 'https://sync.test/rest/v1/rpc/sync_change';

test('a second tab opens fully usable and follows the first', async ({ page, context }) => {
  const server = accountServer();
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/tests/sync-harness.html?user=user_a');
  await expect(other.getByRole('alert')).toHaveCount(0);
  await expect(other.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(other.getByRole('tab', { name: 'Practice' })).toBeEnabled();
});

test('an edit made in a follower tab syncs and appears in the leader without losing its place', async ({ page, context }) => {
  const server = accountServer();
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const follower = await context.newPage();
  await follower.goto('/tests/sync-harness.html?user=user_a');
  await expect(follower.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await page.getByRole('tab', { name: 'Practice' }).click();
  await follower.getByRole('button', { name: 'Settings', exact: true }).click();
  await follower.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect.poll(() => (server.row.settings.view as Record<string, unknown>).leftHanded).toBe(true);
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness', 'left');
  // The leader took the follower's change without remounting, so it is still on Practice.
  await expect(page.getByRole('tab', { name: 'Practice' })).toHaveAttribute('aria-selected', 'true');
});

test('closing the first tab hands over to the next, which keeps syncing', async ({ page, context }) => {
  const server = accountServer();
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const next = await context.newPage();
  await next.goto('/tests/sync-harness.html?user=user_a');
  await expect(next.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await page.close();
  await next.getByRole('button', { name: 'Settings', exact: true }).click();
  await next.getByRole('checkbox', { name: 'Dark mode' }).check();
  await expect.poll(() => server.row.settings.theme).toBe('dark');
  await expect(next.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
});

test('a follower shows its own edit at once, and says it is not saved while the leader cannot take it', async ({ page, context }) => {
  const server = accountServer();
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const follower = await context.newPage();
  await follower.goto('/tests/sync-harness.html?user=user_a');
  await expect(follower.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await follower.getByRole('button', { name: 'Settings', exact: true }).click();

  // The leader's page is stuck, as a busy or frozen background tab would be.
  const stuck = page.evaluate(() => { const end = Date.now() + 4000; while (Date.now() < end) { /* hold the thread */ } });
  await follower.getByRole('checkbox', { name: 'Left-handed' }).check();
  // Only saving waits for the leader: the follower's own board changes now.
  await expect(follower.locator('.fretboard')).toHaveAttribute('data-handedness', 'left', { timeout: 500 });
  await expect(follower.getByRole('checkbox', { name: 'Left-handed' })).toBeChecked();
  expect((server.row.settings.view as Record<string, unknown>).leftHanded).toBeUndefined();
  await expect(follower.getByRole('status').filter({ hasText: 'Not saved yet' })).toBeVisible();

  await stuck;
  await expect.poll(() => (server.row.settings.view as Record<string, unknown>).leftHanded).toBe(true);
  await expect(follower.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(follower.locator('.fretboard')).toHaveAttribute('data-handedness', 'left');
});

test('no edit is lost when two tabs change different settings', async ({ page, context }) => {
  const server = accountServer();
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/tests/sync-harness.html?user=user_a');
  await expect(other.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  // Each tab changes a different setting; neither has seen the other's.
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await other.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Left-handed' }).check();
  await other.getByRole('checkbox', { name: 'Dark mode' }).check();
  await expect.poll(() => [(server.row.settings.view as Record<string, unknown>).leftHanded, server.row.settings.theme]).toEqual([true, 'dark']);
  // Both tabs end up showing both.
  for (const tab of [page, other]) {
    await expect(tab.getByRole('checkbox', { name: 'Left-handed' })).toBeChecked();
    await expect(tab.getByRole('checkbox', { name: 'Dark mode' })).toBeChecked();
  }
});

test('a settings change from elsewhere keeps the tab, and waits for a drill to end', async ({ page }) => {
  const server = accountServer();
  await page.route(SYNC_URL, server.handler);
  await page.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await page.getByRole('tab', { name: 'Practice' }).click();
  // The account changes on another device; the next sync picks it up.
  const remote = (settings: Record<string, unknown>) => { server.row.settings = settings; server.row.settings_revision++; };
  remote({ view: { leftHanded: true }, theme: 'dark', sound: 'on' });
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness', 'left');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('tab', { name: 'Practice' })).toHaveAttribute('aria-selected', 'true');
  // A drill is not changed under the player; the change lands when it ends.
  const drill = page.getByRole('region', { name: 'Practice drill' });
  await page.getByRole('button', { name: 'Find notes' }).click();
  await expect(drill).toBeVisible();
  remote({ view: { leftHanded: false }, theme: 'dark', sound: 'on' });
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness', 'left');
  await expect(drill).toBeVisible();
  await drill.getByRole('button', { name: 'End' }).click();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness', 'right');
});

test('dismissing a sync question never discards data: sync waits and the question can be reopened', async ({ page }) => {
  const server = accountServer({ settings: { view: {}, theme: 'light', sound: 'on' } });
  server.row.settings_revision = 2;
  await page.route(SYNC_URL, server.handler);
  await page.addInitScript(() => localStorage.setItem('fret-atlas-account:user_a', JSON.stringify({ settings: { view: {}, theme: 'dark', sound: 'on' }, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: true, progressPending: false, resetPending: false })));
  await page.goto('/tests/sync-harness.html?user=user_a');
  const dialog = page.getByRole('dialog', { name: 'Your settings differ' });
  await expect(dialog).toBeVisible();
  // Focus lands on the heading, not on a button that a stray keypress could activate.
  await expect(dialog.getByRole('heading')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const reminder = page.getByRole('button', { name: 'Choose' });
  await expect(reminder).toBeFocused();
  await expect(page.getByRole('status').filter({ hasText: 'decision is needed' })).toBeVisible();
  // Nothing was sent and the device's edit is still waiting to be decided.
  expect(server.operations.filter(op => op === 'settings')).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-account:user_a')!).settingsPending)).toBe(true);
  await reminder.click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(reminder).toBeFocused();
  await reminder.click();
  await answer(page, KEEP_SETTINGS);
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(server.row.settings.theme).toBe('dark');
});

test('another tab says where to answer a sync question', async ({ page, context }) => {
  const server = accountServer();
  server.row.settings_revision = 2;
  await context.route(SYNC_URL, server.handler);
  await context.addInitScript(() => { if (!localStorage.getItem('fret-atlas-account:user_a')) localStorage.setItem('fret-atlas-account:user_a', JSON.stringify({ settings: { view: {}, theme: 'dark', sound: 'on' }, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: true, progressPending: false, resetPending: false })); });
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('dialog', { name: 'Your settings differ' })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/tests/sync-harness.html?user=user_a');
  await expect(other.getByRole('status').filter({ hasText: 'decide in your other Fretory tab' })).toBeVisible();
  await answer(page, 'Use account settings');
  await expect(other.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
});

test('two devices preserve an offline settings edit until a conflict is resolved', async ({ browser }) => {
  const deviceA = await browser.newContext();
  const deviceB = await browser.newContext();
  let offlineA = false;
  let revision = 1;
  let settings: Record<string, unknown> = { view: {}, theme: 'light', sound: 'on' };
  const handler = (first: boolean) => async (route: import('@playwright/test').Route) => {
    if (first && offlineA) return route.fulfill({ status: 503, body: '' });
    const op = route.request().postDataJSON();
    let status = 'ok';
    if (op.operation === 'settings') {
      if (op.expected !== revision) status = 'conflict';
      else { settings = op.data; revision++; }
    }
    await route.fulfill({ json: { status, row: { user_id: 'user_a', settings, settings_revision: revision, progress: {}, reset_generation: 0 } } });
  };
  await deviceA.route(SYNC_URL, handler(true));
  await deviceB.route(SYNC_URL, handler(false));
  const a = await deviceA.newPage();
  const b = await deviceB.newPage();
  const baseURL = test.info().project.use.baseURL;
  await a.goto(new URL('/tests/sync-harness.html?user=user_a', baseURL).href);
  await answer(a, NO_IMPORT);
  await expect(a.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await b.goto(new URL('/tests/sync-harness.html?user=user_a', baseURL).href);
  await answer(b, NO_IMPORT);
  await expect(b.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  offlineA = true;
  await a.getByRole('button', { name: 'Settings', exact: true }).click();
  await a.getByRole('checkbox', { name: 'Dark mode' }).check();
  await expect(a.getByRole('status').filter({ hasText: 'Sync failed' })).toBeVisible();
  await b.getByRole('button', { name: 'Settings', exact: true }).click();
  await b.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect(b.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  offlineA = false;
  await a.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(a.getByRole('dialog', { name: 'Your settings differ' })).toBeVisible();
  await answer(a, KEEP_SETTINGS);
  await expect(a.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(settings.theme).toBe('dark');
  await deviceA.close();
  await deviceB.close();
});

test('changes made on the device while the account was loading are applied to the account, not lost', async ({ page }) => {
  const server = accountServer();
  await page.route(SYNC_URL, server.handler);
  await page.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a&carry=dark');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(server.row.settings.theme).toBe('dark');
});

test('a carried change that meets a newer account copy asks which to keep', async ({ page }) => {
  const server = accountServer({ settings: { view: { leftHanded: true }, theme: 'light', sound: 'on' } });
  server.row.settings_revision = 2;
  await page.route(SYNC_URL, server.handler);
  await page.addInitScript(settings => localStorage.setItem('fret-atlas-account:user_a', settings), cached(READY));
  await page.goto('/tests/sync-harness.html?user=user_a&carry=dark');
  await expect(page.getByRole('dialog', { name: 'Your settings differ' })).toBeVisible();
  await answer(page, 'Use account settings');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.fretboard')).toHaveAttribute('data-handedness', 'left');
});
