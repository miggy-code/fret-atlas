import test from 'node:test';
import assert from 'node:assert/strict';
import { drillSessionReducer, initialDrillSession } from '../src/core/drill-session';
import type { Drill } from '../src/core/drill';

const drill: Drill = { key: 'a', kind: 'form', pitch: 9, name: 'A', degree: '1', where: 'Form 1', targets: ['1:5', '2:10'], zone: [] };
const tap = (id: string) => ({ type: 'tap' as const, id, missFeedback: 'Try again', seconds: '2.0' });

test('a round handles misses, repeated hits, completion and new rounds', () => {
  let s = drillSessionReducer(initialDrillSession(0), { type: 'begin', drill, feedback: '' });
  s = drillSessionReducer(s, tap('1:4'));
  assert.equal(s.streak, 0);
  assert.equal(s.feedback, 'Try again');
  s = drillSessionReducer(s, tap('1:5'));
  assert.equal(s.streak, 1);
  assert.equal(drillSessionReducer(s, tap('1:5')), s);
  s = drillSessionReducer(s, tap('2:10'));
  assert.equal(s.phase.kind, 'complete');
  assert.equal(s.rounds, 1);
  assert.equal(s.best, 2);
  assert.equal(drillSessionReducer(s, tap('2:10')), s);
  s = drillSessionReducer(s, { type: 'begin', drill, feedback: 'Next prompt', resetStreak: true });
  assert.equal(s.phase.kind, 'finding');
  assert.equal(s.streak, 0);
});

test('hint and reveal mark the round assisted and revealed rounds reject taps', () => {
  let s = drillSessionReducer(initialDrillSession(3), { type: 'begin', drill, feedback: '' });
  s = drillSessionReducer(s, { type: 'hint' });
  assert.equal(s.phase.kind, 'finding');
  if (s.phase.kind !== 'finding') throw new Error('expected finding');
  assert.equal(s.phase.hint, '1:5');
  assert.equal(s.phase.assisted, true);
  s = drillSessionReducer(s, { type: 'reveal' });
  assert.equal(s.phase.kind, 'revealed');
  assert.equal(drillSessionReducer(s, tap('1:5')), s);
  assert.equal(drillSessionReducer(s, { type: 'stop' }).phase.kind, 'inactive');
  assert.equal(drillSessionReducer(s, { type: 'begin', feedback: '' }).phase.kind, 'empty');
});

import { transitionDrill } from '../src/core/drill-session';

test('accepted transitions alone authorize credit and sounds under rapid events', () => {
  let s = drillSessionReducer(initialDrillSession(0), { type: 'begin', drill, feedback: '' });
  let result = transitionDrill(s, tap('1:5'));
  assert.deepEqual(result.effects, [{ kind: 'record', best: 1 }, { kind: 'hit', id: '1:5' }]);
  s = result.state;
  result = transitionDrill(s, tap('1:5'));
  assert.deepEqual(result.effects, [{ kind: 'repeat', id: '1:5' }]);
  result = transitionDrill(s, { type: 'hint' });
  s = result.state;
  result = transitionDrill(s, tap('2:10'));
  assert.equal(result.state.phase.kind, 'complete');
  assert.deepEqual(result.effects, [{ kind: 'record', best: 2 }, { kind: 'complete', drill, found: ['1:5', '2:10'], credit: false }]);
  assert.deepEqual(transitionDrill(result.state, tap('2:10')).effects, []);
});

test('unassisted completion grants credit once; stopped rounds grant none', () => {
  let s = drillSessionReducer(initialDrillSession(5), { type: 'begin', drill, feedback: '' });
  s = transitionDrill(s, tap('1:5')).state;
  const result = transitionDrill(s, tap('2:10'));
  assert.deepEqual(result.effects, [{ kind: 'complete', drill, found: ['1:5', '2:10'], credit: true }]);
  s = drillSessionReducer(result.state, { type: 'stop' });
  assert.deepEqual(transitionDrill(s, tap('2:10')).effects, []);
});
