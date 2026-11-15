import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DrillBar } from '../src/components/Drill';
import type { useDrill } from '../src/components/Drill';

type Session = ReturnType<typeof useDrill>;
const session = (over: Partial<Session>): Session => ({
  view: undefined, empty: false, tap() {}, skip() {}, hint() {}, reveal() {}, streak: 0, best: 0, rounds: 0, feedback: '', ...over,
});
const render = (s: Session) => renderToStaticMarkup(createElement(DrillBar, { session: s, onEnd() {} }));
const EMPTY = 'No notes to find in this view';

// The first paint of a drill comes before its first round is dealt; that is not the same as having nothing to find.
test('a drill that has not dealt its first round yet does not say there is nothing to find', () => {
  assert.ok(!render(session({})).includes(EMPTY));
});

test('a drill with nothing to find says so', () => {
  assert.ok(render(session({ empty: true })).includes(EMPTY));
});
