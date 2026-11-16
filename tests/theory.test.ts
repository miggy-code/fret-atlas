import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chordRole, isNoteId, NECK_LENGTHS, noteAt, noteId, parseNoteId, SCALES, scaleById, selectedPitches, STANDARD_TUNING, stringName, STRINGS,
  TRIAD_INTERVALS, triadOf, tuningFor,
} from '../src/core/music';
import type { Scale } from '../src/core/music';
import { findShapes } from '../src/core/shapes';
import { defaultState, noteColorsOf, noteViewOf, reducer, restoreState, shownTriad, triadPitches } from '../src/core/state';
import type { NoteColors, NoteView, State } from '../src/core/state';
import { STUDY_MODES } from '../src/core/study';
import { notePresentation, toneAppearance } from '../src/core/presentation';

const base = (over: Partial<State> = {}): State => ({ ...defaultState(), ...over });
const tone = (scale: Scale, semitones: number) => scale.tones.find(t => t.semitones === semitones)!;

// ---- Note identity: one string:fret format, written and read in one place ----

test('a note id names a physical string and fret and reads back unchanged', () => {
  for (const string of STRINGS) for (const fret of [0, 1, 9, 10, 24]) {
    const id = noteId(string, fret);
    assert.equal(id, `${string}:${fret}`);
    assert.deepEqual(parseNoteId(id), [string, fret]);
    assert.ok(isNoteId(id));
  }
  assert.equal(noteAt('6:5', tuningFor(2)).midi, 38 + 5);
  assert.equal(noteAt('1:0').id, '1:0');
});

test('only real positions on a six-string, 24-fret neck are note ids', () => {
  for (const bad of ['0:1', '7:1', '1:25', '1:-1', '1:5x', '1', '', ':3', '1:05', 5, null, undefined, ['1:5']]) assert.equal(isNoteId(bad), false, String(bad));
  // The saved view and the reducer accept exactly the same ids.
  assert.deepEqual(restoreState({ ...defaultState(), marks: ['1:5', '7:1', '1:25', '6:24', 5] }).marks, ['1:5', '6:24']);
  assert.deepEqual(reducer(base(), { type: 'mark', id: '1:25' }).marks, []);
  assert.deepEqual(reducer(base(), { type: 'mark', id: '6:24' }).marks, ['6:24']);
});

// ---- Instrument facts ----

test('strings are named from the tuning, high e in lowercase', () => {
  assert.deepEqual(STRINGS.map(string => stringName(string, STANDARD_TUNING, 'sharps')), ['e', 'B', 'G', 'D', 'A', 'E']);
  assert.deepEqual(STRINGS.map(string => stringName(string, tuningFor(1), 'flats')), ['e♭', 'B♭', 'G♭', 'D♭', 'A♭', 'E♭']);
  assert.deepEqual(STRINGS.map(string => stringName(string, tuningFor(0, true), 'sharps')), ['f', 'C', 'G', 'D', 'A', 'E']);
});

test('every offered neck length is accepted by the reducer and survives a restore, and nothing else is', () => {
  assert.deepEqual([...NECK_LENGTHS], [12, 15, 17, 22, 24]);
  for (const frets of NECK_LENGTHS) {
    assert.equal(reducer(base(), { type: 'frets', value: frets }).frets, frets);
    assert.equal(restoreState({ ...defaultState(), frets }).frets, frets);
  }
  for (const frets of [0, 11, 13, 25]) {
    assert.equal(reducer(base(), { type: 'frets', value: frets }).frets, 12);
    assert.equal(restoreState({ ...defaultState(), frets }).frets, 12);
  }
});

// ---- Triads are one musical fact, wherever they are shown, heard or drilled ----

test('a triad is a root, a major or minor third and a perfect fifth', () => {
  assert.deepEqual(TRIAD_INTERVALS, { major: [0, 4, 7], minor: [0, 3, 7] });
  assert.deepEqual(triadOf(9, 'minor'), [9, 0, 4]);
  assert.deepEqual(triadOf(9, 'major'), [9, 1, 4]);
  assert.deepEqual(triadOf(11, 'major'), [11, 3, 6]);
});

test('the shown triad follows the key until it is given its own root', () => {
  assert.equal(shownTriad(base()), undefined);
  assert.deepEqual(shownTriad(base({ triad: 'major', root: 2 })), { root: 2, quality: 'major' });
  assert.deepEqual(shownTriad(base({ triad: 'minor', root: 2, triadRoot: 7 })), { root: 7, quality: 'minor' });
  assert.deepEqual(triadPitches(base({ triad: 'minor', root: 2, triadRoot: 7 })), triadOf(7, 'minor'));
  assert.deepEqual(triadPitches(base()), []);
});

// ---- The scale catalog holds only what can be chosen ----

test('the catalog has no triad entries; old triad studies still restore as custom notes with a triad', () => {
  assert.equal(SCALES.some(scale => scale.id.endsWith('-triad')), false);
  assert.equal(reducer(base(), { type: 'scale', value: 'major-triad' }).scaleId, 'minor-pentatonic');
  const restored = restoreState({ version: 3, scaleId: 'major-triad', root: 4 });
  assert.deepEqual([restored.scaleId, restored.triad, restored.triadRoot, restored.customPitches], ['custom', 'major', 4, [4, 8, 11]]);
  assert.deepEqual(selectedPitches(restored), [4, 8, 11]);
  // A legacy (pre-version-2) link names the scale under `scale`.
  assert.equal(restoreState({ scale: 'minor-triad', root: 0 }).triad, 'minor');
});

test('every catalog scale starts on its root, ascends, and spells each tone from its declared degree', () => {
  for (const scale of SCALES.filter(s => s.id !== 'custom')) {
    const semitones = scale.tones.map(t => t.semitones);
    assert.equal(semitones[0], 0, scale.id);
    assert.deepEqual(semitones, [...new Set(semitones)].sort((a, b) => a - b), scale.id);
    const NATURALS = [0, 2, 4, 5, 7, 9, 11];
    for (const t of scale.tones) assert.equal(NATURALS[t.degree - 1] + t.alteration, t.semitones, `${scale.id} degree ${t.degree}`);
  }
});

// ---- Chord tones: the scale's own tonic triad ----

test('a scale has one third and one fifth as chord tones; a blue note beside them is not one', () => {
  const blues = scaleById('minor-blues');
  assert.equal(chordRole(blues, tone(blues, 7)), 'fifth');
  assert.equal(chordRole(blues, tone(blues, 6)), undefined, 'the ♭5 blue note is not the chord fifth');
  assert.equal(chordRole(blues, tone(blues, 3)), 'third');
  const majorBlues = scaleById('major-blues');
  assert.equal(chordRole(majorBlues, tone(majorBlues, 4)), 'third');
  assert.equal(chordRole(majorBlues, tone(majorBlues, 3)), undefined, 'the ♭3 blue note is not the chord third');
  const halfWhole = scaleById('diminished-hw');
  assert.equal(chordRole(halfWhole, tone(halfWhole, 4)), 'third');
  assert.equal(chordRole(halfWhole, tone(halfWhole, 3)), undefined);
  // A scale whose only fifth is altered keeps it: the tonic triad is diminished or augmented.
  assert.equal(chordRole(scaleById('locrian'), tone(scaleById('locrian'), 6)), 'fifth');
  assert.equal(chordRole(scaleById('whole-tone'), tone(scaleById('whole-tone'), 8)), 'fifth');
  assert.equal(chordRole(scaleById('diminished-wh'), tone(scaleById('diminished-wh'), 6)), 'fifth');
});

test('in every scale the chord tones are thirds and fifths, and a perfect fifth or lone third is always one', () => {
  for (const scale of SCALES.filter(s => s.id !== 'custom')) {
    const roles = scale.tones.map(t => [t.semitones, chordRole(scale, t)] as const);
    for (const [semitones, role] of roles) {
      if (role === 'third') assert.ok([3, 4].includes(semitones), `${scale.id}: third at ${semitones}`);
      if (role === 'fifth') assert.ok([6, 7, 8].includes(semitones), `${scale.id}: fifth at ${semitones}`);
      if (![3, 4, 6, 7, 8].includes(semitones)) assert.equal(role, undefined, `${scale.id}: ${semitones}`);
    }
    if (scale.tones.some(t => t.semitones === 7)) assert.deepEqual(roles.filter(([, role]) => role === 'fifth').map(([s]) => s), [7], scale.id);
    const thirds = scale.tones.filter(t => t.degree === 3);
    if (thirds.length === 1) assert.equal(chordRole(scale, thirds[0]), 'third', scale.id);
  }
});

// ---- Note view and colors: two choices, however they are stored ----

test('note view and note colors read back the single choice the reducer stored', () => {
  for (const value of ['none', 'notes', 'intervals', 'both', 'charms'] as NoteView[]) assert.equal(noteViewOf(reducer(base(), { type: 'note-view', value })), value);
  for (const value of ['root', 'chord', 'degrees'] as NoteColors[]) assert.equal(noteColorsOf(reducer(base(), { type: 'note-colors', value })), value);
  assert.equal(noteViewOf(base()), 'none');
  assert.equal(noteColorsOf(base()), 'root');
});

test('the board and the legend draw a tone the same way', () => {
  const blues = scaleById('minor-blues');
  const s = base({ scaleId: 'minor-blues' });
  const fifth = tone(blues, 7), blue = tone(blues, 6), root = tone(blues, 0), third = tone(blues, 3);
  // Root highlight: nothing but the root color, which the tone kind carries.
  assert.deepEqual(toneAppearance(s, blues, fifth), { charm: undefined, degreeColored: false, chordRole: undefined, color: 'var(--degree-5)' });
  const chord = reducer(s, { type: 'note-colors', value: 'chord' });
  assert.equal(toneAppearance(chord, blues, fifth).chordRole, 'fifth');
  assert.equal(toneAppearance(chord, blues, third).chordRole, 'third');
  assert.equal(toneAppearance(chord, blues, blue).chordRole, undefined);
  assert.equal(toneAppearance(chord, blues, root).chordRole, undefined);
  const degrees = reducer(s, { type: 'note-colors', value: 'degrees' });
  assert.equal(toneAppearance(degrees, blues, fifth).degreeColored, true);
  assert.equal(toneAppearance(degrees, blues, blue).degreeColored, true);
  assert.equal(toneAppearance(degrees, blues, root).degreeColored, false, 'the root keeps its own color');
  assert.equal(toneAppearance(degrees, blues, fifth).chordRole, undefined);
  // Lucky Charms replaces color choices with one silhouette per degree.
  const charms = reducer(degrees, { type: 'note-view', value: 'charms' });
  assert.deepEqual(toneAppearance(charms, blues, fifth), { charm: 5, degreeColored: false, chordRole: undefined, color: 'var(--degree-5)' });
  // The board's notes carry exactly the legend's answer. In A blues, string 1: fret 12 is E (5), fret 11 is E♭ (♭5), fret 9 is C♯ (outside).
  const note = (fret: number, state: State) => notePresentation(noteAt(noteId(1, fret)), state);
  assert.equal(note(12, chord).chordRole, 'fifth');
  assert.equal(note(11, chord).chordRole, undefined);
  assert.equal(note(12, charms).charm, 5);
  assert.equal(note(12, degrees).degreeColored, true);
  assert.deepEqual([note(9, chord).chordRole, note(9, charms).charm, note(9, degrees).degreeColored, note(9, degrees).color], [undefined, undefined, false, undefined]);
  // Custom notes have no degrees to color.
  const custom = base({ scaleId: 'custom', customPitches: [4, 9], degreeColors: true });
  assert.deepEqual([note(12, custom).degreeColored, note(12, custom).color], [false, undefined]);
});

// ---- Shapes carry their own topology ----

test('a shape records its bottom string and base fret, including the virtual strings of edge fragments', () => {
  for (const kind of ['rectangle', 'stack'] as const) {
    const shapes = findShapes({ root: 9, scaleId: 'minor-pentatonic', kind, frets: 15, includeFretEdges: true });
    assert.ok(shapes.length > 0);
    for (const shape of shapes) {
      assert.equal(shape.id, `${kind}:${shape.bottom}:${shape.base}`);
      assert.ok(Number.isInteger(shape.bottom) && Number.isInteger(shape.base));
      // The bottom row, when it is on the neck, starts at the base fret.
      const bottomRow = shape.rows.find(row => row.string === shape.bottom);
      if (bottomRow) assert.equal(bottomRow.left, shape.base);
      assert.equal(shape.continuesBelow, shape.bottom > 6);
    }
    assert.ok(shapes.some(shape => shape.bottom > 6), 'edge fragments below the low string are found');
  }
});

// ---- Study helpers ----

test('study views are one list, and each restores', () => {
  assert.deepEqual([...STUDY_MODES], ['position', 'shape', 'diagonal', 'all', 'string', 'nps']);
  for (const studyMode of STUDY_MODES) assert.equal(restoreState({ ...defaultState(), scaleId: 'major', studyMode }).studyMode, studyMode);
  assert.equal(restoreState({ ...defaultState(), studyMode: 'sideways' }).studyMode, 'position');
});

test('a tone stores no fact the others contradict: its alteration is what its semitones and degree give', () => {
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  for (const scale of SCALES) for (const t of scale.tones) assert.equal(t.alteration, t.semitones - MAJOR[t.degree - 1], `${scale.id} ${degreeLabel(t)}`);
});

test('the G–B correction follows from the string pitches, for every tuning the app offers', () => {
  for (const { lowered } of LOWEST_STRING_CHOICES) {
    assert.equal(gbShift(tuningFor(lowered)), 1);
    assert.equal(gbShift(tuningFor(lowered, true)), 0);
    assert.equal(tuningFor(lowered).midi.length, STRING_COUNT);
  }
  assert.equal('shift' in tuningFor(0), false);
  assert.deepEqual([...STRINGS], Array.from({ length: STRING_COUNT }, (_, i) => i + 1));
});
import { degreeLabel, gbShift, LOWEST_STRING_CHOICES, STRING_COUNT } from '../src/core/music';

test('note view and note colors change only through their own actions', () => {
  // Checked by the compiler only: these dispatches could leave the flags in a combination the UI cannot show.
  const refused = (): Action[] => [
    // @ts-expect-error charms are a note view
    { type: 'toggle', key: 'luckyCharms' },
    // @ts-expect-error degree colors are a note color choice
    { type: 'toggle', key: 'degreeColors' },
    // @ts-expect-error chord colors are a note color choice
    { type: 'toggle', key: 'chordColors' },
    // @ts-expect-error labels change through note-view
    { type: 'labels', value: 'notes' },
    // @ts-expect-error nothing resets focus on its own
    { type: 'focus-reset' },
  ];
  assert.ok(refused);
});
import type { Action } from '../src/core/state';
