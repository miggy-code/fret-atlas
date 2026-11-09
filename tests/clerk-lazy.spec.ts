import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// The harness uses a publishable key for this host; nothing is listening there.
const FRONTEND_API = 'https://clerk.fretory-test.example/**';
const CLERK_REQUEST = /@clerk|clerk\.browser|ClerkBridge|clerk\.fretory-test\.example/;

function watch(page: Page) {
  const urls: string[] = [];
  page.on('request', request => urls.push(request.url()));
  return { clerk: () => urls.filter(url => CLERK_REQUEST.test(url)) };
}

test('a signed-out visitor loads no Clerk code, and the board is ready', async ({ page }) => {
  const requests = watch(page);
  await page.route(FRONTEND_API, route => route.abort());
  await page.goto('/tests/clerk-harness.html');
  await expect(page.getByRole('heading', { name: 'Minor pentatonic' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Left-handed' }).check();
  await expect(page.getByRole('status').filter({ hasText: 'Saved on this device' })).toBeAttached();
  await page.waitForLoadState('networkidle');
  expect(requests.clerk()).toEqual([]);
});

test('Sign in is a plain button that loads Clerk when pressed', async ({ page }) => {
  const requests = watch(page);
  await page.route(FRONTEND_API, route => route.abort());
  await page.goto('/tests/clerk-harness.html');
  await page.waitForLoadState('networkidle');
  expect(requests.clerk()).toEqual([]);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect.poll(() => requests.clerk().some(url => url.includes('ClerkBridge'))).toBe(true);
  await expect.poll(() => requests.clerk().some(url => url.includes('clerk.fretory-test.example'))).toBe(true);
  // The board stays usable while Clerk loads, and keeps what the visitor was doing.
  await expect(page.getByRole('heading', { name: 'Minor pentatonic' })).toBeVisible();
});

test('an existing session loads Clerk at once without offering Sign in, and the board still works', async ({ page, context }) => {
  const requests = watch(page);
  await page.route(FRONTEND_API, route => route.abort());
  await context.addCookies([{ name: '__client_uat', value: '1767225600', url: 'http://127.0.0.1' }]);
  await page.goto('/tests/clerk-harness.html');
  await expect.poll(() => requests.clerk().some(url => url.includes('clerk.fretory-test.example'))).toBe(true);
  await expect(page.getByRole('heading', { name: 'Minor pentatonic' })).toBeVisible();
  // Clerk has not answered, so the top bar neither shows Sign in to someone who is signed in nor blocks the board.
  await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Practice' }).click();
  await expect(page.getByRole('tab', { name: 'Practice' })).toHaveAttribute('aria-selected', 'true');
});

test('a signed-out cookie does not load Clerk', async ({ page, context }) => {
  const requests = watch(page);
  await context.addCookies([{ name: '__client_uat', value: '0', url: 'http://127.0.0.1' }, { name: '__client_uat_AbCdEfGh', value: '0', url: 'http://127.0.0.1' }]);
  await page.goto('/tests/clerk-harness.html');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests.clerk()).toEqual([]);
});
