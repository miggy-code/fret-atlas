import assert from 'node:assert/strict';
import test from 'node:test';
import { scaleById, spellTone, SCALES } from '../src/core/music';
import { defaultState, reducer, restoreState } from '../src/core/state';

// Standard music-theory definitions (semitones from the root). These are independent
// fixtures, not observations of any third-party tool.
const THEORY: Record<string, number[]> = {
  phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], locrian: [0, 1, 3, 5, 6, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11], 'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'phrygian-dominant': [0, 1, 4, 5, 7, 8, 10], 'mixolydian-b6': [0, 2, 4, 5, 7, 8, 10], 'lydian-dominant': [0, 2, 4, 6, 7, 9, 10],
  altered: [0, 1, 3, 4, 6, 8, 10], 'whole-tone': [0, 2, 4, 6, 8, 10],
  'diminished-hw': [0, 1, 3, 4, 6, 7, 9, 10], 'diminished-wh': [0, 2, 3, 5, 6, 8, 9, 11],
  'dominant-7': [0, 4, 7, 10], 'major-7': [0, 4, 7, 11], 'minor-7': [0, 3, 7, 10],
};

test('new scales have the standard pitch content', () => {
  for (const [id, steps] of Object.entries(THEORY)) assert.deepEqual(scaleById(id).tones.map(t => t.semitones), steps, id);
});
test('scale ids are unique and every scale is selectable by id', () => {
  const ids = SCALES.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(scaleById(id).id, id);
});
test('only scales containing a whole pentatonic get rectangle and stack geometry', () => {
  const families = Object.fromEntries(SCALES.filter(s => s.family).map(s => [s.id, s.family]));
  for (const id of ['phrygian', 'lydian', 'lydian-dominant']) assert.ok(families[id], id);
  for (const id of ['locrian', 'harmonic-minor', 'melodic-minor', 'phrygian-dominant', 'mixolydian-b6', 'altered', 'whole-tone', 'diminished-hw', 'diminished-wh', 'dominant-7']) assert.equal(families[id], undefined, id);
});
test('spelling uses one letter per scale degree', () => {
  const names = (id: string, root: number) => scaleById(id).tones.map(t => spellTone(root, 'sharps', t).name);
  assert.deepEqual(names('harmonic-minor', 9), ['A', 'B', 'C', 'D', 'E', 'F', 'G♯']);
  assert.deepEqual(names('whole-tone', 0), ['C', 'D', 'E', 'F♯', 'G♯', 'B♭']);
  assert.deepEqual(names('altered', 0), ['C', 'D♭', 'D♯', 'E', 'G♭', 'G♯', 'B♭']);
});
test('17 frets is a valid neck length and survives restore', () => {
  assert.equal(reducer(defaultState(), { type: 'frets', value: 17 }).frets, 17);
  assert.equal(restoreState({ ...defaultState(), frets: 17 }).frets, 17);
  assert.equal(reducer(defaultState(), { type: 'frets', value: 18 }).frets, 15);
});

// ---- Guitar-only extensions: tunings, extra pentatonics, One string, 3NPS, degree colors ----
import { position, tuningFor } from '../src/core/music';
import { studyChoices, tuningOf } from '../src/core/study';
import { selectedPitches } from '../src/core/state';

test('extra pentatonic scales use the chosen definitions', () => {
  const semis = (id: string) => scaleById(id).tones.map(t => t.semitones);
  assert.deepEqual(semis('minor-hexatonic'), [0, 2, 3, 5, 7, 10]);
  assert.deepEqual(semis('dominant-pentatonic-1'), [0, 2, 4, 7, 10]);
  assert.deepEqual(semis('dominant-pentatonic-2'), [0, 4, 5, 7, 10]);
  assert.deepEqual(semis('minor-major-pentatonic'), [0, 3, 5, 7, 9]);
  assert.equal(scaleById('minor-hexatonic').family, 'minor');
  assert.equal(scaleById('minor-hexatonic').tones.filter(t => !t.skeleton).length, 1);
});
test('lowering the guitar moves every open string down together; fourths raises only B and e', () => {
  assert.deepEqual(tuningFor(0).midi, [64, 59, 55, 50, 45, 40]);
  assert.equal(position(6, 0, tuningFor(2)).pitch, 2); // D
  assert.equal(position(6, 0, tuningFor(-2)).pitch, 6); // raising two semitones: F♯ on the lowest string
  assert.deepEqual(tuningFor(0, true).midi, [65, 60, 55, 50, 45, 40]);
  assert.equal(tuningFor(0, true).shift, 0);
  const t = tuningFor(0, true).midi;
  assert.ok(t.slice(0, -1).every((m, i) => m - t[i + 1] === 5), 'adjacent strings are all fourths');
});
test('forms land on scale tones in every tuning, key and pentatonic-family scale', () => {
  for (const fourths of [false, true]) for (let lowest = -2; lowest <= 5; lowest++) for (const scaleId of ['minor-pentatonic', 'major-pentatonic', 'minor-hexatonic', 'dorian']) for (let root = 0; root < 12; root++) {
    for (const studyMode of ['position', 'shape', 'diagonal', 'all'] as const) {
      const s = { ...defaultState(), root, scaleId, lowest, fourths, studyMode };
      const pitches = selectedPitches(s), tuning = tuningOf(s);
      const choices = studyChoices(s);
      if (studyMode !== 'diagonal') assert.ok(choices.length > 0, `${fourths}/${lowest}/${scaleId}/${root}/${studyMode}`);
      if (studyMode === 'all') continue;
      for (const c of choices) for (const shape of c.shapes) for (const e of shape.endpoints) {
        const [string, fret] = e.split(':').map(Number);
        if (fret < 0 || fret > 24) continue;
        assert.ok(pitches.includes(position(string, fret, tuning).pitch), `${fourths}/${lowest}/${scaleId}/${root}/${c.id}/${e}`);
      }
    }
  }
});
test('standard tuning forms are unchanged by the tuning work', () => {
  // A minor Form 1 sits at the fifth fret, as in the established default view.
  const form1 = studyChoices(defaultState()).find(c => c.label === 'Form 1' && c.anchor === 5)!;
  assert.deepEqual(form1.rows.map(r => [r.string, r.left, r.right]).slice(0, 2), [[1, 5, 8], [2, 5, 8]]);
});
test('One string offers one choice per string spanning the whole neck', () => {
  const s = { ...defaultState(), studyMode: 'string' as const };
  const choices = studyChoices(s);
  assert.equal(choices.length, 6);
  for (const c of choices) assert.deepEqual(c.rows, [{ string: c.form, left: 0, right: s.frets }]);
});
test('3NPS puts exactly three consecutive scale notes on each string, ascending through all six', () => {
  for (const scaleId of ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'harmonic-minor', 'melodic-minor']) for (const frets of [15, 22, 24]) for (let root = 0; root < 12; root += 5) {
    const s = { ...defaultState(), scaleId, root, frets, studyMode: 'nps' as const };
    const pitches = selectedPitches(s), tuning = tuningOf(s);
    const choices = studyChoices(s);
    // Positions that would run past the last fret are omitted, so shorter necks show fewer than seven.
    assert.equal(new Set(choices.map(c => c.form)).size >= (frets === 15 ? 5 : 7), true, `${scaleId}/${root} positions on a ${frets}-fret neck`);
    for (const c of choices) {
      assert.equal(c.rows.length, 6);
      let previousTop = -Infinity;
      for (const row of [...c.rows].sort((a, b) => b.string - a.string)) {
        const inScale = Array.from({ length: row.right - row.left + 1 }, (_, i) => row.left + i).filter(f => pitches.includes(position(row.string, f, tuning).pitch));
        assert.equal(inScale.length, 3, `${scaleId}/${root}/${c.id}/string ${row.string}`);
        const bottom = position(row.string, row.left, tuning).midi, top = position(row.string, row.right, tuning).midi;
        assert.ok(bottom > previousTop, `${scaleId}/${c.id}: strings ascend`);
        previousTop = top;
      }
    }
  }
});
test('3NPS needs exactly seven scale notes; pentatonics do not offer it', () => {
  assert.equal(studyChoices({ ...defaultState(), studyMode: 'nps' }).length, 0);
});
test('new preferences persist and invalid values are rejected', () => {
  const saved = restoreState({ ...defaultState(), lowest: 3, fourths: true, degreeColors: true, studyMode: 'nps' });
  assert.deepEqual([saved.lowest, saved.fourths, saved.degreeColors, saved.studyMode], [3, true, true, 'nps']);
  const bad = restoreState({ ...defaultState(), lowest: 99, fourths: 'yes', degreeColors: 1, studyMode: 'sideways' });
  assert.deepEqual([bad.lowest, bad.fourths, bad.degreeColors, bad.studyMode], [0, false, false, 'position']);
  assert.equal(reducer(defaultState(), { type: 'lowest', value: 9 }).lowest, 0);
  const kept = reducer({ ...defaultState(), lowest: 2, fourths: true }, { type: 'reset-view' });
  assert.deepEqual([kept.lowest, kept.fourths], [2, true]);
});
