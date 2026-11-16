import { test, expect } from '@playwright/test';

const SAVED = { version: 4, root: 2, scaleId: 'dorian' };

test('a render failure offers a way back instead of a blank page, and keeps the saved view until asked', async ({ page }) => {
  // The first page load fails while rendering: the board's orientation query throws. Later loads work.
  await page.addInitScript(saved => {
    if (sessionStorage.getItem('failed-once')) return;
    sessionStorage.setItem('failed-once', '1');
    localStorage.setItem('fret-atlas-v4', JSON.stringify(saved));
    const matchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => { if (query.includes('orientation')) throw new Error('Simulated render failure'); return matchMedia(query); };
  }, SAVED);
  await page.goto('/');

  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Something went wrong');
  await expect(alert.getByRole('button', { name: 'Try again', exact: true })).toBeVisible();
  // Nothing is replaced until the person chooses to.
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('fret-atlas-v4') ?? 'null'))).toEqual(SAVED);
  await expect(alert).toContainText('replaces the view saved on this device');

  await alert.getByRole('button', { name: 'Open the default view', exact: true }).click();
  await expect(page).toHaveURL(/\?atlas=v1$/);
  await expect(page.getByRole('combobox', { name: 'Key', exact: true })).toHaveValue('9');
  await expect(page.getByRole('combobox', { name: 'Scale', exact: true })).toHaveValue('minor-pentatonic');
});
