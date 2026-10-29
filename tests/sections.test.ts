import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, reducer, sectionModified, SECTION_KEYS, visibleShapes } from '../src/core/state';
import type { Section, State } from '../src/core/state';
import { activeStudy, ghostStudies } from '../src/core/study';
import { findShapes } from '../src/core/shapes';
import { position } from '../src/core/music';
import { notePresentation } from '../src/core/presentation';

const SECTIONS = Object.keys(SECTION_KEYS) as Section[];

test('A minor form 3 keeps the warped rectangle crossing the last fret', () => {
  for (const studyMode of ['position', 'shape'] as const) {
    const state = { ...defaultState(), studyMode, form: 3, frets: 12 };
    const rectangle = activeStudy(state)?.shapes.find(shape => shape.id === 'rectangle:3:9');
    assert.deepEqual(rectangle?.rows, [
      { string: 2, left: 10, right: 13 },
      { string: 3, left: 9, right: 12 },
    ]);
    assert.ok(visibleShapes(state).some(shape => shape.id === rectangle?.id));
  }
});

// Every section's keys set to a non-default value, plus musical/study settings that no restore may touch.
function changedState(): State {
  return {
    ...defaultState(),
    root: 2, scaleId: 'minor', customPitches: [0, 3, 7], marks: ['1:5', '6:3'], studyMode: 'diagonal', form: 3, shapeKind: 'stack',
    labels: 'intervals', luckyCharms: false, degreeColors: true, chordColors: false, isolatedTones: [3],
    wholeMap: true, ghostForms: true, skeleton: true, warp: false, context: true, hideAdded: true, patterns: ['stack'], overlayRows: [1, 2, 3],
    triad: 'major', triadRoot: 4, focus: true, from: 2, to: 7, strings: [1, 2],
    frets: 22, lowest: -2, fourths: true, spelling: 'flats', stringNames: false, leftHanded: true,
  };
}

test('every section key differs from its default in the fixture', () => {
  const defaults = defaultState() as unknown as Record<string, unknown>;
  const changed = changedState() as unknown as Record<string, unknown>;
  for (const section of SECTIONS) for (const key of SECTION_KEYS[section]) {
    if (key === 'luckyCharms' || key === 'chordColors') continue; // mutually exclusive with degreeColors
    assert.notDeepEqual(changed[key], defaults[key], `${section}.${key}`);
  }
});

test('reset-section restores exactly its own keys and leaves key, scale, marks, study mode and form alone', () => {
  const defaults = defaultState() as unknown as Record<string, unknown>;
  for (const section of SECTIONS) {
    const before = changedState();
    const after = reducer(before, { type: 'reset-section', value: section }) as unknown as Record<string, unknown>;
    const prior = before as unknown as Record<string, unknown>;
    const owned = new Set<string>(SECTION_KEYS[section]);
    for (const key of Object.keys(prior)) {
      if (key === 'studyFret') continue; // a restore re-centres the study
      if (owned.has(key)) assert.deepEqual(after[key], defaults[key], `${section} restores ${key}`);
      else assert.deepEqual(after[key], prior[key], `${section} keeps ${key}`);
    }
    for (const key of ['root', 'scaleId', 'customPitches', 'marks', 'studyMode', 'form', 'shapeKind'] as const) assert.deepEqual(after[key], prior[key], `${section} keeps ${key}`);
    assert.equal(sectionModified(after as unknown as State, section), false);
  }
});

test('sections own disjoint keys and never include musical or study settings', () => {
  const all = SECTIONS.flatMap(section => SECTION_KEYS[section]);
  assert.equal(new Set(all).size, all.length);
  for (const key of ['root', 'scaleId', 'customPitches', 'marks', 'studyMode', 'form', 'version'] as const) assert.ok(!all.includes(key), key);
});

test('sectionModified is false by default and true only for the section that changed', () => {
  for (const section of SECTIONS) assert.equal(sectionModified(defaultState(), section), false, section);
  const cases: [Section, State][] = [
    ['note-view', reducer(defaultState(), { type: 'note-view', value: 'notes' })],
    ['note-view', reducer(defaultState(), { type: 'isolate-tone', value: 7 })],
    ['overlays', reducer(defaultState(), { type: 'toggle', key: 'skeleton' })],
    ['practice', reducer(defaultState(), { type: 'toggle', key: 'focus' })],
    ['instrument', reducer(defaultState(), { type: 'toggle', key: 'leftHanded' })],
  ];
  for (const [section, s] of cases) for (const other of SECTIONS) assert.equal(sectionModified(s, other), other === section, `${section} change seen by ${other}`);
  // Key, scale, marks and study view are not panel settings.
  let s = reducer(defaultState(), { type: 'root', value: 4 });
  s = reducer(s, { type: 'scale', value: 'major' });
  s = reducer(s, { type: 'mark', id: '1:5' });
  s = reducer(s, { type: 'study-mode', value: 'all' });
  // Pattern families and triads live outside the panels.
  s = reducer(s, { type: 'patterns', value: ['stack'] });
  s = reducer(s, { type: 'triad', value: 'minor' });
  for (const section of SECTIONS) assert.equal(sectionModified(s, section), false, section);
  // Restoring a re-toggled default returns to unmodified.
  assert.equal(sectionModified(reducer(reducer(defaultState(), { type: 'toggle', key: 'skeleton' }), { type: 'toggle', key: 'skeleton' }), 'overlays'), false);
});

test('Shape and Diagonal keep their chosen family even when the family filter excludes it', () => {
  for (const studyMode of ['shape', 'diagonal'] as const) for (const shapeKind of ['rectangle', 'stack'] as const) {
    const other = shapeKind === 'rectangle' ? 'stack' : 'rectangle';
    const state = { ...defaultState(), studyMode, shapeKind, patterns: [other] as State['patterns'] };
    assert.ok(visibleShapes(state).length > 0, `${studyMode} ${shapeKind}`);
  }
});

test('patterns action keeps only valid pattern families', () => {
  const s = defaultState();
  assert.deepEqual(reducer(s, { type: 'patterns', value: ['stack'] }).patterns, ['stack']);
  assert.deepEqual(reducer(s, { type: 'patterns', value: ['rectangle', 'stack'] }).patterns, ['rectangle', 'stack']);
  assert.deepEqual(reducer(s, { type: 'patterns', value: ['circle', 'stack', 7] as never }).patterns, ['stack']);
  assert.deepEqual(reducer(s, { type: 'patterns', value: ['bogus'] as never }).patterns, []);
  const stacks = reducer(reducer(s, { type: 'study-mode', value: 'all' }), { type: 'patterns', value: ['stack'] });
  assert.ok(visibleShapes(stacks).length > 0);
  assert.ok(visibleShapes(stacks).every(shape => shape.kind === 'stack'));
});

test('whole neck adds partial shapes that run past the nut and the last fret', () => {
  const s = reducer(defaultState(), { type: 'study-mode', value: 'all' });
  const shapes = activeStudy(s)!.shapes;
  const pastNut = shapes.filter(shape => shape.rows.some(row => row.left < 0));
  const pastEnd = shapes.filter(shape => shape.rows.some(row => row.right > s.frets));
  assert.ok(pastNut.length > 0, 'a shape reaches below fret 0');
  assert.ok(pastEnd.length > 0, 'a shape reaches past the last fret');
  // Every kept row still touches the neck.
  for (const shape of shapes) for (const row of shape.rows) assert.ok(row.right >= 0 && row.left <= s.frets, shape.id);
  // Without fret edges no row leaves the neck, so these shapes are new.
  const before = (['rectangle', 'stack'] as const).flatMap(kind => findShapes({ root: s.root, scaleId: s.scaleId, kind, frets: s.frets }));
  assert.ok(before.every(shape => shape.rows.every(row => row.left >= 0 && row.right <= s.frets)));
  const beforeIds = new Set(before.map(shape => shape.id));
  assert.ok([...pastNut, ...pastEnd].every(shape => !beforeIds.has(shape.id)));
  assert.ok(shapes.length > before.length);
  assert.ok(visibleShapes(s).some(shape => shape.rows.some(row => row.left < 0)));
  assert.ok(visibleShapes(s).some(shape => shape.rows.some(row => row.right > s.frets)));
});

test('run tones appear only in diagonal, only for active notes outside every block', () => {
  const runs = (s: State) => {
    const study = activeStudy(s);
    const shapes = visibleShapes(s, study);
    const ghosts = ghostStudies(s);
    const found: string[] = [];
    for (let string = 1; string <= 6; string++) for (let fret = 0; fret <= s.frets; fret++) {
      const p = notePresentation(position(string, fret), s, shapes, study, ghosts);
      if (p.run) {
        assert.equal(p.active, true);
        assert.equal(p.selected, true);
        assert.equal(p.member, false);
        found.push(`${string}:${fret}`);
      }
      if (s.studyMode === 'diagonal' && p.active && !p.member && shapes.length) assert.equal(p.run, true);
    }
    return found;
  };
  for (const kind of ['rectangle', 'stack'] as const) {
    const diagonal = reducer(reducer(defaultState(), { type: 'study-mode', value: 'diagonal' }), { type: 'shape-kind', value: kind });
    if (kind === 'rectangle') assert.ok(runs(diagonal).length > 0, 'rectangle diagonals have continuation tones');
    else runs(diagonal);
    // Without outlines nothing can be a continuation tone.
    assert.deepEqual(runs({ ...diagonal, overlayRows: [] }), []);
  }
  for (const mode of ['position', 'shape', 'all', 'string', 'nps'] as const) {
    let s = reducer(defaultState(), { type: 'study-mode', value: mode });
    if (mode === 'nps') s = reducer(s, { type: 'scale', value: 'minor' });
    assert.deepEqual(runs(s), [], mode);
  }
});
