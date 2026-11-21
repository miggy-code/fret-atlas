import test from 'node:test';
import assert from 'node:assert/strict';
import { bookCoverage, commonGrip, gripInForm, gripsFor, strum } from '../src/core/chord-shapes';
import type { Grip } from '../src/core/chord-shapes';
import { parseChord } from '../src/core/harmony';
import { mod } from '../src/core/music';
import { defaultState } from '../src/core/state';
import { studyChoices } from '../src/core/study';

const neck = { frets: 22, lowest: 0, fourths: false };
const chord = (symbol: string) => { const parsed = parseChord(symbol); assert.ok(parsed, symbol); return parsed; };
// A grip as a chord chart writes it: low E to high e, x for a muted string.
const chart = (grip: Grip) => [6, 5, 4, 3, 2, 1].map(string => grip.notes.find(n => n.string === string)?.fret ?? 'x').join(grip.notes.some(n => n.fret > 9) ? '-' : '');

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
// Every chord type the chord book and the CAGED shapes cover between them.
const KINDS = ['', 'm', '7', 'm7', 'maj7', 'mmaj7', '6', 'm6', '9', 'm9', 'maj9', 'add9', 'dim', 'dim7', 'm7b5', 'aug', 'sus2', 'sus4', '7sus4'];
const CAGED_KINDS = new Set(['', 'm', '7']);

test('every grip offered is one a hand can hold, and sounds only its chord', () => {
  let count = 0;
  for (const root of ROOTS) for (const kind of KINDS) {
    const target = chord(root + kind);
    const grips = gripsFor(target, neck);
    assert.ok(grips.length >= (CAGED_KINDS.has(kind) ? 5 : 1), `${target.symbol} has grips`);
    assert.ok(grips.some(g => g.source === 'book'), `${target.symbol} has the chord book's grips`);
    for (const grip of grips) {
      count++;
      const name = `${target.symbol} ${grip.source} ${chart(grip)}`;
      assert.ok(grip.notes.every(n => target.tones.some(t => t.pitch === mod(n.midi))), `${name} sounds only chord tones`);
      const bass = grip.notes.reduce((low, n) => n.midi < low.midi ? n : low);
      assert.equal(grip.inversion, mod(bass.midi) !== target.root, `${name} is marked an inversion exactly when its bass is not the root`);
      if (grip.source === 'caged') {
        assert.equal(grip.inversion, false, `${name}: a CAGED shape has its root in the bass`);
        for (const role of ['root', 'third', ...(kind === '7' ? ['seventh'] : [])]) assert.ok(grip.notes.some(n => n.tone.role === role), `${name} has its ${role}`);
      }
      assert.ok(grip.notes.length >= 3, `${name} sounds at least three strings`);
      assert.ok(grip.notes.every(n => n.fret >= 0 && n.fret <= neck.frets), `${name} is on the neck`);

      const fretted = grip.notes.filter(n => n.fret > 0);
      assert.ok(grip.notes.every(n => (n.fret === 0) === (n.finger === 0)), `${name}: a finger on every fretted string and none on an open one`);
      const fingers = new Map<number, number[]>();
      for (const n of fretted) fingers.set(n.finger, [...(fingers.get(n.finger) ?? []), n.fret]);
      assert.ok(fingers.size <= 4 && [...fingers.keys()].every(f => f >= 1 && f <= 4), `${name} uses at most four fingers`);
      for (const [finger, frets] of fingers) assert.equal(new Set(frets).size, 1, `${name}: finger ${finger} holds one fret`);
      if (fretted.length) assert.ok(Math.max(...fretted.map(n => n.fret)) - Math.min(...fretted.map(n => n.fret)) <= 4, `${name} reaches five frets at most`);
      if (grip.barre) {
        const under = grip.notes.filter(n => n.string <= grip.barre!.from && n.string >= grip.barre!.to);
        assert.ok(under.every(n => n.fret >= grip.barre!.fret), `${name}: nothing under the barre is open or behind it`);
      }
    }
  }
  assert.ok(count > 1000);
});

test('the CAGED shapes run their fingers up the neck in order', () => {
  for (const root of ROOTS) for (const kind of CAGED_KINDS) for (const grip of gripsFor(chord(root + kind), neck).filter(g => g.source === 'caged')) {
    const fingers = new Map(grip.notes.filter(n => n.fret > 0).map(n => [n.finger, n.fret]));
    const order = [...fingers].sort(([a], [b]) => a - b).map(([, fret]) => fret);
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `${root}${kind} ${chart(grip)}`);
  }
});

test("the chord book's grips are taken as published, and almost all of them pass the hand checks", () => {
  const { offered, kept, dropped } = bookCoverage();
  assert.ok(offered > 900, `${offered} grips in the chord book for the chord types covered`);
  assert.ok(kept / offered >= .97, `kept ${kept} of ${offered}; dropped ${dropped.join(', ')}`);
});

test("the common grip is the chord book's first choice: the chords every guitarist strums", () => {
  const expected: Record<string, string> = {
    Dm: 'xx0231', A7: 'x02020', C7: 'x32310', F: '133211', Bb7: 'x13131',
    Am: 'x02210', C: 'x32010', D: 'xx0232', E: '022100', G: '320003', Em: '022000', E7: '020100', G7: '320001', D7: 'xx0212',
    Am7: 'x02010', Fmaj7: 'xx3210', Dsus4: 'xx0233',
  };
  for (const [symbol, want] of Object.entries(expected)) assert.equal(chart(commonGrip(chord(symbol), neck)!), want, symbol);
  assert.equal(commonGrip(chord('Dm'), neck)!.shape, 'D', 'open Dm is the D shape at the nut');
  assert.equal(commonGrip(chord('F'), neck)!.shape, 'E', 'the F barre is the E shape');
});

test('at the nut the shapes are the open chords every guitarist learns', () => {
  const open = (symbol: string) => gripsFor(chord(symbol), neck).filter(g => g.notes.every(n => n.fret <= 3) && g.notes.some(n => n.fret === 0)).map(chart);
  const expected: Record<string, string> = {
    C: 'x32010', A: 'x02220', G: '320003', E: '022100', D: 'xx0232',
    Am: 'x02210', Em: '022000', Dm: 'xx0231', Gm: '310033',
    C7: 'x32310', A7: 'x02020', G7: '320001', E7: '020100', D7: 'xx0212',
  };
  for (const [symbol, shape] of Object.entries(expected)) assert.ok(open(symbol).includes(shape), `${symbol} is ${shape}, got ${open(symbol).join(', ')}`);
  // Open C, A, G, E and D are the shapes their names give the system.
  assert.equal(gripsFor(chord('G'), neck).find(g => chart(g) === '320003')?.shape, 'G');
  // Ratings belong to the grip, not the shape: open G and C are first-week chords, their barred versions are not.
  for (const [symbol, open, moved] of [['G', '320003', '15-14-12-12-12-x'], ['C', 'x32010', 'x-15-14-12-13-12']]) {
    const grips = gripsFor(chord(symbol), neck);
    assert.equal(grips.find(g => chart(g) === open)?.rating, 'common', `open ${symbol}`);
    assert.equal(grips.find(g => chart(g) === moved)?.rating, 'hard', `${symbol} shape up the neck`);
  }
  assert.equal(gripsFor(chord('Gm'), neck).find(g => chart(g) === '310033')?.rating, 'hard', 'open G minor is a stretch');
  assert.equal(gripsFor(chord('Am'), neck).find(g => chart(g) === 'x02210')?.shape, 'A');
});

test('moved up the neck the shapes become the barre and movable chords', () => {
  const charts = gripsFor(chord('Dm'), neck).map(chart);
  assert.ok(charts.includes('x57765'), 'the A-shape Dm barre at the 5th fret');
  assert.ok(charts.includes('10-12-12-10-10-10'), 'the E-shape Dm barre at the 10th');
  const a = gripsFor(chord('Dm'), neck).find(g => chart(g) === 'x57765')!;
  assert.deepEqual(a.barre, { fret: 5, from: 5, to: 1 });
  assert.equal(a.shape, 'A');
  assert.equal(a.rating, 'common');
  assert.ok(gripsFor(chord('F'), neck).map(chart).includes('133211'), 'the F barre chord');
  assert.ok(gripsFor(chord('Bb7'), neck).map(chart).includes('x13131'), 'the A-shape B♭7');
});

test('in each form of D minor the grip chosen is the CAGED shape that lives inside it', () => {
  const studies = studyChoices({ ...defaultState(), frets: 15, root: 2, scaleId: 'minor', studyMode: 'position' });
  const expected: Record<number, { shape: string; chart: string }> = {
    1: { shape: 'E', chart: '10-12-12-10-10-10' }, 2: { shape: 'D', chart: 'x-x-12-14-15-13' }, 3: { shape: 'C', chart: 'x5323x' },
    4: { shape: 'A', chart: 'x57765' }, 5: { shape: 'G', chart: '10-8-7-7-x-x' },
  };
  for (const [form, want] of Object.entries(expected)) {
    const study = studies.find(s => s.form === Number(form) && s.anchor >= 3 && s.anchor <= 14)!;
    const grip = gripInForm(chord('Dm'), study, { frets: 15, lowest: 0, fourths: false });
    assert.ok(grip, `form ${form} has a grip`);
    assert.deepEqual({ shape: grip.shape, chart: chart(grip) }, want, `form ${form}`);
  }
});

test('chords with no grips, and tunings the grips do not fit, get none; a dropped tuning moves the CAGED shapes', () => {
  assert.deepEqual(gripsFor(chord('C5'), neck), [], 'no power chords in either source yet');
  assert.deepEqual(gripsFor(chord('Dm'), { ...neck, fourths: true }), []);
  // Tuned down a whole step, every string sounds two semitones lower, so Dm sits two frets higher. The chord book is for standard tuning.
  const dropped = gripsFor(chord('Dm'), { ...neck, lowest: 2 });
  assert.ok(dropped.map(chart).includes('x79987'));
  assert.ok(dropped.every(g => g.source === 'caged'));
  // A slash chord uses the chord book's grips with that bass, and is an inversion; with no such grip it is held as its chord.
  const slash = commonGrip(chord('D/F#'), neck)!;
  assert.equal(chart(slash), '200232');
  assert.equal(slash.inversion, true);
  assert.equal(chart(commonGrip(chord('Dm/C#'), neck)!), chart(commonGrip(chord('Dm'), neck)!));
});

test('a grip is strummed low string to high, each a moment after the last', () => {
  const grip = gripsFor(chord('Dm'), neck).find(g => g.shape === 'A' && g.notes.some(n => n.fret === 5))!;
  const strokes = strum(grip, 1);
  assert.deepEqual(strokes.map(s => s.midi), [50, 57, 62, 65, 69]);
  assert.equal(strokes[0].at, 1);
  assert.ok(strokes.every((s, k) => !k || s.at > strokes[k - 1].at));
});
