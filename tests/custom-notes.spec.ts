import { test, expect } from '@playwright/test';

// Custom notes is a detour from a named scale: it must always offer a way back.
test('custom notes can be left to return to the scale it started from', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, scaleId: 'dorian', root: 2 })));
  await page.goto('/');
  const scaleSelect = page.locator('#scale');
  const before = await scaleSelect.inputValue();
  expect(before).toBe('dorian');

  await page.getByRole('button', { name: 'Customize notes' }).click();
  await expect(scaleSelect).toHaveValue('custom');
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByRole('button', { name: 'Toggle D', exact: true }).click();

  const back = page.getByRole('button', { name: /^Back to / });
  await expect(back).toBeVisible();
  await back.click();

  await expect(scaleSelect).toHaveValue(before);
  await expect(page.locator('.degree-legend .scale-tone-chip')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Customize notes' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Back to / })).toHaveCount(0);
});

test('custom notes opened from a saved custom selection still offers a way out', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, scaleId: 'custom', customPitches: [0, 3, 7] })));
  await page.goto('/');
  await page.getByRole('button', { name: /^Back to / }).click();
  await expect(page.locator('#scale')).not.toHaveValue('custom');
  await expect(page.getByRole('button', { name: 'Customize notes' })).toBeVisible();
});
