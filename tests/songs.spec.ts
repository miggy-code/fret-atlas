import { test, expect } from '@playwright/test';

const savedView = (page: import('@playwright/test').Page) => page.evaluate(() => localStorage.getItem('fret-atlas-v4'));

test('a song takes over the board, shows its route through the forms, and steps note by note', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Scale' }).waitFor();
  await expect.poll(() => savedView(page)).not.toBeNull();
  const before = await savedView(page);

  await page.getByRole('tab', { name: 'Songs' }).click();
  const deck = page.getByRole('region', { name: 'Songs' });
  await expect(deck.getByRole('combobox', { name: 'Song' })).toHaveValue('house-of-the-rising-sun');
  // The song sets the key and hides the study controls, which would otherwise change the saved view.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('House of the Rising Sun in D Natural minor · Aeolian');
  await expect(page.getByRole('region', { name: 'Study controls' })).toHaveCount(0);

  const route = deck.getByRole('list', { name: 'Route through the forms' });
  await expect(route.getByRole('listitem')).toHaveCount(1);
  await expect(deck.locator('.song-route-wrap h3')).toContainText('Stays in Form 4 the whole way');

  // The first note is lit and the next one is ringed; Next and tapping the ringed note both move on.
  const now = deck.locator('.song-now');
  await expect(now).toContainText('Note 1 of 37');
  await expect(page.locator('.note-node.is-playing')).toHaveAttribute('data-note-id', '4:7');
  await expect(page.locator('.note-node.is-song-next')).toHaveAttribute('data-note-id', '5:5');
  await expect(page.locator('.song-ahead')).toHaveCount(1);
  await deck.getByRole('button', { name: 'Next note' }).click();
  await expect(now).toContainText('Note 2 of 37');
  const next = await page.locator('.note-node.is-song-next').getAttribute('data-note-id');
  await page.locator(`[data-note-id="${next}"]`).click();
  await expect(now).toContainText('Note 3 of 37');

  // Played an octave up in form 3, Scarborough Fair outruns the form twice; the board follows the form under the current note.
  await deck.getByRole('combobox', { name: 'Song' }).selectOption('scarborough-fair');
  await deck.getByRole('button', { name: 'Up an octave' }).click();
  await deck.getByRole('button', { name: 'Form 3' }).click();
  await expect(now).toContainText('Note 1 of 68');
  await expect(now).toContainText('Form 3');
  await expect(route.getByRole('listitem')).toHaveCount(5);
  await expect(route.locator('.route-change')).toHaveText(['Pivot', 'Pivot', 'Pivot', 'Pivot']);
  await route.getByRole('button').nth(1).click();
  await expect(route.getByRole('button').nth(1)).toHaveAttribute('aria-current', 'step');
  await expect(now).toContainText('Form 5');

  // Leaving the tab puts the saved view back on the board; the song never wrote to it.
  await page.getByRole('tab', { name: 'Explore' }).click();
  await expect(page.getByRole('region', { name: 'Study controls' })).toBeVisible();
  expect(await savedView(page)).toBe(before);
});

test('every song fits the default neck and can be listened to', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Songs' }).click();
  const deck = page.getByRole('region', { name: 'Songs' });
  const options = await deck.getByRole('combobox', { name: 'Song' }).locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value));
  expect(options).toEqual(['house-of-the-rising-sun', 'scarborough-fair', 'blackwaterside']);
  for (const id of options) {
    await deck.getByRole('combobox', { name: 'Song' }).selectOption(id);
    await expect(deck.locator('.song-now')).toContainText('Note 1 of');
    await expect(deck.locator('.song-empty')).toHaveCount(0);
  }
  // Listen runs through the notes with the board following, and Stop ends it.
  const listen = deck.getByRole('button', { name: 'Listen' });
  await listen.click();
  await expect(deck.locator('.song-now')).not.toContainText('Note 1 of', { timeout: 5000 });
  await deck.getByRole('button', { name: 'Stop' }).click();
  await expect(deck.getByRole('button', { name: 'Listen' })).toBeVisible();
});
