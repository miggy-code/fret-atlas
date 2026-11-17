import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAbc } from '../src/core/abc';
import { inStudy } from '../src/core/study';
import { chordInForm, pathForSong, songPath } from '../src/core/song';
import type { SongPath } from '../src/core/song';
import { SONGS } from '../src/core/songs';
import { parseChord } from '../src/core/harmony';
import { mod, parseNoteId, scaleById, tuningFor } from '../src/core/music';

const neck = { frets: 12, lowest: 0, fourths: false };
const abc = (body: string, key = 'Am', meter = '4/4') => parseAbc(`X:1\nT:Test\nM:${meter}\nL:1/4\nK:${key}\n${body}`);
const forms = (path: SongPath) => path.segments.map(s => s.study.label);

// Every note sounds the written pitch on the string and fret chosen for it, and sits in (or one or two frets past) its form.
function assertPlayable(path: SongPath, octave = -12, written?: number[]) {
  const tuning = tuningFor(0, false);
  path.notes.forEach((note, k) => {
    assert.equal(tuning.midi[note.string - 1] + note.fret, note.midi, `note ${k} sounds its pitch`);
    if (written) assert.equal(note.midi, written[k] + octave);
    const segment = path.segments[note.segment];
    assert.ok(k >= segment.from && k <= segment.to, `note ${k} belongs to its segment`);
    assert.equal(inStudy(note.string, note.fret, segment.study), !note.stretch, `note ${k} is a stretch exactly when it lies outside its form`);
  });
  path.segments.forEach((segment, k) => {
    assert.equal(segment.from, k ? path.segments[k - 1].to + 1 : 0, 'segments cover the melody in order');
    assert.notEqual(segment.study, path.segments[k - 1]?.study, 'a segment changes form');
    assert.equal(!!segment.change, k > 0, 'every segment after the first says how the hand got there');
  });
}

const pentatonic = { octave: 0, scaleId: 'minor-pentatonic' };

test('a phrase that fits one form is played inside one form, in one segment', () => {
  const path = songPath(abc('A, C D E G A c'), neck, pentatonic);
  assertPlayable(path, 0);
  assert.equal(path.segments.length, 1);
  assert.ok(path.notes.every(n => !n.stretch));
});

test('playing in a chosen form keeps a melody there when that form reaches every note', () => {
  // On a full neck every form has a placement holding this phrase; on 12 frets form 4 is cut off by the neck's end.
  const melody = abc('A, C D E G A c');
  for (const form of [1, 2, 3, 4, 5]) {
    const path = songPath(melody, { ...neck, frets: 22 }, { ...pentatonic, homeForm: form });
    assertPlayable(path, 0);
    assert.deepEqual(path.segments.map(s => s.study.form), [form]);
  }
  // Form 1 of A minor sits at the 5th fret, so its A3 is the D string's 7th fret.
  assert.equal(songPath(melody, neck, { ...pentatonic, homeForm: 1 }).notes[0].id, '4:7');
});

test('a melody that outruns the chosen form leaves it only for the notes it must, then comes back', () => {
  // Scarborough Fair an octave up climbs past form 3 twice; each time it visits a neighbour and returns.
  const song = SONGS.find(s => s.id === 'scarborough-fair')!;
  const path = pathForSong(song, neck, { octave: 0, homeForm: 3 });
  assertPlayable(path, 0);
  const forms = path.segments.map(s => s.study.form);
  assert.equal(forms[0], 3);
  assert.equal(forms[forms.length - 1], 3);
  assert.ok(forms.length > 1, 'it has to leave form 3');
  const home = path.notes.filter(n => path.segments[n.segment].study.form === 3).length;
  assert.ok(home > path.notes.length / 2, `most notes stay home (${home} of ${path.notes.length})`);
});

test('a melody wider than a form changes form, and as rarely as it can', () => {
  // Three octaves of A minor pentatonic, low A to high A: no single form spans it.
  const run = abc('A,, C, D, E, G, A, C D E G A c d e g a', 'Am');
  const path = songPath(run, { ...neck, frets: 22 }, pentatonic);
  assertPlayable(path, 0);
  assert.ok(path.segments.length >= 2, 'it changes form');
  assert.ok(path.segments.length <= 3, `one climb needs at most two changes, got ${forms(path).join(' → ')}`);
  assert.ok(path.segments.every((s, k) => !k || s.study.anchor > path.segments[k - 1].study.anchor), 'a rising run moves up the neck');
});

test('a melody moving back and forth inside the overlap of two forms never changes form', () => {
  const path = songPath(abc('C D C D C D C D'), neck, pentatonic);
  assert.equal(path.segments.length, 1);
});

test('changes are named from the notes either side: pivot on a shared note, slide along one string, otherwise shift', () => {
  for (const song of SONGS) {
    const path = pathForSong(song, neck);
    path.segments.slice(1).forEach(segment => {
      const before = path.notes[segment.from - 1], after = path.notes[segment.from];
      const previous = path.segments[before.segment].study;
      const shared = inStudy(before.string, before.fret, segment.study) || inStudy(after.string, after.fret, previous);
      assert.equal(segment.change, shared ? 'pivot' : before.string === after.string ? 'slide' : 'shift');
    });
  }
});

test('the path is the same every time for the same melody and neck', () => {
  for (const song of SONGS) assert.deepEqual(pathForSong(song, neck), pathForSong(song, neck));
});

test('a melody written below the guitar is played an octave up; one above the neck is refused', () => {
  const low = songPath(abc('E, F, G,'), neck);
  assert.equal(low.notes[0].midi, 40, 'written E, (52) sounds an octave down, at the open low E');
  const lower = songPath(abc('C, D, E,'), neck);
  assert.equal(lower.notes[0].midi, 48, 'written C, would sound below the low E, so it is raised an octave');
  assert.throws(() => songPath(abc("c' d' e'"), neck, { octave: 0 }), RangeError);
});

test('the song plays in the key and mode its ABC names, with timing kept in quarter-note beats', () => {
  const path = songPath(abc('D E F G', 'Ddor', '3/4'), neck);
  assert.equal(path.root, 2);
  assert.equal(path.scaleId, 'dorian');
  assert.deepEqual(path.notes.map(n => [n.start, n.beats]), [[0, 1], [1, 1], [2, 1], [3, 1]]);
});

for (const song of SONGS) {
  test(`${song.title} parses, keeps its source, and fits a 12-fret neck in standard tuning`, () => {
    assert.match(song.source, /^https:\/\//);
    assert.ok(song.provenance.includes('Traditional'));
    const tune = parseAbc(song.abc);
    assert.ok(tune.notes.length >= 20, `${tune.notes.length} notes`);
    const path = pathForSong(song, neck);
    assertPlayable(path, path.notes[0].midi - tune.notes[0].midi, tune.notes.map(n => n.midi));
    assert.ok(path.notes.filter(n => n.stretch).length <= path.notes.length / 4, 'most notes sit inside their form');
  });
}

const song = (id: string) => { const found = SONGS.find(s => s.id === id); assert.ok(found, id); return found; };

test('the path carries the chords of its source, merged where one repeats, and every note knows its chord', () => {
  const path = songPath(abc('E | "Am"A, C D E | "Am"G A "G"B d | "G"d4'), neck, { octave: 0 });
  assert.deepEqual(path.chords.map(c => [c.chord.symbol, c.start, c.beats]), [['Am', 1, 6], ['G', 7, 6]]);
  assert.deepEqual(path.notes.map(n => n.chord), [null, 0, 0, 0, 0, 0, 0, 1, 1, 1], 'a pickup before the first chord has none');
  assert.deepEqual(path.bars, [0, 1, 5, 9]);
  assert.deepEqual(songPath(abc('A, C D E'), neck).chords, []);
});

test('House of the Rising Sun keeps its changes in order', () => {
  const path = pathForSong(song('house-of-the-rising-sun'), neck);
  assert.deepEqual(path.chords.map(c => c.chord.symbol), ['Dm', 'A7', 'Dm', 'C7', 'F', 'A7', 'Dm', 'B♭7', 'Dm', 'A7', 'Dm']);
  assert.equal(path.notes[0].chord, null);
  assert.equal(path.chords.at(-1)!.start + path.chords.at(-1)!.beats, path.length, 'the last chord lasts to the end');
});

test("a chord's tones under the hand lie inside the form, or one fret past it for a tone the scale lacks", () => {
  const path = pathForSong(song('house-of-the-rising-sun'), neck);
  const study = path.segments[0].study;
  const tuning = tuningFor(0, false);
  const scale = scaleById(path.scaleId);
  const inScale = (pitch: number) => scale.tones.some(t => mod(path.root + t.semitones) === pitch);
  for (const symbol of ['Dm', 'A7']) {
    const chord = parseChord(symbol)!;
    const placed = chordInForm(chord, study, neck, path);
    assert.ok(placed.length >= chord.tones.length, `${symbol} is reachable in the form`);
    for (const { id, tone } of placed) {
      const [string, fret] = parseNoteId(id);
      assert.equal(mod(tuning.midi[string - 1] + fret), tone.pitch, `${id} sounds the chord's ${tone.label}`);
      const row = study.rows.find(r => r.string === string)!;
      const past = Math.max(0, row.left - fret, fret - row.right);
      assert.ok(inScale(tone.pitch) ? past === 0 : past <= 1, `${id} is under the hand`);
    }
    // Every chord tone that lies inside the form is listed.
    for (const row of study.rows) for (let fret = Math.max(0, row.left); fret <= Math.min(neck.frets, row.right); fret++) {
      const pitch = mod(tuning.midi[row.string - 1] + fret);
      if (chord.tones.some(t => t.pitch === pitch)) assert.ok(placed.some(p => p.id === `${row.string}:${fret}`), `${row.string}:${fret} is listed`);
    }
  }
  const seventh = chordInForm(parseChord('A7')!, study, neck, path);
  assert.ok(seventh.some(p => p.tone.pitch === 1), "A7's C♯ is shown though D natural minor has no C♯");
});

test('a song names its real key when the ABC header does not', () => {
  // This Amazing Grace is written with no key signature, but it is in G: G major pentatonic, ending on G.
  const path = pathForSong(song('amazing-grace'), neck);
  assert.equal(path.root, 7);
  assert.equal(path.scaleId, 'major');
  assert.equal(mod(path.notes.at(-1)!.midi), 7);
});
