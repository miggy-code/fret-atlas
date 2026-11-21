import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { pathForSong } from '../src/core/song';
import { phrasesOf } from '../src/core/song-insight';
import { SONGS } from '../src/core/songs';

const savedView = (page: Page) => page.evaluate(() => localStorage.getItem('fret-atlas-v4'));
const player = (page: Page) => page.getByRole('region', { name: 'Song player' });
const study = (page: Page) => page.getByRole('region', { name: 'Song study' });
const note = (page: Page, id: string) => page.locator(`[data-note-id="${id}"]`);
async function openSongs(page: Page) {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Scale' }).waitFor();
  await page.getByRole('tab', { name: 'Songs' }).click();
}

test('a song takes over the board, shows its route through the forms, and steps note by note', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Scale' }).waitFor();
  await expect.poll(() => savedView(page)).not.toBeNull();
  const before = await savedView(page);

  await page.getByRole('tab', { name: 'Songs' }).click();
  const bar = player(page), deck = study(page);
  await expect(bar.getByRole('combobox', { name: 'Song' })).toHaveValue('house-of-the-rising-sun');
  // The song sets the key and hides the study controls, which would otherwise change the saved view.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('House of the Rising Sun in D Natural minor · Aeolian');
  await expect(page.getByRole('region', { name: 'Study controls' })).toHaveCount(0);

  const route = deck.getByRole('list', { name: 'Route through the forms' });
  await expect(route.getByRole('listitem')).toHaveCount(1);
  await expect(deck.locator('.song-timeline h3')).toContainText('Stays in Form 2 the whole way');

  // The first note is lit and the next one is ringed; Next and tapping the ringed note both move on.
  const now = bar.locator('.song-now');
  await expect(now).toContainText('Note 1 of 37');
  await expect(page.locator('.note-node.is-playing')).toHaveAttribute('data-note-id', '3:2');
  await expect(page.locator('.note-node.is-song-next')).toHaveAttribute('data-note-id', '4:0');
  await expect(page.locator('.song-ahead')).toHaveCount(1);
  await bar.getByRole('button', { name: 'Next note' }).click();
  await expect(now).toContainText('Note 2 of 37');
  const next = await page.locator('.note-node.is-song-next').getAttribute('data-note-id');
  await note(page, next!).click();
  await expect(now).toContainText('Note 3 of 37');

  // Played an octave up in form 3, Scarborough Fair outruns the form twice; the board follows the form under the current note.
  await bar.getByRole('combobox', { name: 'Song' }).selectOption('scarborough-fair');
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
  await openSongs(page);
  const bar = player(page);
  const options = await bar.getByRole('combobox', { name: 'Song' }).locator('option').evaluateAll(nodes => nodes.map(n => (n as HTMLOptionElement).value));
  expect(options).toEqual(SONGS.map(song => song.id));
  for (const id of options) {
    await bar.getByRole('combobox', { name: 'Song' }).selectOption(id);
    await expect(bar.locator('.song-now')).toContainText('Note 1 of');
    await expect(bar.locator('.song-empty')).toHaveCount(0);
  }
  // Listen runs through the notes with the board following, and Stop ends it.
  await bar.getByRole('button', { name: 'Listen' }).click();
  await expect(bar.locator('.song-now')).not.toContainText('Note 1 of', { timeout: 5000 });
  await bar.getByRole('button', { name: 'Stop' }).click();
  await expect(bar.getByRole('button', { name: 'Listen' })).toBeVisible();
});

test('the board tells the melody from the chord: the melody is ringed and numbered, the chord sits behind it as a shade', async ({ page }) => {
  await openSongs(page);
  const bar = player(page);
  await bar.getByRole('button', { name: 'Next note' }).click();
  await expect(bar.locator('.song-now')).toContainText('Note 2 of 37');

  // The next notes are numbered in the order they are played; the current one is ringed solid.
  const path = pathForSong(SONGS[0], { frets: 12, lowest: 0, fourths: false });
  const coming = path.notes.slice(2, 6).map(n => n.id);
  await expect(page.locator('.note-node.is-playing')).toHaveAttribute('data-note-id', path.notes[1].id);
  await expect(note(page, coming[0]).locator('.song-step')).toHaveText('1');
  const firstStep = new Map<string, number>();
  coming.forEach((id, k) => { if (!firstStep.has(id)) firstStep.set(id, k + 1); });
  for (const [id, step] of firstStep) await expect(note(page, id).locator('.song-step')).toHaveText(String(step));
  await expect(page.locator('.song-step')).toHaveCount(firstStep.size);

  // The song is played where its chords are strummed, so the open Dm (xx0231) is in the form, and it is what is shaded:
  // the notes the hand holds, never ringed, since a ring always means the melody.
  await expect(page.locator('.is-singing .triad-halo')).toHaveCount(0);
  const held = () => page.locator('.note-node:has(.song-chord-shade)').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-note-id')).sort());
  await expect.poll(held).toEqual(['1:1', '2:3', '3:2', '4:0']);
  const ring = await page.locator('.note-node.is-playing .mark-ring').evaluate(n => getComputedStyle(n).stroke);
  const shade = await note(page, '4:0').locator('.song-chord-shade').evaluate(n => getComputedStyle(n).fill);
  expect(ring).not.toBe(shade);
  // The current note is drawn larger, and its ring stays outside it.
  const [face, outer] = await page.locator('.note-node.is-playing').evaluate(n => [n.querySelector('.note-face')!, n.querySelector('.mark-ring')!].map(e => e.getBoundingClientRect().width));
  expect(outer).toBeGreaterThan(face);

  // The grip is drawn as one shape across its strings, low to high, plainly visible over the form, not just a halo per note.
  const grip = page.locator('.song-grip');
  const covers = async (ids: string[]) => {
    await expect(grip).toHaveCount(1);
    expect(await grip.evaluate(n => (n as SVGPolylineElement).points.length)).toBe(ids.length);
    expect(await grip.evaluate(n => Number(getComputedStyle(n).opacity))).toBeGreaterThanOrEqual(.3);
    const box = (await grip.boundingBox())!;
    for (const id of ids) {
      const c = (await note(page, id).locator('.note-face').boundingBox())!;
      expect(c.x + c.width / 2).toBeGreaterThanOrEqual(box.x); expect(c.x + c.width / 2).toBeLessThanOrEqual(box.x + box.width);
      expect(c.y + c.height / 2).toBeGreaterThanOrEqual(box.y); expect(c.y + c.height / 2).toBeLessThanOrEqual(box.y + box.height);
    }
  };
  await covers(['4:0', '3:2', '2:3', '1:1']);
  await expect(page.locator('.song-barre')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /^Dm grip/ })).toHaveAccessibleName('Dm grip, D shape: x x 0 2 3 1, fingers x x 0 2 3 1');
  const legend = page.locator('.board-legend');
  for (const text of ['Now', 'Next, in order', 'Melody in this form', 'Dm grip, D shape']) await expect(legend).toContainText(text);
  // One grip per chord: the one in the form is the one heard, so there is nothing to choose.
  await expect(study(page).getByRole('button', { name: 'Near the melody' })).toHaveCount(0);

  // Under F it is the F barre, 133211, the first finger laid across the first fret.
  await study(page).getByRole('list', { name: 'Chords' }).getByRole('button', { name: /^F/ }).click();
  await expect.poll(held).toEqual(['1:1', '2:1', '3:2', '4:3', '5:3', '6:1']);
  await covers(['6:1', '5:3', '4:3', '3:2', '2:1', '1:1']);
  await expect(page.locator('.song-barre')).toHaveCount(1);
  await expect(page.getByRole('img', { name: /^F grip/ })).toHaveAccessibleName('F grip, E shape, barre at fret 1: 1 3 3 2 1 1, fingers 1 3 4 2 1 1');

  // The form's outlines stay, faded behind the melody.
  const outline = await page.locator('.shape-outline').first().evaluate(n => Number(getComputedStyle(n).opacity));
  expect(outline).toBeLessThan(.5);
});

// Records every note sent to the synth: the app's own audio module, with one line added to note each pluck.
async function listenIn(page: Page) {
  await page.route(/\/src\/components\/audio\.ts/, async route => {
    const response = await route.fetch();
    const body = (await response.text()).replace(/export function pluck\(([^)]*)\)\s*\{/, match => `${match} ((window as any).__plucks ??= []).push({ midi: arguments[0], level: arguments[2] ?? 1 });`.replace('(window as any)', 'window'));
    expect(body).toContain('__plucks');
    await route.fulfill({ response, body });
  });
}
const heard = (page: Page) => page.evaluate(() => { const plucks = (window as any).__plucks ?? []; (window as any).__plucks = []; return plucks as { midi: number; level: number }[]; });
const OPEN = [64, 59, 55, 50, 45, 40];
const midiOf = (id: string) => { const [string, fret] = id.split(':').map(Number); return OPEN[string - 1] + fret; };

test('every note heard is on the board: the melody note, and the grip under it, which flashes as it is struck', async ({ page }) => {
  await listenIn(page);
  await openSongs(page);
  const bar = player(page);
  const held = () => page.locator('.note-node:has(.song-chord-shade)').evaluateAll(nodes => nodes.map(n => n.getAttribute('data-note-id')!));
  for (let k = 1; k < 16; k++) {
    await heard(page);
    await bar.getByRole('button', { name: 'Next note' }).click();
    await expect(bar.locator('.song-now')).toContainText(`Note ${k + 1} of 37`);
    const now = (await page.locator('.note-node.is-playing').getAttribute('data-note-id'))!;
    const plucks = await heard(page);
    const melody = plucks.filter(p => p.level > .5), chord = plucks.filter(p => p.level <= .5);
    expect(melody.map(p => p.midi), `note ${k + 1}`).toEqual([midiOf(now)]);
    // The chord heard is exactly the grip shaded, string for string.
    const shaded = (await held()).map(midiOf).sort((a, b) => a - b);
    expect(chord.map(p => p.midi).sort((a, b) => a - b), `chord under note ${k + 1}`).toEqual(shaded);
  }
  // Each strum flashes the grip, so the eye catches the chord sounding as well as the melody.
  const strikes = () => page.locator('.song-grip').getAttribute('data-strikes').then(Number);
  const before = await strikes();
  await bar.getByRole('button', { name: 'Listen' }).click();
  await expect.poll(strikes).toBeGreaterThan(before);
});

test('the chord under each note is named, shaded on the board, and can rename the board from its own root', async ({ page }) => {
  await openSongs(page);
  const bar = player(page), deck = study(page);
  const chordFact = bar.locator('.song-now [data-fact="chord"]');
  // The pickup is sung before the first chord.
  await expect(chordFact).toContainText('no chord yet');
  await expect(page.locator('.note-node.is-song-chord')).toHaveCount(0);

  // The second note is D over D minor: the root of the key and the root of the chord.
  await bar.getByRole('button', { name: 'Next note' }).click();
  await expect(chordFact).toContainText('Over Dm i');
  await expect(chordFact).toContainText('chord root');
  await expect(page.locator('.board-legend')).toContainText('Dm grip');
  await expect(note(page, '4:0')).toHaveClass(/is-song-chord chord-root/);
  await expect(note(page, '4:3')).toHaveClass(/chord-third/);
  const chords = deck.getByRole('list', { name: 'Chords' });
  await expect(chords.getByRole('button').first()).toHaveAttribute('aria-current', 'step');
  await expect(chords.getByRole('button')).toHaveText(['Dmi', 'A7V7', 'Dmi', 'C7♭VII7', 'F♭III', 'A7V7', 'Dmi', 'B♭7♭VI7', 'Dmi', 'A7V7', 'Dmi']);

  // The chord lane jumps to A7. Its C♯ is outside D natural minor, one fret below the form's D, and is still shown.
  await chords.getByRole('button', { name: 'A7' }).first().click();
  await expect(chordFact).toContainText('Over A7 V7');
  await expect(bar.locator('.song-now')).toContainText('Note 8 of 37');
  await expect(note(page, '5:4')).toHaveClass(/is-song-chord chord-third/);
  await expect(note(page, '5:4')).toHaveAttribute('data-visible', 'true');

  // By degree of the key the A is a 5; named from the chord it is the root.
  await expect(note(page, '3:2').locator('.note-label')).toHaveText('5');
  await deck.getByRole('button', { name: 'From the chord' }).click();
  await expect(note(page, '3:2').locator('.note-label')).toHaveText('R');
  await expect(note(page, '5:4').locator('.note-label')).toHaveText('3');
  await expect(note(page, '4:0').locator('.note-label')).toHaveText('4');
  await deck.getByRole('button', { name: 'Note names' }).click();
  await expect(note(page, '3:2').locator('.note-label')).toHaveText('A');

  // What the melody is made of, in numbers and in sentences.
  const insights = deck.getByRole('region', { name: 'In this melody' });
  await expect(insights).toContainText('95% of the melody is D minor pentatonic');
  await expect(insights).toContainText('A7 brings in 7 (C♯)');
  await expect(insights.getByRole('row', { name: /A7/ })).toContainText('V7');
  await expect(insights.getByRole('list', { name: 'Time on each scale degree' }).getByRole('listitem')).toHaveCount(8);
  // A chord in the table leads back to where it first sounds.
  await insights.getByRole('button', { name: 'C7' }).click();
  await expect(chordFact).toContainText('Over C7 ♭VII7');
});

test('a song whose page gives no chords says so and still shows what it is made of', async ({ page }) => {
  await openSongs(page);
  const bar = player(page), deck = study(page);
  await bar.getByRole('combobox', { name: 'Song' }).selectOption('wayfaring-stranger');
  await expect(bar.locator('.song-now [data-fact="chord"]')).toContainText('no chords on this page');
  await expect(deck.locator('.lane-none')).toHaveText('This page gives the melody without chords.');
  await expect(deck.getByRole('button', { name: 'From the chord' })).toBeDisabled();
  await expect(deck.getByRole('checkbox', { name: 'Chords under the melody' })).toBeDisabled();
  await expect(page.locator('.note-node.is-song-chord')).toHaveCount(0);
  await expect(deck.getByRole('region', { name: 'In this melody' })).toContainText('Every note is in D minor pentatonic');
  await expect(deck.getByRole('table')).toHaveCount(0);
});

test('a phrase loops until it is stopped', async ({ page }) => {
  await openSongs(page);
  const bar = player(page), deck = study(page);
  // Wayfaring Stranger's first line is nine notes and under four seconds long.
  await bar.getByRole('combobox', { name: 'Song' }).selectOption('wayfaring-stranger');
  const phrases = deck.getByRole('list', { name: 'Phrases' });
  await expect(phrases.getByRole('listitem')).toHaveCount(6);
  await deck.getByRole('checkbox', { name: 'Loop the phrase' }).check();
  await bar.getByRole('button', { name: 'Loop phrase' }).click();
  const now = bar.locator('.song-now');
  // The run is in real time, so the waits are generous: a busy machine stretches every timer.
  await expect(now).toContainText('Note 9 of 51', { timeout: 15000 });
  // Round again: the cursor comes back inside the phrase instead of running on to note 10.
  await expect(now).toContainText(/Note [1-8] of 51/, { timeout: 15000 });
  await expect(phrases.getByRole('button').first()).toHaveAttribute('aria-current', 'step');
  await bar.getByRole('button', { name: 'Stop' }).click();
  await expect(bar.getByRole('button', { name: 'Loop phrase' })).toBeVisible();
});

test('a phrase is played back from memory: the first note is given, slips are counted, and the saved view is untouched', async ({ page }) => {
  const path = pathForSong(SONGS[0], { frets: 12, lowest: 0, fourths: false });
  const [first, second] = phrasesOf(path);
  const ids = path.notes.slice(first.from, first.to + 1).map(n => n.id);
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Scale' }).waitFor();
  await expect.poll(() => savedView(page)).not.toBeNull();
  const before = await savedView(page);
  await page.getByRole('tab', { name: 'Songs' }).click();

  await player(page).getByRole('button', { name: 'Play it back' }).click();
  const recall = page.getByRole('region', { name: 'Play it back' });
  await expect(recall).toContainText('Phrase 1');
  // The round takes over like a drill: the player bar and the deck step aside, and nothing lights the melody.
  await expect(player(page)).toHaveCount(0);
  await expect(study(page)).toHaveCount(0);
  await expect(page.locator('.note-node.is-song-chord')).toHaveCount(0);
  await expect(page.locator('.song-ahead')).toHaveCount(0);
  await expect(page.locator('.note-node.is-song-next')).toHaveAttribute('data-note-id', ids[0]);

  // A wrong note is named and costs a slip; it does not move on.
  const feedback = recall.locator('.drill-feedback');
  await note(page, '1:5').click();
  await expect(feedback).toContainText("That's A");
  await expect(recall.locator('.drill-progress i.slip')).toHaveCount(1);
  await note(page, ids[0]).click();
  await expect(feedback).toHaveText(`1 of ${ids.length}`);
  // After the first note nothing is ringed until a hint is asked for.
  await expect(page.locator('.note-node.is-song-next')).toHaveCount(0);
  await recall.getByRole('button', { name: 'Hint' }).click();
  await expect(page.locator('.note-node.is-song-next')).toHaveAttribute('data-note-id', ids[1]);
  for (const id of ids.slice(1)) await note(page, id).click();
  await expect(feedback).toHaveText(`Played back. ${ids.length - 2} of ${ids.length} notes without a slip.`);
  await expect(recall.locator('.drill-progress i.done')).toHaveCount(ids.length);

  await recall.getByRole('button', { name: 'Next phrase' }).click();
  await expect(recall).toContainText('Phrase 2');
  await expect(page.locator('.note-node.is-song-next')).toHaveAttribute('data-note-id', path.notes[second.from].id);

  // Ending returns to the player, on the phrase just practised, with focus back on the button that started it.
  await recall.getByRole('button', { name: 'End' }).click();
  await expect(player(page).getByRole('button', { name: 'Play it back' })).toBeFocused();
  await expect(player(page).locator('.song-now')).toContainText(`Note ${second.from + 1} of 37`);
  await page.getByRole('tab', { name: 'Explore' }).click();
  expect(await savedView(page)).toBe(before);
});

test('on a phone the player rides above the neck and nothing widens the page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSongs(page);
  const bar = player(page);
  await expect(bar).toBeVisible();
  // The tabs sit below a long vertical neck, so the page is scrolled down here; the bar's transport stays stuck in sight.
  const stuck = (await bar.boundingBox())!;
  expect(stuck.y + stuck.height).toBeGreaterThan(44);
  expect(stuck.y).toBeLessThanOrEqual(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => (await bar.boundingBox())!.y < (await page.locator('.board-shell').boundingBox())!.y).toBe(true);
  await bar.getByRole('combobox', { name: 'Song' }).selectOption('scarborough-fair');
  await bar.getByRole('button', { name: 'Next note' }).click();
  await expect(bar.locator('.song-now')).toContainText('Note 2 of 68');
  // The long timeline scrolls inside its own strip.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect(await page.locator('.song-lanes-scroll').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await bar.getByRole('button', { name: 'Play it back' }).click();
  await expect(page.getByRole('region', { name: 'Play it back' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
