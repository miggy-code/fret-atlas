import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, reducer, restoreState, studyModeAvailable } from '../src/core/state';
import type { State } from '../src/core/state';
import type { StudyMode } from '../src/core/study';

const modes: StudyMode[] = ['position', 'shape', 'diagonal', 'all', 'string', 'nps'];
const base = (over: Partial<State>): State => ({ ...defaultState(), ...over });
const selectedIsAvailable = (s: State) => assert.ok(studyModeAvailable(s, s.studyMode), `${s.studyMode} is selected but unavailable for ${s.scaleId}`);

test('the whole neck is always an available view', () => {
  for (const scaleId of ['minor-pentatonic', 'major', 'custom']) assert.ok(studyModeAvailable(base({ scaleId }), 'all'));
});

test('availability follows the scale: shape and diagonal need a pentatonic family, 3 notes/string needs seven notes, position needs a named scale', () => {
  const pent = base({ scaleId: 'minor-pentatonic' }), major = base({ scaleId: 'major' }), custom = base({ scaleId: 'custom', customPitches: [0, 3, 7] });
  assert.deepEqual(modes.filter(m => studyModeAvailable(pent, m)), ['position', 'shape', 'diagonal', 'all', 'string']);
  assert.ok(studyModeAvailable(major, 'nps') && studyModeAvailable(major, 'position'));
  assert.deepEqual(modes.filter(m => studyModeAvailable(custom, m)), ['all', 'string']);
});

test('changing the scale never leaves a disabled view selected', () => {
  for (const from of modes) for (const scaleId of ['minor-pentatonic', 'major', 'minor-blues', 'custom']) {
    selectedIsAvailable(reducer(base({ scaleId: 'major', studyMode: from }), { type: 'scale', value: scaleId }));
  }
});

test('3 notes/string on a seven-note scale falls back to position when the new scale cannot do it', () => {
  assert.equal(reducer(base({ scaleId: 'major', studyMode: 'nps' }), { type: 'scale', value: 'minor-pentatonic' }).studyMode, 'position');
});

test('opening custom notes from shape or position lands on the whole neck, which custom notes can show', () => {
  for (const from of ['shape', 'diagonal', 'position'] as const) assert.equal(reducer(base({ studyMode: from }), { type: 'scale', value: 'custom' }).studyMode, 'all');
});

test('clearing every custom note leaves one-string view for the whole neck', () => {
  const s = reducer(base({ scaleId: 'custom', customPitches: [0, 4], studyMode: 'string' }), { type: 'pitches', value: [] });
  assert.equal(s.studyMode, 'all');
  selectedIsAvailable(reducer(base({ scaleId: 'custom', customPitches: [0], studyMode: 'string' }), { type: 'pitch', value: 0 }));
});

test('a saved state with a disabled view is repaired on restore', () => {
  selectedIsAvailable(restoreState({ version: 4, scaleId: 'custom', customPitches: [0, 3, 7], studyMode: 'shape' }));
  selectedIsAvailable(restoreState({ version: 4, scaleId: 'minor-pentatonic', studyMode: 'nps' }));
});
