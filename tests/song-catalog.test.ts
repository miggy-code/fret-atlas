// The rule every song in the catalog keeps, checked here so a song added later keeps it too:
// what is heard is what is drawn. The chord strummed under the melody is a real grip, drawn on the board in the form the
// melody is in (or a fret past it, as a hand stretches), and the board shows the chord that is sounding at every strum.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAbc } from '../src/core/abc';
import { parseChord } from '../src/core/harmony';
import { gripUnder, pathForSong, soundingChord } from '../src/core/song';
import { SONGS } from '../src/core/songs';
import { inStudy } from '../src/core/study';

const neck = { frets: 12, lowest: 0, fourths: false };

for (const song of SONGS) test(`${song.title}: every chord heard is a real grip, drawn in the form the melody is in`, () => {
  for (const { symbol } of parseAbc(song.abc).chords) assert.ok(parseChord(symbol), `${song.title}: the chord "${symbol}" is one the app can read`);
  const path = pathForSong(song, neck);
  // Strums fall where the chord changes and on each bar line, under whichever note is then sounding.
  const strikes = [...new Set([...path.chords.map(c => c.start), ...path.bars])].filter(beat => path.chords.some(c => c.start <= beat));
  for (const beat of strikes) {
    const under = path.notes.reduce((last, n, k) => n.start <= beat ? k : last, 0);
    const chord = soundingChord(path, under, beat);
    assert.notEqual(chord, null, `beat ${beat}: a chord is sounding`);
    assert.equal(path.chords[chord!].start <= beat && (path.chords[chord! + 1]?.start ?? Infinity) > beat, true, `beat ${beat}: the board shows the chord struck, even mid-note`);
    const grip = gripUnder(path, chord!, under, neck);
    const name = `${song.title}, beat ${beat}, ${path.chords[chord!].chord.symbol}`;
    assert.ok(grip, `${name}: has a grip (a chord without one would be silent)`);
    const study = path.segments[path.notes[under].segment].study;
    for (const n of grip.notes) {
      const row = study.rows.find(r => r.string === n.string)!;
      const out = inStudy(n.string, n.fret, study) ? 0 : Math.max(row.left - n.fret, n.fret - row.right);
      assert.ok(out <= 1, `${name}: string ${n.string} fret ${n.fret} is ${out} frets out of form ${study.form}`);
    }
  }
});
