import { test, expect } from '@playwright/test';
import { degreeColor } from '../src/core/presentation';

// Chord tones use the unified degree palette: the third and fifth take degree 3 and 5 colors.
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
      for (const [role, fill] of [['third', rgb(degreeColor(3))], ['fifth', rgb(degreeColor(5))]]) {
        const faces = page.locator(`.fretboard .note-node.${role}[data-active="true"] .note-face`);
        expect(await faces.count()).toBeGreaterThan(0);
        for (const face of await faces.all()) await expect(face).toHaveCSS('fill', fill);
      }
      await expect(page.locator('.shift-boundary-label, .warp-caption')).toHaveCount(0);
      await expect(page.locator('.warp-guide')).toHaveCount(1);
    });
  }
}
