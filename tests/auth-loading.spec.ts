import { test, expect } from '@playwright/test';

test('opens the fretboard immediately when account loading stalls', async ({ page, context }) => {
  // A session cookie makes the page load Clerk at once; with Clerk unreachable, the board must not wait for it.
  await context.addCookies([{ name: '__client_uat', value: '1767225600', url: 'http://127.0.0.1' }]);
  await page.route(/clerk[^/]*\//, route => route.abort());
  await page.goto('/tests/clerk-harness.html');
  await expect(page.getByRole('heading', { name: 'Minor pentatonic' })).toBeVisible({ timeout: 3000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeAttached();
  await page.reload();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Left-handed' })).toBeChecked();
});
