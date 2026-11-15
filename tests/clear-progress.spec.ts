import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('fret-atlas-progress') ?? '{}'));

test('Clear progress asks in the page, and only the named button clears', async ({ page }) => {
  const native: string[] = [];
  page.on('dialog', dialog => { native.push(dialog.message()); dialog.dismiss(); });
  await page.addInitScript(() => { if (!localStorage.getItem('fret-atlas-progress')) localStorage.setItem('fret-atlas-progress', '{"minor:9:1":2}'); });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Practice' }).click();
  const trigger = page.getByRole('button', { name: 'Clear progress' });
  const dialog = page.getByRole('dialog', { name: 'Clear all progress?' });

  await trigger.click();
  await expect(dialog).toBeVisible();
  // Focus lands on the heading, so a stray Enter cannot clear anything.
  await expect(dialog.getByRole('heading')).toBeFocused();

  // Escape keeps progress and returns focus to the button that asked.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await stored(page)).toEqual({ 'minor:9:1': 2 });

  await trigger.click();
  await dialog.getByRole('button', { name: 'Keep progress' }).click();
  await expect(dialog).toBeHidden();
  expect(await stored(page)).toEqual({ 'minor:9:1': 2 });

  await trigger.click();
  await dialog.getByRole('button', { name: 'Clear progress' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Clear progress' })).toHaveCount(0);
  expect(await stored(page)).toEqual({});
  expect(native).toEqual([]);
});
