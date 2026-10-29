import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const module = (page: Page, title: string) => page.locator('details.control-module').filter({ has: page.locator(':scope > summary', { hasText: title }) });
const openModule = async (page: Page, title: string) => {
  const m = module(page, title);
  if (!await m.evaluate(element => (element as HTMLDetailsElement).open)) await m.locator(':scope > summary').click();
  return m;
};
const toggle = (page: Page, name: string) => page.getByRole('checkbox', { name, exact: true });

test('Overlays shows Changed after a toggle and Restore defaults clears only its own settings', async ({ page }) => {
  await page.goto('/');
  await page.locator('#root').selectOption('2');
  await page.locator('#scale').selectOption('minor');
  const overlays = await openModule(page, 'Overlays');
  const badge = overlays.locator(':scope > summary em.modified-badge');
  await expect(badge).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Restore Overlays defaults', exact: true })).toHaveCount(0);
  await toggle(page, 'Skeleton').check();
  await expect(badge).toHaveText('Changed');
  // Other panels are untouched.
  for (const title of ['Focus']) await expect(module(page, title).locator('em.modified-badge')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore Overlays defaults', exact: true }).click();
  await expect(badge).toHaveCount(0);
  await expect(toggle(page, 'Skeleton')).not.toBeChecked();
  await expect(page.locator('.root-skeleton')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Restore Overlays defaults', exact: true })).toHaveCount(0);
  await expect(page.locator('#root')).toHaveValue('2');
  await expect(page.locator('#scale')).toHaveValue('minor');
});

test('note view restore returns to Dots and Root highlight', async ({ page }) => {
  await page.goto('/');
  const restore = page.getByRole('button', { name: 'Restore note view defaults', exact: true });
  await expect(restore).toHaveCount(0);
  const view = page.getByRole('group', { name: 'Note view', exact: true });
  const colors = page.getByRole('group', { name: 'Note colors', exact: true });
  await view.getByRole('button', { name: 'Names', exact: true }).click();
  await colors.getByRole('button', { name: /Scale degrees/ }).click();
  await expect(page.locator('.fretboard')).toHaveAttribute('data-labels', 'notes');
  await restore.click();
  await expect(view.getByRole('button', { name: 'Dots', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(colors.getByRole('button', { name: /Root highlight/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fretboard')).toHaveAttribute('data-labels', 'none');
  await expect(restore).toHaveCount(0);
});

test('Whole neck Show filter switches pattern families and hover emphasizes shapes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Whole neck', exact: true }).click();
  const families = page.getByRole('group', { name: 'Pattern families', exact: true });
  await expect(page.locator('.form-hint')).toHaveText('Hover a note to highlight its shapes');
  const rectangles = await page.locator('.shape-outline.rectangle').count();
  expect(rectangles).toBeGreaterThan(2);
  await families.getByRole('button', { name: 'Stacks', exact: true }).click();
  await expect(families.getByRole('button', { name: 'Stacks', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(0);
  expect(await page.locator('.shape-outline.stack').count()).toBeGreaterThan(1);
  await families.getByRole('button', { name: 'Both', exact: true }).click();
  await expect(page.locator('.shape-outline.rectangle')).toHaveCount(rectangles);
  await expect(page.locator('.shape-outline[data-partial]').first()).toBeAttached();
  await page.locator('[data-note-id="1:5"]').hover();
  expect(await page.locator('.shape-outline.is-emphasized').count()).toBeGreaterThan(0);
  // The other shapes are dimmed while one is emphasized.
  const dimmed = page.locator('.shape-outline:not(.is-emphasized)').first();
  await expect.poll(() => dimmed.evaluate(node => Number(getComputedStyle(node).opacity))).toBeLessThan(.5);
});

test('Diagonal marks continuation tones and warp shows a +1 label without an arrow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.warp-label')).toHaveText('+1');
  await expect(page.locator('.warp-arrow')).toHaveCount(0);
  await page.getByRole('button', { name: 'Diagonal', exact: true }).click();
  expect(await page.locator('.note-node.is-run').count()).toBeGreaterThan(0);
  await expect(page.locator('.note-node.is-run.is-member')).toHaveCount(0);
  await expect(page.locator('.board-legend')).toContainText('Continuation tone');
  await page.getByRole('button', { name: 'Position', exact: true }).click();
  await expect(page.locator('.note-node.is-run')).toHaveCount(0);
  await expect(page.locator('.board-legend')).not.toContainText('Continuation tone');
});

for (const leftHanded of [false, true]) {
  test(`fit neck in Diagonal keeps six string names in view${leftHanded ? ' when mirrored' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    if (leftHanded) {
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page.getByLabel('Left-handed', { exact: true }).check();
      await page.getByRole('button', { name: 'Close settings', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Diagonal', exact: true }).click();
    await page.getByRole('button', { name: 'Fit neck to screen', exact: true }).click();
    const names = page.locator('.string-name');
    await expect(names).toHaveCount(6);
    for (const name of await names.all()) await expect(name).toBeVisible();
    const result = await page.locator('.fretboard').evaluate(svg => {
      const box = (svg as SVGSVGElement).viewBox.baseVal;
      const rect = svg.getBoundingClientRect();
      return [...svg.querySelectorAll('.string-name')].map(node => {
        const x = Number(node.getAttribute('x'));
        const r = node.getBoundingClientRect();
        return { inViewBox: x >= box.x && x <= box.x + box.width, onScreen: r.left >= rect.left - 1 && r.right <= rect.right + 1 };
      });
    });
    for (const name of result) {
      expect(name.inViewBox).toBe(true);
      expect(name.onScreen).toBe(true);
    }
  });
}

test('hover tooltip text stays inside its box and clear of the hovered note ring', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Neck length').selectOption('15');
  await page.getByRole('button', { name: 'Whole neck', exact: true }).click();
  for (const id of ['1:5', '3:7', '2:15']) {
    await page.locator(`[data-note-id="${id}"]`).hover();
    await expect(page.locator('.inline-note-tooltip')).toHaveAttribute('data-tooltip-note', id);
    await expect.poll(async () => {
      const box = (await page.locator('.inline-note-tooltip rect').boundingBox())!;
      const ring = (await page.locator(`[data-note-id="${id}"] .focus-ring`).boundingBox())!;
      return box.y < ring.y + ring.height && ring.y < box.y + box.height;
    }).toBe(false);
    const box = (await page.locator('.inline-note-tooltip rect').boundingBox())!;
    const text = (await page.locator('.inline-note-tooltip text').boundingBox())!;
    expect(text.x).toBeGreaterThanOrEqual(box.x);
    expect(text.x + text.width).toBeLessThanOrEqual(box.x + box.width);
  }
});

test('warp draws a red dotted line', async ({ page }) => {
  await page.goto('/');
  const line = page.locator('.warp-guide line');
  await expect(line).toHaveCSS('stroke', 'rgb(195, 63, 67)');
  expect(await line.evaluate(node => getComputedStyle(node).strokeDasharray)).not.toBe('none');
});
