import test from 'node:test';
import assert from 'node:assert/strict';
import { position, STRINGS, noteName, intervalFrom, isInFocus, moveRegion, defaultState, restoreState } from '../src/music.js';

test('all six open strings use sounding pitch with correct octaves', () => {
  assert.deepEqual(STRINGS.map(s => { const n = position(s.number, 0); return noteName(n.pitch) + n.octave; }), ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']);
});
test('every fret advances one semitone and 12 frets repeat the pitch class', () => {
  for (const s of STRINGS) {
    for (let f = 0; f <= 24; f++) {
      const n = position(s.number, f);
      assert.equal(n.midi, s.midi + f);
      if (f >= 12) {
        const lower = position(s.number, f - 12);
        assert.equal(n.pitch, lower.pitch);
        assert.equal(n.octave, lower.octave + 1);
      }
    }
  }
});
test('G to B is a major third; adjacent string unisons account for it', () => {
  assert.equal(position(3, 4).midi, position(2, 0).midi);
  for (const s of [2, 4, 5, 6]) assert.equal(position(s, 5).midi, position(s - 1, 0).midi);
});
test('known C major triad and A minor pentatonic anchors are correct', () => {
  assert.deepEqual([[3, 5], [2, 5], [1, 3]].map(([s, f]) => noteName(position(s, f).pitch)), ['C', 'E', 'G']);
  assert.deepEqual([5, 8, 10, 12, 15].map(f => noteName(position(6, f).pitch)), ['A', 'C', 'D', 'E', 'G']);
});
test('spelling changes labels without changing musical identity', () => {
  assert.equal(noteName(1, 'sharps'), 'C♯');
  assert.equal(noteName(1, 'flats'), 'D♭');
  assert.equal(intervalFrom(0, 9), 3);
  assert.equal(intervalFrom(4, 0), 4);
  assert.equal(intervalFrom(7, 0), 7);
});
test('focus combines a string set and an inclusive fret range', () => {
  const state = { ...defaultState(), focus: true, from: 3, to: 7, strings: [1, 2, 3] };
  assert.equal(isInFocus(position(1, 3), state), true);
  assert.equal(isInFocus(position(3, 7), state), true);
  assert.equal(isInFocus(position(1, 2), state), false);
  assert.equal(isInFocus(position(4, 5), state), false);
  state.focus = false;
  assert.equal(isInFocus(position(1, 0), state), true);
  assert.equal(isInFocus(position(4, 5), state), false);
});
test('moving the region preserves width at both boundaries', () => {
  assert.deepEqual(moveRegion(0, 4, -1, 12), { from: 0, to: 4 });
  assert.deepEqual(moveRegion(8, 12, 1, 12), { from: 8, to: 12 });
  assert.deepEqual(moveRegion(3, 7, 1, 12), { from: 4, to: 8 });
});
test('stored state rejects invalid positions, bounds, and injected strings', () => {
  const state = restoreState({ root: 99, notes: [0, 0, 12, '<script>'], strings: [1, 7], frets: 12, from: 25, to: -9, marks: ['1:12', '1:12', '7:1', '1:25', '<b>'], labels: 'bad' });
  assert.equal(state.root, 9);
  assert.deepEqual(state.notes, [0]);
  assert.deepEqual(state.strings, [1]);
  assert.equal(state.from, 12);
  assert.equal(state.to, 12);
  assert.deepEqual(state.marks, ['1:12']);
  assert.equal(state.labels, 'none');
  assert.throws(() => position(7, 0), RangeError);
  assert.throws(() => position(1, -1), RangeError);
});
