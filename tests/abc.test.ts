import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAbc, parseKey } from '../src/core/abc';

const tune = (body: string, header = 'L:1/8\nK:C') => parseAbc(`X:1\nT:Test\nM:4/4\n${header}\n${body}`);
const pitches = (body: string, header?: string) => tune(body, header).notes.map(n => n.midi);
const lengths = (body: string, header?: string) => tune(body, header).notes.map(n => n.beats);

test('letters, case and octave marks give written pitch, with C as middle C', () => {
  assert.deepEqual(pitches('C, C c c\' A,,'), [48, 60, 72, 84, 45]);
});

test('the key signature applies to every octave; an accidental lasts to the end of its bar at that pitch', () => {
  assert.deepEqual(pitches('F f', 'L:1/8\nK:G'), [66, 78]);
  assert.deepEqual(pitches('^F F f | F'), [66, 66, 77, 65]);
  assert.deepEqual(pitches('=F F | F', 'L:1/8\nK:D'), [65, 65, 66]);
  assert.deepEqual(pitches('_B __B ^^C'), [70, 69, 62]);
});

test('keys name their tonic and mode and carry the right signature', () => {
  assert.deepEqual(parseKey('Ador'), { tonic: 9, mode: 'dorian', signature: { F: 1 } });
  assert.deepEqual(parseKey('Am'), { tonic: 9, mode: 'minor', signature: {} });
  assert.deepEqual(parseKey('E minor'), { tonic: 4, mode: 'minor', signature: { F: 1 } });
  assert.deepEqual(parseKey('Dm'), { tonic: 2, mode: 'minor', signature: { B: -1 } });
  assert.deepEqual(parseKey('Bb'), { tonic: 10, mode: 'major', signature: { B: -1, E: -1 } });
  assert.deepEqual(parseKey('Dmix'), { tonic: 2, mode: 'mixolydian', signature: { F: 1 } });
  assert.deepEqual(parseKey('F#m'), { tonic: 6, mode: 'minor', signature: { F: 1, C: 1, G: 1 } });
});

test('lengths are multiples of the unit note, returned in quarter-note beats', () => {
  assert.deepEqual(lengths('A A2 A/2 A3/2 A/ A//'), [.5, 1, .25, .75, .25, .125]);
  assert.deepEqual(lengths('A A2', 'L:1/4\nK:C'), [1, 2]);
});

test('broken rhythm, triplets and ties change lengths; rests take time without a note', () => {
  assert.deepEqual(lengths('A>B A<B A>>B'), [.75, .25, .25, .75, .875, .125]);
  assert.deepEqual(lengths('(3ABc d').map(n => +n.toFixed(4)), [.3333, .3333, .3333, .5]);
  assert.deepEqual(lengths('A2-A2 B'), [2, .5]);
  const rested = tune('A z2 B');
  assert.deepEqual(rested.notes.map(n => n.start), [0, 1.5]);
  assert.equal(rested.length, 2);
});

test('repeats play twice, and the second time round takes the second ending', () => {
  assert.deepEqual(pitches('|: C D :| E'), [60, 62, 60, 62, 64]);
  assert.deepEqual(pitches('|: C |1 D :|2 E |] F'), [60, 62, 60, 64, 65]);
  assert.deepEqual(pitches('C |: D [1 E :| [2 F || G'), [60, 62, 64, 62, 65, 67]);
  assert.deepEqual(pitches('C D :: E F :|'), [60, 62, 60, 62, 64, 65, 64, 65]);
});

test('chord symbols, decorations, grace notes, slurs and inline fields are not notes', () => {
  assert.deepEqual(pitches('"Am" ~A !trill!B {g}c (de) .f [P:B] Hg'), [69, 71, 72, 74, 76, 77, 79]);
});

test('chords play their top note, and lyrics and comments are ignored', () => {
  const t = parseAbc('X:1\nT:Test\nM:3/4\nL:1/8\nK:C\n[CEG]2 A % comment\nw: some words here');
  assert.deepEqual(t.notes.map(n => [n.midi, n.beats]), [[67, 1], [69, .5]]);
});

test('the header gives title, meter, tempo in quarter notes, and key', () => {
  const t = parseAbc('X:1\nT:Waltz\nM:6/8\nL:1/8\nQ:3/8=60\nK:Em\nE');
  assert.equal(t.title, 'Waltz');
  assert.deepEqual(t.meter, [6, 8]);
  assert.equal(t.tempo, 90);
  assert.deepEqual(t.key, { tonic: 4, mode: 'minor' });
  assert.equal(parseAbc('X:1\nM:3/4\nL:1/8\nQ:1/4=120\nK:C\nC').tempo, 120);
});
