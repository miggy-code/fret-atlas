import { test, expect } from '@playwright/test';

test('practice hides the answers, scores taps, and deals a new round', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  const bar = page.getByRole('region', { name: 'Practice drill' });
  await expect(bar).toBeVisible();
  // Every note and outline is hidden until it is found.
  await expect(page.locator('.note-node[data-visible="true"]')).toHaveCount(0);
  await expect(page.locator('.shape-outline')).toHaveCount(0);
  await expect(page.locator('.drill-zone rect').first()).toBeVisible();

  const prompt = async () => (await bar.locator('.drill-prompt').innerText()).replace(/\s+/g, ' ');
  const first = await prompt();

  // A wrong tap shows a cross and resets the streak.
  const ids = await page.locator('.note-node').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-note-id')!));
  const tapUntil = async (want: 'found' | 'miss') => {
    for (const id of ids) {
      const node = page.locator(`[data-note-id="${id}"]`);
      if (await node.getAttribute('data-drill')) continue;
      await node.click();
      if (await node.getAttribute('data-drill') === want) return id;
    }
    throw new Error(`no ${want}`);
  };
  await tapUntil('miss');
  await expect(bar.locator('.drill-feedback')).toContainText("That's");
  await expect(bar.locator('.drill-streak b')).toHaveText('0');

  const found = await tapUntil('found');
  await expect(page.locator(`[data-note-id="${found}"]`)).toHaveAttribute('data-visible', 'true');
  await expect(bar.locator('.drill-streak b')).toHaveText('1');
  await expect(bar.locator('.drill-progress i.done')).toHaveCount(1);

  // Skip deals a different prompt; Stop practice restores the board.
  await bar.getByRole('button', { name: 'Next' }).click();
  await expect.poll(prompt).not.toBe(first);
  await page.getByRole('button', { name: 'Stop practice' }).click();
  await expect(bar).toHaveCount(0);
  expect(await page.locator('.shape-outline').count()).toBeGreaterThan(0);
  expect(await page.locator('.note-node[data-visible="true"]').count()).toBeGreaterThan(5);
});

test('a finished round celebrates and moves on; the best streak persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  const bar = page.getByRole('region', { name: 'Practice drill' });
  const total = await bar.locator('.drill-progress i').count();
  // Find the answers by elimination: tap every position until the round is full.
  const ids = await page.locator('.note-node').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-note-id')!));
  let found = 0;
  for (const id of ids) {
    if (found === total) break;
    const node = page.locator(`[data-note-id="${id}"]`);
    await node.click();
    if (await node.getAttribute('data-drill') === 'found') found++;
  }
  await expect(bar).toHaveClass(/is-complete/);
  await expect(bar.locator('.drill-feedback')).toContainText(`All ${total} in`);
  await expect(bar).not.toHaveClass(/is-complete/, { timeout: 3000 });
  await expect(bar).toContainText('1 round');
  const best = await bar.locator('.drill-stats').innerText();
  await page.reload();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  expect(await page.getByRole('region', { name: 'Practice drill' }).locator('.drill-stats').innerText()).toContain(best.match(/Best \d+/)![0]);
});

test('play runs the form up and back with the sounding note lit', async ({ page }) => {
  await page.goto('/');
  const play = page.getByRole('button', { name: 'Play', exact: true });
  await play.click();
  await expect(page.locator('.note-node.is-playing')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Stop', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('.note-node.is-playing')).toHaveCount(0);
});

test('playing a form through marks it practiced on the picker and in the key grid', async ({ page }) => {
  await page.goto('/');
  const formOne = page.getByRole('button', { name: 'Form 1', exact: true });
  await expect(formOne).not.toHaveAttribute('data-progress', 'practiced');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(formOne).toHaveAttribute('data-progress', 'practiced', { timeout: 10000 });
  await page.locator('details.control-module > summary', { hasText: 'Progress' }).click();
  const a = page.getByRole('button', { name: 'A minor: 1 of 5 forms practiced' });
  await expect(a).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('details.control-module > summary', { hasText: 'Progress' })).toContainText('1 of 5 forms practiced in A minor');
  // Picking a key from the grid switches the study key; progress stays per key.
  await page.getByRole('button', { name: /^C minor: 0 of 5/ }).click();
  await expect(page.locator('#root')).toHaveValue('0');
  await expect(formOne).not.toHaveAttribute('data-progress', 'practiced');
  await page.reload();
  await page.locator('#root').selectOption('9');
  await expect(formOne).toHaveAttribute('data-progress', 'practiced');
});

test('selected degree practice gives hints and reveal without scoring, then restores selection', async ({ page }) => {
  await page.goto('/');
  const degree = page.getByRole('button', { name: /Isolate .*degree/ }).first();
  await degree.click();
  await page.getByRole('button', { name: 'Find these' }).click();
  const drill = page.getByRole('region', { name: 'Practice drill' });
  await expect(drill).toBeVisible();
  await drill.getByRole('button', { name: 'Hint' }).click();
  await expect(page.locator('.note-node.is-drill-hint')).toHaveCount(1);
  await drill.getByRole('button', { name: 'Reveal' }).click();
  expect(await page.locator('.note-node.is-drill-hint').count()).toBeGreaterThan(0);
  await expect(drill.getByRole('img', { name: /^0 of/ })).toBeVisible();
  await drill.getByRole('button', { name: 'End' }).click();
  await expect(page.getByRole('button', { name: 'Find these' })).toBeFocused();
  await expect(page.locator('.tone-chip.isolated')).toHaveCount(1);
});

test('chord targets can be outside scale and connecting restores the original view', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Whole neck', exact: true }).click();
  const connect = page.getByRole('button', { name: 'Connect positions' });
  await connect.click();
  await expect(connect).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Position', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await connect.click();
  await expect(page.getByRole('button', { name: 'Whole neck', exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Choosing a view while connecting leaves the connection view instead of being ignored.
  await connect.click();
  await page.getByRole('button', { name: 'Diagonal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Diagonal', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Connect positions' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Whole neck', exact: true }).click();
  await page.getByLabel('Chord root').selectOption('1');
  await page.getByLabel('Chord quality').selectOption('major');
  await page.getByRole('button', { name: 'Find tones' }).click();
  await expect(page.getByRole('region', { name: 'Practice drill' })).toContainText('C♯ major chord');
  await page.getByRole('button', { name: 'End', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Find tones' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Whole neck', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('Connect positions in Position view is the saved ghost-forms setting', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect positions' }).click();
  await expect(page.locator('.shape-ghost-outline').first()).toBeAttached();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Connect positions' })).toHaveAttribute('aria-pressed', 'true');
});

test('Find these stays within the current position', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Isolate .*degree/ }).first().click();
  await page.getByRole('button', { name: 'Find these', exact: true }).click();
  const drill = page.getByRole('region', { name: 'Practice drill' });
  await expect(drill).toContainText('selected degrees');
  await drill.getByRole('button', { name: 'Reveal' }).click();
  for (const node of await page.locator('.note-node.is-drill-hint').all()) await expect(node).toHaveAttribute('data-active', 'true');
});
