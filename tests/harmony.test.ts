import test from 'node:test';
import assert from 'node:assert/strict';
import { chordDegree, outsideScale, parseChord, romanNumeral } from '../src/core/harmony';
import { scaleById } from '../src/core/music';

const chord = (symbol: string) => { const c = parseChord(symbol); assert.ok(c, `${symbol} parses`); return c; };
const spelled = (symbol: string) => chord(symbol).tones.map(t => `${t.label}:${t.semitones}`).join(' ');

test('a chord symbol names a root and a set of tones, each labelled from the chord root', () => {
  assert.equal(chord('Dm').root, 2);
  assert.equal(chord('Dm').quality, 'minor');
  assert.equal(spelled('Dm'), 'R:0 ♭3:3 5:7');
  assert.equal(spelled('F'), 'R:0 3:4 5:7');
  assert.equal(spelled('A7'), 'R:0 3:4 5:7 ♭7:10');
  assert.equal(spelled('Em7'), 'R:0 ♭3:3 5:7 ♭7:10');
  assert.equal(spelled('Cmaj7'), 'R:0 3:4 5:7 7:11');
  assert.equal(spelled('Bdim'), 'R:0 ♭3:3 ♭5:6');
  assert.equal(spelled('Bm7b5'), 'R:0 ♭3:3 ♭5:6 ♭7:10');
  assert.equal(spelled('Caug'), 'R:0 3:4 ♯5:8');
  assert.equal(spelled('Gsus4'), 'R:0 4:5 5:7');
  assert.equal(spelled('G6'), 'R:0 3:4 5:7 6:9');
  assert.equal(spelled('E5'), 'R:0 5:7');
  assert.deepEqual(chord('A7').tones.map(t => t.pitch), [9, 1, 4, 7]);
  assert.deepEqual(chord('A7').tones.map(t => t.role), ['root', 'third', 'fifth', 'seventh']);
});

test('roots take sharps and flats, spellings vary, and a slash names the bass', () => {
  assert.equal(chord('Bb7').root, 10);
  assert.equal(chord('Bb7').symbol, 'B♭7');
  assert.equal(chord('F#m').root, 6);
  assert.equal(chord('F#m').symbol, 'F♯m');
  assert.equal(spelled('Amin'), spelled('Am'));
  assert.equal(spelled('CM7'), spelled('Cmaj7'));
  assert.equal(spelled('C+'), spelled('Caug'));
  assert.equal(spelled('Gsus'), spelled('Gsus4'));
  assert.equal(chord('D/F#').bass, 6);
  assert.equal(spelled('D/F#'), 'R:0 3:4 5:7');
});

test('an extension this vocabulary lacks keeps its triad; text that is no chord is refused', () => {
  assert.equal(spelled('G13#11'), 'R:0 3:4 5:7');
  assert.equal(spelled('Am11'), 'R:0 ♭3:3 5:7');
  assert.equal(parseChord('N.C.'), undefined);
  assert.equal(parseChord('Hm'), undefined);
  assert.equal(parseChord(''), undefined);
});

test('a pitch is a chord tone or a tone passing over the chord, named from the chord root either way', () => {
  const dm = chord('Dm');
  assert.deepEqual(chordDegree(dm, 5), { label: '♭3', role: 'third' });
  assert.deepEqual(chordDegree(dm, 14), { label: 'R', role: 'root' });
  assert.deepEqual(chordDegree(dm, 7), { label: '4', role: undefined });
  assert.deepEqual(chordDegree(chord('A7'), 7), { label: '♭7', role: 'seventh' });
});

test('a chord takes its Roman numeral from its place in the key', () => {
  const inD = (symbol: string) => romanNumeral(chord(symbol), 2);
  assert.deepEqual(['Dm', 'A7', 'C7', 'F', 'Bb7'].map(inD), ['i', 'V7', '♭VII7', '♭III', '♭VI7']);
  const inG = (symbol: string) => romanNumeral(chord(symbol), 7);
  assert.deepEqual(['G', 'G7', 'C', 'D7', 'Em', 'F#dim', 'Cmaj7', 'Am7', 'F#m7b5', 'Dsus4'].map(inG), ['I', 'I7', 'IV', 'V7', 'vi', 'vii°', 'IVmaj7', 'ii7', 'viiø7', 'Vsus4']);
});

test('the chord tones a scale lacks are named as degrees of the key', () => {
  const minor = scaleById('minor');
  assert.deepEqual(outsideScale(chord('Dm'), 2, minor), []);
  // A7's C♯ is the major seventh of D: the leading tone natural minor does not have.
  assert.deepEqual(outsideScale(chord('A7'), 2, minor), [{ pitch: 1, label: '7' }]);
  assert.deepEqual(outsideScale(chord('Bb7'), 2, minor), [{ pitch: 8, label: '♭5' }]);
});
