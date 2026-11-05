import { test, expect } from '@playwright/test';

test('does not send an account cache with a different user token', async ({ page }) => {
  let calls = 0;
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => { calls++; await route.fulfill({ status: 500 }); });
  page.on('dialog', dialog => dialog.dismiss());
  await page.goto('/tests/sync-harness.html?user=user_a&tokenUser=user_b');
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
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/sync-harness.html?user=user_a');
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
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(rows.user_b.settings.view).toMatchObject({ leftHanded: false });
  expect(rows.user_a.settings.view).toMatchObject({ leftHanded: true });
});

test('retains stale offline progress until the user resolves a reset', async ({ page }) => {
  const operations: string[] = [];
  const row = { user_id: 'user_a', settings: { view: {}, theme: 'light', sound: 'on' }, settings_revision: 2, progress: {}, reset_generation: 1 };
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    const op = route.request().postDataJSON();
    operations.push(op.operation);
    await route.fulfill({ json: { status: 'ok', row } });
  });
  await page.addInitScript(() => localStorage.setItem('fret-atlas-account:user_a', JSON.stringify({ settings: { view: {}, theme: 'light', sound: 'on' }, progress: { 'minor:9:1': 2 }, settingsRevision: 2, resetGeneration: 0, settingsPending: false, progressPending: true, resetPending: false })));
  page.on('dialog', dialog => dialog.dismiss());
  await page.goto('/tests/sync-harness.html?user=user_a');
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
    await route.fulfill({ json: { status: 'ok', row: { user_id: 'user_a', settings: savedSettings, settings_revision: revision, progress: {}, reset_generation: 0 } } });
  });
  await page.addInitScript(() => localStorage.setItem('fret-atlas-account:user_a', JSON.stringify({ settings: { view: {}, theme: 'dark', sound: 'on' }, progress: {}, settingsRevision: 1, resetGeneration: 0, settingsPending: true, progressPending: false, resetPending: false })));
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(savedSettings.theme).toBe('dark');
  expect(revision).toBe(3);
});

test('clearing progress queues a reset and does not restore pre-reset progress', async ({ page }) => {
  let offline = false;
  let generation = 0;
  let serverProgress: Record<string, number> = { 'minor:9:1': 2 };
  const settings = { view: {}, theme: 'light', sound: 'on' };
  await page.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    if (offline) return route.fulfill({ status: 503, body: '' });
    const op = route.request().postDataJSON();
    if (op.operation === 'reset') { expect(op.expected).toBe(generation); generation++; serverProgress = {}; }
    if (op.operation === 'progress') Object.assign(serverProgress, op.data);
    await route.fulfill({ json: { status: 'ok', row: { user_id: 'user_a', settings, settings_revision: 1, progress: serverProgress, reset_generation: generation } } });
  });
  await page.addInitScript(() => localStorage.setItem('fret-atlas-account:user_a', JSON.stringify({ settings: { view: {}, theme: 'light', sound: 'on' }, progress: { 'minor:9:1': 2 }, settingsRevision: 1, resetGeneration: 0, settingsPending: false, progressPending: false, resetPending: false })));
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  offline = true;
  await page.getByRole('tab', { name: 'Practice' }).click();
  await page.getByRole('button', { name: 'Clear progress' }).click();
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

test('prevents two tabs from overwriting the same account cache', async ({ page, context }) => {
  await context.route('https://sync.test/rest/v1/rpc/sync_change', async route => {
    const op = route.request().postDataJSON();
    const settings = op.operation === 'settings' ? op.data : {};
    await route.fulfill({ json: { status: 'ok', row: { user_id: 'user_a', settings, settings_revision: op.operation === 'settings' ? 1 : 0, progress: {}, reset_generation: 0 } } });
  });
  page.on('dialog', dialog => dialog.dismiss());
  await page.goto('/tests/sync-harness.html?user=user_a');
  await expect(page.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/tests/sync-harness.html?user=user_a');
  await expect(other.getByRole('alert')).toContainText('open in another tab');
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
  await deviceA.route('https://sync.test/rest/v1/rpc/sync_change', handler(true));
  await deviceB.route('https://sync.test/rest/v1/rpc/sync_change', handler(false));
  const a = await deviceA.newPage();
  const b = await deviceB.newPage();
  a.on('dialog', dialog => dialog.accept());
  b.on('dialog', dialog => dialog.accept());
  await a.goto('http://127.0.0.1:4179/tests/sync-harness.html?user=user_a');
  await b.goto('http://127.0.0.1:4179/tests/sync-harness.html?user=user_a');
  await expect(a.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  await expect(b.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  offlineA = true;
  await a.getByRole('button', { name: 'Settings', exact: true }).click();
  await a.getByRole('checkbox', { name: 'Dark mode' }).check();
  await expect(a.getByRole('status').filter({ hasText: 'Sync failed' })).toBeVisible();
  await b.getByRole('button', { name: 'Settings', exact: true }).click();
  await b.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect(b.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  let asked = false;
  a.removeAllListeners('dialog');
  a.on('dialog', dialog => { asked = true; return dialog.accept(); });
  offlineA = false;
  await a.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(a.getByRole('status').filter({ hasText: 'Synced' })).toBeVisible();
  expect(asked).toBe(true);
  expect(settings.theme).toBe('dark');
  await deviceA.close();
  await deviceB.close();
});
