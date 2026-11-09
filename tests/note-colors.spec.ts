import { test, expect } from '@playwright/test';

// Chord tones have two colors of their own, yellow for the third and purple for the fifth, which the scale-degree palette never uses.
const THIRD = '#e3b341', FIFTH = '#a365b5';
const rgb = (hex: string) => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;

for (const theme of ['light', 'dark']) {
  for (const scale of ['minor-pentatonic', 'major-pentatonic']) {
    test(`chord fills survive pattern outlines in ${theme} ${scale}`, async ({ page }) => {
      await page.addInitScript(({ theme, scale }) => {
        localStorage.setItem('fret-atlas-theme', theme);
        localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, scaleId: scale }));
      }, { theme, scale });
      await page.goto('/');
      await page.getByRole('button', { name: /Chord tones/ }).click();
      await expect(page.locator('.fretboard')).toHaveClass(/has-patterns/);
      for (const [role, fill] of [['third', rgb(THIRD)], ['fifth', rgb(FIFTH)]]) {
        const faces = page.locator(`.fretboard .note-node.${role}[data-active="true"] .note-face`);
        expect(await faces.count()).toBeGreaterThan(0);
        for (const face of await faces.all()) await expect(face).toHaveCSS('fill', fill);
      }
      await expect(page.locator('.shift-boundary-label, .warp-caption')).toHaveCount(0);
      await expect(page.locator('.warp-guide')).toHaveCount(1);
    });
  }
}

for (const theme of ['light', 'dark']) {
  test(`scale degrees: seven distinct colors, none of them the chord-tone yellow or purple in ${theme}`, async ({ page }) => {
    await page.addInitScript(({ theme }) => {
      localStorage.setItem('fret-atlas-theme', theme);
      localStorage.setItem('fret-atlas-v4', JSON.stringify({ version: 4, scaleId: 'major' }));
    }, { theme });
    await page.goto('/');
    await page.getByRole('button', { name: /Scale degrees/ }).click();
    const fills = await page.locator('.degree-legend .degree-marker .note-face').evaluateAll(faces => faces.map(face => getComputedStyle(face).fill));
    expect(fills).toHaveLength(7);
    expect(new Set(fills).size).toBe(7);
    expect(fills).not.toContain(rgb(THIRD));
    expect(fills).not.toContain(rgb(FIFTH));
    // On the board every non-root note wears its degree color, not only thirds and fifths.
    const board = await page.locator('.fretboard .note-node.degree-colored .note-face').evaluateAll(faces => faces.map(face => getComputedStyle(face).fill));
    expect(new Set(board).size).toBeGreaterThan(2);
  });
}

test('colors are offered root highlight, chord tones, scale degrees, and the buttons preview what the board shows', async ({ page }) => {
  await page.goto('/');
  const group = page.getByRole('group', { name: 'Note colors' });
  expect((await group.getByRole('button').allInnerTexts()).map(t => t.replace(/[●\s]+/g, ' ').trim())).toEqual(['Root highlight', 'Chord tones', 'Scale degrees']);
  const swatch = (name: RegExp) => group.getByRole('button', { name }).locator('.color-preview').evaluate(el => getComputedStyle(el).backgroundImage);
  const chord = await swatch(/Chord tones/);
  for (const color of [THIRD, FIFTH]) expect(chord).toContain(rgb(color));
});
