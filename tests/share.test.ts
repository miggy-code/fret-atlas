import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeShare, defaultState, encodeShare, reducer, restoreState, shareUrl } from '../src/core/state';
import type { Action, State } from '../src/core/state';
import { SCALES } from '../src/core/music';

// A small deterministic generator keeps failures reproducible.
function random(seed: number) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}
const pick = <T,>(next: () => number, items: readonly T[]) => items[Math.floor(next() * items.length)];
const subset = <T,>(next: () => number, items: readonly T[]) => items.filter(() => next() < 0.5);

function randomState(next: () => number): State {
  const s = defaultState();
  const flip = (key: 'leftHanded' | 'stringNames' | 'skeleton' | 'warp' | 'ghostForms' | 'context' | 'focus' | 'wholeMap' | 'hideAdded' | 'luckyCharms' | 'degreeColors' | 'chordColors' | 'fourths') => { if (next() < 0.4) s[key] = !s[key]; };
  for (const key of ['leftHanded', 'stringNames', 'skeleton', 'warp', 'ghostForms', 'context', 'focus', 'wholeMap', 'hideAdded', 'luckyCharms', 'degreeColors', 'chordColors', 'fourths'] as const) flip(key);
  if (next() < 0.7) s.root = Math.floor(next() * 12);
  if (next() < 0.7) s.scaleId = pick(next, SCALES.map(scale => scale.id));
  if (next() < 0.5) s.customPitches = subset(next, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  if (next() < 0.5) s.spelling = pick(next, ['sharps', 'flats'] as const);
  if (next() < 0.5) s.frets = pick(next, [12, 15, 17, 22, 24]);
  if (next() < 0.5) s.labels = pick(next, ['none', 'notes', 'intervals', 'both'] as const);
  if (next() < 0.5) s.lowest = Math.floor(next() * 8) - 2;
  if (next() < 0.5) s.studyMode = pick(next, ['position', 'shape', 'diagonal', 'all', 'string', 'nps'] as const);
  if (next() < 0.5) s.shapeKind = pick(next, ['rectangle', 'stack'] as const);
  if (next() < 0.5) s.form = 1 + Math.floor(next() * 5);
  if (next() < 0.3) s.studyFret = Math.floor(next() * 25);
  if (next() < 0.5) s.triad = pick(next, ['off', 'major', 'minor'] as const);
  if (next() < 0.3) s.triadRoot = Math.floor(next() * 12);
  if (next() < 0.5) s.patterns = subset(next, ['rectangle', 'stack'] as const);
  if (next() < 0.5) s.isolatedTones = subset(next, [0, 2, 4, 5, 7, 9, 11]);
  if (next() < 0.5) s.overlayRows = subset(next, [1, 2, 3, 4, 5, 6]);
  if (next() < 0.5) { s.from = Math.floor(next() * 12); s.to = s.from + Math.floor(next() * 12); }
  if (next() < 0.5) s.strings = subset(next, [1, 2, 3, 4, 5, 6]);
  if (next() < 0.5) s.marks = subset(next, ['1:0', '2:5', '3:12', '6:24', '4:7']);
  return s;
}

function walk(next: () => number): State {
  const actions: Action[] = [
    { type: 'root', value: Math.floor(next() * 12) },
    { type: 'scale', value: pick(next, SCALES.map(scale => scale.id)) },
    { type: 'form', value: 1 + Math.floor(next() * 5) },
    { type: 'toggle', key: pick(next, ['leftHanded', 'wholeMap', 'skeleton', 'context'] as const) },
    { type: 'note-view', value: pick(next, ['notes', 'intervals', 'both', 'charms'] as const) },
    { type: 'mark', id: `${1 + Math.floor(next() * 6)}:${Math.floor(next() * 13)}` },
    { type: 'frets', value: pick(next, [12, 15, 17, 22, 24]) },
    { type: 'pitch', value: Math.floor(next() * 12) },
    { type: 'study-mode', value: pick(next, ['position', 'shape', 'diagonal', 'all', 'string', 'nps'] as const) },
    { type: 'triad', value: pick(next, ['off', 'major', 'minor'] as const) },
  ];
  let state = defaultState();
  for (let step = 0; step < 12; step++) state = reducer(state, pick(next, actions));
  return state;
}

test('a share link decodes to exactly the restored state, for many states', () => {
  const next = random(7);
  for (let i = 0; i < 400; i++) {
    const state = i % 2 ? randomState(next) : walk(next);
    assert.deepEqual(decodeShare(encodeShare(state)), restoreState(state), encodeShare(state));
  }
});

test('the default state encodes to the bare version marker', () => {
  assert.equal(encodeShare(defaultState()), 'v1');
  assert.deepEqual(decodeShare('v1'), defaultState());
});

test('a link with a few changed settings stays well under 100 characters', () => {
  const state = { ...defaultState(), root: 2, scaleId: 'major-pentatonic' as const, leftHanded: true, labels: 'notes' as const, form: 3 };
  const link = shareUrl('https://fretory.com/?old=1#hash', state);
  assert.equal(link, 'https://fretory.com/?atlas=v1~f:3~r:2~s:major-pentatonic~lh:1~lb:notes');
  assert.ok(link.length < 100, `${link.length} characters`);
  assert.deepEqual(decodeShare(new URL(link).searchParams.get('atlas')!), restoreState(state));
});

test('every field has its own short code', () => {
  const everything: Omit<State, 'version'> = {
    studyMode: 'nps', shapeKind: 'stack', form: 2, studyFret: 5, wholeMap: true, hideAdded: true, root: 1, scaleId: 'major-pentatonic', customPitches: [1],
    spelling: 'flats', frets: 15, leftHanded: true, stringNames: false, labels: 'notes', chordColors: true, degreeColors: true, luckyCharms: true, lowest: 1,
    fourths: true, triad: 'major', triadRoot: 3, patterns: ['stack'], skeleton: true, warp: false, ghostForms: true, isolatedTones: [2], overlayRows: [1],
    context: true, focus: true, from: 1, to: 2, strings: [1], marks: ['1:2'],
  };
  const state: State = { version: 4, ...everything };
  for (const [key, value] of Object.entries(everything)) assert.notDeepEqual(value, defaultState()[key as keyof State], `${key} must differ from its default`);
  const codes = encodeShare(state).split('~').slice(1).map(token => token.slice(0, token.indexOf(':')));
  assert.equal(codes.length, Object.keys(everything).length);
  assert.equal(new Set(codes).size, codes.length);
});

test('links shared before the compact format still open exactly as before', () => {
  const legacy = { ...defaultState(), root: 4, scaleId: 'major-pentatonic' as const, leftHanded: true, marks: ['2:5'] };
  assert.deepEqual(decodeShare(JSON.stringify(legacy)), restoreState(legacy));
  // Old links from earlier schema versions are normalised by restoreState, not rejected.
  assert.deepEqual(decodeShare('{"root":3,"scale":"major-pentatonic"}'), restoreState({ root: 3, scale: 'major-pentatonic' }));
  // Valid JSON that is not a state restores the defaults, as it always did.
  assert.deepEqual(decodeShare('5'), defaultState());
});

test('garbage falls back safely', () => {
  for (const garbage of ['', 'hello', '{broken', 'v2~r:3', 'v1x', 'atlas']) assert.equal(decodeShare(garbage), null, garbage);
  // Unknown or malformed tokens are skipped; valid ones still apply, and nothing invalid reaches the state.
  assert.deepEqual(decodeShare('v1~zz:9~r:notanumber~~lh:1~:5~r'), { ...defaultState(), leftHanded: true });
  assert.deepEqual(decodeShare('v1~r:99~s:nonsense~fr:13~m:%E0%A4%A'), defaultState());
  assert.deepEqual(decodeShare('v1~cp:1,x,3~mk:9.9,1.5'), restoreState({ ...defaultState(), marks: ['1:5'] }));
});
