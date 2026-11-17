import test from 'node:test';
import assert from 'node:assert/strict';
import { pathForSong } from '../src/core/song';
import { phrasesOf, songInsight } from '../src/core/song-insight';
import { SONGS } from '../src/core/songs';

const neck = { frets: 12, lowest: 0, fourths: false };
const path = (id: string) => pathForSong(SONGS.find(s => s.id === id)!, neck);
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);

test('House of the Rising Sun splits into its four sung lines', () => {
  const phrases = phrasesOf(path('house-of-the-rising-sun'));
  assert.deepEqual(phrases.map(p => [p.from, p.to]), [[0, 10], [11, 17], [18, 28], [29, 36]]);
});

test('Scarborough Fair has four phrases, sung twice', () => {
  const phrases = phrasesOf(path('scarborough-fair'));
  assert.equal(phrases.length, 8);
  assert.deepEqual(phrases.slice(4).map(p => p.to - p.from), phrases.slice(0, 4).map(p => p.to - p.from));
});

for (const song of SONGS) {
  test(`${song.title}: phrases cover the melody in order, each long enough to be worth practising`, () => {
    const p = pathForSong(song, neck);
    const phrases = phrasesOf(p);
    assert.ok(phrases.length >= 2);
    phrases.forEach((phrase, k) => {
      assert.equal(phrase.index, k);
      assert.equal(phrase.from, k ? phrases[k - 1].to + 1 : 0);
      assert.ok(phrase.to - phrase.from + 1 >= 3, `phrase ${k + 1} has ${phrase.to - phrase.from + 1} notes`);
      assert.equal(phrase.start, p.notes[phrase.from].start);
      close(phrase.start + phrase.beats, k < phrases.length - 1 ? phrases[k + 1].start : p.length);
    });
    assert.equal(phrases.at(-1)!.to, p.notes.length - 1);
  });
}

test('a melody is weighed by the time it spends on each degree of its scale', () => {
  const insight = songInsight(path('house-of-the-rising-sun'));
  const by = (label: string) => insight.degrees.find(d => d.label === label);
  assert.deepEqual(insight.degrees.map(d => d.label), ['1', '2', '♭3', '4', '♭5', '5', '♭6', '♭7']);
  assert.equal(by('1')!.kind, 'root');
  assert.equal(by('♭3')!.kind, 'skeleton');
  assert.equal(by('2')!.kind, 'added');
  assert.equal(by('♭5')!.kind, 'outside', 'the passing G♯ is not in D natural minor');
  assert.equal(by('♭6')!.count, 0, 'a scale tone the melody never touches is still listed');
  close(insight.degrees.reduce((sum, d) => sum + d.share, 0), 1);
  assert.equal(insight.degrees.reduce((sum, d) => sum + d.count, 0), 37);
  assert.ok(by('5')!.share > by('2')!.share, 'the fifth carries more of this tune than the second');
});

test('the pentatonic share says how much of a melody its forms already hold', () => {
  const rising = songInsight(path('house-of-the-rising-sun')).pentatonic!;
  assert.equal(rising.family, 'minor');
  assert.ok(rising.share > .8 && rising.share < 1, `${rising.share}`);
  const stranger = songInsight(path('wayfaring-stranger')).pentatonic!;
  assert.equal(stranger.family, 'minor');
  close(stranger.share, 1);
  const grace = songInsight(path('amazing-grace')).pentatonic!;
  assert.equal(grace.family, 'major');
  close(grace.share, 1);
});

test('chords are named by function, spelled in degrees of the key, and weighed by time', () => {
  const insight = songInsight(path('house-of-the-rising-sun'));
  assert.deepEqual(insight.chords.map(c => [c.chord.symbol, c.roman]), [['Dm', 'i'], ['A7', 'V7'], ['C7', '♭VII7'], ['F', '♭III'], ['B♭7', '♭VI7']]);
  const [dm, a7] = insight.chords;
  assert.deepEqual(dm.degrees.map(d => d.label), ['1', '♭3', '5']);
  assert.ok(dm.degrees.every(d => d.inScale));
  assert.deepEqual(a7.degrees.map(d => [d.label, d.inScale]), [['5', true], ['7', false], ['2', true], ['4', true]]);
  assert.ok(dm.share > a7.share);
  close(insight.chords.reduce((sum, c) => sum + c.share, 0), 1);
  assert.equal(dm.first, 1, 'the first note under Dm follows the pickup');
});

test('most of a traditional melody lands on the chord under it; a song without chords makes no such claim', () => {
  const rising = songInsight(path('house-of-the-rising-sun'));
  assert.ok(rising.chordTones!.share > .6 && rising.chordTones!.share <= 1, `${rising.chordTones!.share}`);
  assert.equal(rising.chordTones!.of, 36, 'the pickup has no chord');
  const stranger = songInsight(path('wayfaring-stranger'));
  assert.equal(stranger.chordTones, undefined);
  assert.deepEqual(stranger.chords, []);
});
