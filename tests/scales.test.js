import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, restoreState, position } from '../src/music.js';
import { SCALES, scalePitches, shapesFor, activeShape, insideShape, shapePolygon, displayNote, displayOctave } from '../src/scales.js';

test('A minor default rectangle and stack match familiar fifth-fret positions', () => {
  const s = defaultState();
  assert.deepEqual(activeShape(s).ids, ['1:5', '1:8', '2:5', '2:8']);
  const stack = shapesFor(s, 'stack').find(p => p.from === 5);
  assert.deepEqual(stack.ids, ['3:5', '3:7', '4:5', '4:7', '5:5', '5:7']);
});

test('all keys and supported scales produce only pentatonic shape endpoints', () => {
  for (let root = 0; root < 12; root++) for (const scale of SCALES.filter(s => s.skeleton)) {
    for (const overlay of ['rectangle', 'stack']) {
      const state = { ...defaultState(), root, scale: scale.id, overlay, frets: 24 };
      const shapes = shapesFor(state);
      assert.ok(shapes.length > 0);
      for (const shape of shapes) {
        assert.equal(shape.ids.length, overlay === 'rectangle' ? 4 : 6);
        for (const id of shape.ids) {
          const note = position(...id.split(':').map(Number));
          assert.ok(scale.skeleton.includes((note.pitch - root + 12) % 12));
          assert.ok(note.fret >= 0 && note.fret <= 24);
        }
      }
    }
  }
});

test('G–B crossing steps precisely one fret and survives mirroring', () => {
  const state = defaultState();
  const shape = shapesFor(state).find(s => s.warped);
  assert.deepEqual(shape.rows, [{ string: 2, left: 10, right: 13 }, { string: 3, left: 9, right: 12 }]);
  const points = shapePolygon(shape, 15, false).split(' ').map(p => p.split(',').map(Number));
  const mirrored = shapePolygon(shape, 15, true).split(' ').map(p => p.split(',').map(Number));
  assert.equal(Math.min(...points.map(p => p[0])) + Math.max(...mirrored.map(p => p[0])), 16);
  assert.deepEqual([...new Set(points.map(p => p[1]))], [...new Set(mirrored.map(p => p[1]))]);
});

test('added natural-minor tones are inside rectangle without being skeleton endpoints', () => {
  const state = { ...defaultState(), scale: 'minor' };
  const shape = activeShape(state);
  const f = position(2, 6);
  const b = position(1, 7);
  for (const note of [f, b]) {
    assert.ok(scalePitches('minor', 9).includes(note.pitch));
    assert.ok(insideShape(note, shape));
    assert.ok(!shape.ids.includes(note.id));
  }
});

test('narrow focus and excluded strings never return truncated shapes', () => {
  assert.deepEqual(shapesFor({ ...defaultState(), focus: true, from: 5, to: 6 }), []);
  assert.deepEqual(shapesFor({ ...defaultState(), strings: [1] }), []);
  assert.deepEqual(shapesFor({ ...defaultState(), scale: 'major-triad' }), []);
  assert.deepEqual(shapesFor({ ...defaultState(), scale: 'custom' }), []);
});

test('named scale restoration recomputes pitches; legacy custom notes and marks survive', () => {
  const restored = restoreState({ ...defaultState(), root: 0, scale: 'major', notes: [11], labels: 'none', stringNames: false });
  assert.deepEqual(restored.notes, [0, 2, 4, 5, 7, 9, 11]);
  assert.equal(restored.labels, 'none');
  assert.equal(restored.stringNames, false);
  const legacy = restoreState({ root: 0, notes: [0, 4, 7], marks: ['3:5'], labels: 'notes' });
  assert.equal(legacy.scale, 'custom');
  assert.equal(legacy.overlay, 'none');
  assert.deepEqual(legacy.notes, [0, 4, 7]);
  assert.deepEqual(legacy.marks, ['3:5']);
});

test('scale spelling handles E-sharp, B-sharp octave boundaries, and flat keys', () => {
  const sharp = { ...defaultState(), root: 1, scale: 'major' };
  assert.equal(displayNote(sharp, 5), 'E♯');
  assert.equal(displayNote(sharp, 0), 'B♯');
  assert.equal(displayOctave(sharp, position(2, 1)), 3); // C4 is B-sharp3.
  const flat = { ...sharp, spelling: 'flats' };
  assert.equal(displayNote(flat, 5), 'F');
  assert.equal(displayNote(flat, 0), 'C');
  assert.equal(displayOctave(flat, position(2, 1)), 4);
  assert.deepEqual(scalePitches('minor-pentatonic', 9), [0, 2, 4, 7, 9]);
});
