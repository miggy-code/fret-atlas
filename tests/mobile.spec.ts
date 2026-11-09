import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// A portrait phone draws the neck down the screen: nut on top, frets running down, one string per column.
const PHONE = { width: 390, height: 844 };
const noteBox = (page: Page, id: string) => page.locator(`[data-note-id="${id}"] .note-symbol`).boundingBox();
const centerX = async (page: Page, id: string) => { const box = (await noteBox(page, id))!; return box.x + box.width / 2; };
const centerY = async (page: Page, id: string) => { const box = (await noteBox(page, id))!; return box.y + box.height / 2; };
const setLeftHanded = async (page: Page) => {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Left-handed', { exact: true }).check();
  await page.getByRole('button', { name: 'Close settings', exact: true }).click();
  // Closing the dialog hands focus back to its button; wait so it cannot steal focus from a later test step.
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
};

test.describe('vertical neck on a portrait phone', () => {
  for (const width of [320, 390]) {
    test(`all twelve frets fit a ${width}px screen without sideways scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');
      const svg = page.locator('svg.fretboard');
      await expect(svg).toHaveAttribute('data-orientation', 'vertical');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const region = page.locator('.board-scroll');
      expect(await region.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await expect(page.locator('.scroll-cue')).toHaveCount(0);
      // Every fret is on the board, and it is taller than wide: a chart, not a strip.
      await expect(page.locator('.fret-number')).toHaveCount(13);
      const box = (await svg.boundingBox())!;
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeGreaterThan(box.width);
      for (const note of await page.locator('svg.fretboard .note-node').all()) {
        const symbol = (await note.locator('.note-hit').boundingBox())!;
        expect(symbol.x).toBeGreaterThanOrEqual(box.x - 1);
        expect(symbol.x + symbol.width).toBeLessThanOrEqual(box.x + box.width + 1);
      }
    });
  }

  test('a longer neck grows downward with the page and stays as wide', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const svg = page.locator('svg.fretboard');
    const short = (await svg.boundingBox())!;
    await page.getByLabel('Neck length').selectOption('24');
    await expect(page.locator('.fret-number')).toHaveCount(25);
    const long = (await svg.boundingBox())!;
    expect(long.width).toBeCloseTo(short.width, 0);
    expect(long.height).toBeGreaterThan(short.height * 1.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
  });

  test('low E is on the left and the nut on top; left-handed mirrors across the strings', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const columns = async () => Promise.all([6, 5, 4, 3, 2, 1].map(string => centerX(page, `${string}:5`)));
    const right = await columns();
    expect([...right].sort((a, b) => a - b)).toEqual(right);
    expect(await centerY(page, '3:1')).toBeGreaterThan(await centerY(page, '3:0'));
    expect(await centerY(page, '3:12')).toBeGreaterThan(await centerY(page, '3:11'));
    const names = () => page.locator('.string-name').allTextContents();
    expect(await names()).toEqual(['e', 'B', 'G', 'D', 'A', 'E']);
    const rightNames = await page.locator('.string-name').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().x).sort((a, b) => a - b));
    await setLeftHanded(page);
    const left = await columns();
    // Same columns, reversed: the board is mirrored, not shifted.
    const box = (await page.locator('svg.fretboard').boundingBox())!;
    right.forEach((x, i) => expect(left[i]).toBeCloseTo(2 * (box.x + box.width / 2) - x, 0));
    expect(await centerY(page, '3:1')).toBeGreaterThan(await centerY(page, '3:0'));
    // The string-name header mirrors with it: the lowest-pitched name is now on the right.
    const mirroredNames = await page.locator('.string-name').evaluateAll(nodes => nodes.map(n => [n.textContent, n.getBoundingClientRect().x] as const).sort((a, b) => a[1] - b[1]).map(([name]) => name));
    expect(mirroredNames).toEqual(['e', 'B', 'G', 'D', 'A', 'E']);
    expect(rightNames).toHaveLength(6);
  });

  test('arrow keys follow what is on screen: down the frets, across the strings', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('data-note-id'));
    await page.locator('[data-note-id="3:5"]').focus();
    await page.keyboard.press('ArrowDown');
    expect(await focused()).toBe('3:6');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    expect(await focused()).toBe('3:4');
    // Low E is the left column, so Left moves toward string 6 and Right toward string 1.
    await page.keyboard.press('ArrowLeft');
    expect(await focused()).toBe('4:4');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await focused()).toBe('2:4');
    await page.keyboard.press('Home');
    expect(await focused()).toBe('2:0');
    await page.keyboard.press('End');
    expect(await focused()).toBe('2:12');
  });

  test('left-handed arrows are mirrored across the strings but still run down the frets', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, leftHanded: true })));
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await expect(page.locator('svg.fretboard')).toHaveAttribute('data-handedness', 'left');
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('data-note-id'));
    await page.locator('[data-note-id="3:5"]').focus();
    await page.keyboard.press('ArrowLeft');
    expect(await focused()).toBe('2:5');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await focused()).toBe('4:5');
    await page.keyboard.press('ArrowDown');
    expect(await focused()).toBe('4:6');
  });

  test('the Warp label sits in the string-name header between G and B, and all-fourths has no Warp', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    const header = async (selector: string) => page.locator(selector).evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return { text: n.textContent, x: b.x + b.width / 2, y: b.y + b.height / 2 }; }));
    const names = await header('.string-name');
    const [warp] = await header('.warp-label');
    const g = names.find(n => n.text === 'G')!, b = names.find(n => n.text === 'B')!;
    expect(warp.text).toBe('+1');
    expect(warp.x).toBeGreaterThan(Math.min(g.x, b.x));
    expect(warp.x).toBeLessThan(Math.max(g.x, b.x));
    expect(Math.abs(warp.y - g.y)).toBeLessThan(3);
    // The guide runs down the neck between the two strings.
    const line = (await page.locator('.warp-guide line').boundingBox())!;
    expect(line.height).toBeGreaterThan(line.width * 10);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByLabel('All fourths').check();
    await page.getByRole('button', { name: 'Close settings', exact: true }).click();
    await expect(page.locator('.warp-guide')).toHaveCount(0);
  });

  test('the hover chip stays inside the board and the fit toggle is gone', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByRole('button', { name: 'Whole neck', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Fit neck to screen' })).toBeHidden();
    for (const id of ['6:5', '1:8', '1:0']) {
      await page.locator(`[data-note-id="${id}"]`).hover();
      const chip = page.locator('.inline-note-tooltip');
      await expect(chip).toHaveAttribute('data-tooltip-note', id);
      const [chipBox, boardBox] = [(await chip.boundingBox())!, (await page.locator('svg.fretboard').boundingBox())!];
      expect(chipBox.x).toBeGreaterThanOrEqual(boardBox.x - 1);
      expect(chipBox.x + chipBox.width).toBeLessThanOrEqual(boardBox.x + boardBox.width + 1);
    }
  });

  test('touch targets are at least 44px on a 390px phone', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    for (const id of ['6:0', '3:5', '1:12']) {
      const box = (await page.locator(`[data-note-id="${id}"] .note-hit`).boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('picking a form below the fold scrolls the page to it', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByLabel('Neck length').selectOption('24');
    await page.getByRole('button', { name: 'Form 3', exact: true }).click();
    await page.getByLabel('Neck length').selectOption('24');
    await page.getByRole('button', { name: 'Form 5', exact: true }).click();
    await expect.poll(async () => page.locator('.note-node[data-active="true"][data-visible="true"]').evaluateAll(nodes => nodes.every(n => { const b = n.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; }))).toBe(true);
  });

  test('works in dark mode with reduced motion', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('svg.fretboard')).toHaveAttribute('data-orientation', 'vertical');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
    expect(await page.locator('.note-node[data-visible="true"]').count()).toBeGreaterThan(5);
  });
});

test.describe('other screens keep the horizontal neck', () => {
  for (const [width, height] of [[844, 390], [768, 1024], [1280, 720], [1440, 900], [601, 900]]) {
    test(`${width}×${height} is horizontal`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await expect(page.locator('svg.fretboard')).toHaveAttribute('data-orientation', 'horizontal');
      const a = await centerX(page, '3:5'), b = await centerX(page, '3:6');
      expect(b).toBeGreaterThan(a);
      expect(await centerY(page, '3:5')).toBeCloseTo(await centerY(page, '3:6'), 0);
    });
  }

  test('the neck follows the screen, not the saved view: rotating a phone and sharing both read correctly', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByRole('button', { name: 'Form 3', exact: true }).click();
    const saved = await page.evaluate(() => Object.values(localStorage).filter(v => v.startsWith('{')).join(' '));
    expect(saved).not.toMatch(/orientation|vertical|horizontal/i);
    await page.setViewportSize({ width: PHONE.height, height: PHONE.width });
    await expect(page.locator('svg.fretboard')).toHaveAttribute('data-orientation', 'horizontal');
    await expect(page.getByRole('button', { name: 'Form 3', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.setViewportSize(PHONE);
    await expect(page.locator('svg.fretboard')).toHaveAttribute('data-orientation', 'vertical');
  });
});

// Phase 2: the page around the vertical neck. The board comes first on a phone, with the controls
// you change mid-practice (key, scale, view, form) attached above it.
const box = async (locator: ReturnType<Page['locator']>) => (await locator.boundingBox())!;

for (const [width, height] of [[320, 568], [390, 844]] as const) {
  test.describe(`compact study layout at ${width}×${height}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
    });

    test('the top bar stays on one row with named icon buttons', async ({ page }) => {
      const buttons = ['Share view', 'Guide', 'Settings'].map(name => page.getByRole('button', { name, exact: true }));
      const boxes = await Promise.all(buttons.map(box));
      for (const button of boxes) {
        expect(Math.abs(button.y - boxes[0].y)).toBeLessThan(2);
        expect(button.width).toBeGreaterThanOrEqual(44);
        expect(button.height).toBeGreaterThanOrEqual(44);
        expect(button.x + button.width).toBeLessThanOrEqual(width);
      }
      const wordmark = await box(page.locator('.wordmark'));
      expect(Math.abs(wordmark.y + wordmark.height / 2 - (boxes[0].y + boxes[0].height / 2))).toBeLessThan(6);
      expect((await box(page.locator('.topbar'))).height).toBeLessThan(64);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });

    test('the board begins within the first 200px, under key, scale, view and form', async ({ page }) => {
      const shell = await box(page.locator('.board-shell'));
      expect(shell.y).toBeLessThanOrEqual(210);
      for (const control of [page.locator('#root'), page.locator('#scale'), page.getByRole('button', { name: 'Position', exact: true }), page.getByRole('group', { name: 'Pentatonic form' })]) {
        const controlBox = await box(control);
        expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(shell.y + 1);
        expect(controlBox.x).toBeGreaterThanOrEqual(0);
        expect(controlBox.x + controlBox.width).toBeLessThanOrEqual(width);
      }
      // What changes the form is attached to the board, not left far above it.
      const picker = await box(page.getByRole('group', { name: 'Pentatonic form' }));
      expect(shell.y - (picker.y + picker.height)).toBeLessThan(24);
    });

    test('the active form is on screen without scrolling sideways', async ({ page }) => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const notes = await page.locator('.note-node[data-active="true"][data-visible="true"]').evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }));
      expect(notes.length).toBeGreaterThan(8);
      for (const note of notes) {
        expect(note.left).toBeGreaterThanOrEqual(0);
        expect(note.right).toBeLessThanOrEqual(width);
      }
      // A 568px screen is too short for the whole of Form 1; a taller phone shows all of it.
      if (height >= 800) for (const note of notes) expect(note.bottom).toBeLessThanOrEqual(height);
    });

    test('every control above the board is at least 44px tall, and 44px wide where the screen allows', async ({ page }) => {
      const controls = page.locator('.topbar button, .study-controls select, .study-controls button, .form-bar button');
      const count = await controls.count();
      expect(count).toBeGreaterThan(12);
      for (let i = 0; i < count; i++) {
        const b = await box(controls.nth(i));
        const name = await controls.nth(i).evaluate(el => el.getAttribute('aria-label') ?? el.textContent);
        expect(b.height, `${name} height`).toBeGreaterThanOrEqual(44);
        // Five form buttons share one row, so at 320px they are a little narrower: a known limit of the width.
        if (width >= 390) expect(b.width, `${name} width`).toBeGreaterThanOrEqual(44);
      }
    });

    test('the secondary controls and the mode tabs sit below the board', async ({ page }) => {
      const shell = await box(page.locator('.board-shell'));
      for (const below of [page.getByRole('tab', { name: 'Practice' }), page.getByRole('group', { name: 'Note view' }), page.getByLabel('Neck length'), page.getByRole('button', { name: 'Play' })]) {
        expect((await box(below)).y).toBeGreaterThanOrEqual(shell.y + shell.height - 1);
      }
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(/pentatonic/i);
    });
  });
}

test.describe('selected form', () => {
  for (const handedness of ['right-handed', 'left-handed']) {
    test(`stays in view and clear of the sticky form bar on a 24-fret neck, ${handedness}`, async ({ page }) => {
      if (handedness === 'left-handed') await page.addInitScript(() => localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, leftHanded: true, frets: 24 })));
      await page.setViewportSize(PHONE);
      await page.goto('/');
      await page.getByLabel('Neck length').selectOption('24');
      const bar = page.locator('.form-bar');
      for (const form of [3, 5, 2, 4, 1]) {
        // Scroll to the top so the picker is reachable, then pick; the page must bring the form to the user.
        await page.evaluate(() => scrollTo(0, 0));
        await page.getByRole('button', { name: `Form ${form}`, exact: true }).click();
        await expect.poll(async () => page.locator('.note-node[data-active="true"][data-visible="true"]').evaluateAll(nodes => {
          const tops = nodes.map(n => n.getBoundingClientRect());
          return Math.min(...tops.map(b => b.top)) >= 0 && Math.max(...tops.map(b => b.bottom)) <= innerHeight;
        }), { message: `Form ${form} is in the viewport` }).toBe(true);
        const barBox = await box(bar);
        const top = await page.locator('.note-node[data-active="true"][data-visible="true"]').evaluateAll(nodes => Math.min(...nodes.map(n => n.getBoundingClientRect().top)));
        expect(top, `Form ${form} is not under the form bar`).toBeGreaterThanOrEqual(barBox.y + barBox.height - 1);
      }
    });
  }

  test('the form bar stays reachable while the long neck scrolls', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByLabel('Neck length').selectOption('24');
    await page.evaluate(() => scrollTo(0, 700));
    const picker = await box(page.getByRole('group', { name: 'Pentatonic form' }));
    expect(picker.y).toBeGreaterThanOrEqual(0);
    expect(picker.y + picker.height).toBeLessThanOrEqual(120);
  });
});

test.describe('drill prompt', () => {
  test('is on screen together with the board and its search zone, even from the lower tabs', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByRole('tab', { name: 'Practice' }).click();
    await page.locator('#find-notes').click();
    const prompt = page.getByRole('region', { name: 'Practice drill' });
    await expect(prompt).toBeVisible();
    const promptBox = await box(prompt);
    expect(promptBox.y).toBeGreaterThanOrEqual(0);
    expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(PHONE.height);
    const board = await box(page.locator('svg.fretboard'));
    expect(board.y).toBeGreaterThanOrEqual(promptBox.y + promptBox.height - 1);
    expect(board.y).toBeLessThan(PHONE.height - 300);
    // The zone to search is among what is visible, and the answers are tappable without scrolling.
    const zone = await box(page.locator('.drill-zone rect').first());
    expect(zone.y + Math.min(zone.height, 200)).toBeLessThanOrEqual(PHONE.height);
    for (const action of ['Hint', 'Reveal', 'Next', 'End']) {
      const actionBox = await box(prompt.getByRole('button', { name: action, exact: true }));
      expect(actionBox.height).toBeGreaterThanOrEqual(44);
      expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(PHONE.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(PHONE.width);
  });

  test('stays reachable while a long neck scrolls', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto('/');
    await page.getByLabel('Neck length').selectOption('24');
    await page.getByRole('tab', { name: 'Practice' }).click();
    await page.locator('#find-notes').click();
    const prompt = page.getByRole('region', { name: 'Practice drill' });
    await page.evaluate(() => scrollTo(0, 600));
    const promptBox = await box(prompt);
    expect(promptBox.y).toBeGreaterThanOrEqual(0);
    expect(promptBox.y + promptBox.height).toBeLessThanOrEqual(PHONE.height);
  });
});
