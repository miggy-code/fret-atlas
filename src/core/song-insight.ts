// What a fingered melody is made of: its phrases, the scale degrees it leans on, how much of it the pentatonic forms
// already hold, and how its notes sit on the chords under them. Everything here is read off a `SongPath`.
import { chordInKey, romanNumeral } from './harmony';
import type { Chord } from './harmony';
import { degreeLabel, genericDegree, mod, scaleById } from './music';
import type { Family } from './music';
import type { SongPath } from './song';

/** A stretch of the melody worth practising on its own. `beats` runs to the next phrase, so phrases tile the song. */
export type Phrase = { index: number; from: number; to: number; start: number; beats: number };

const MIN_NOTES = 3;      // A phrase shorter than this is not worth looping or recalling.
const LONG_PHRASE = 6;    // Bars. A longer stretch is cut into regular lines.
const FULL_LINE = 7;      // Notes. Two bars holding this many make a line; a sparser melody takes four bars.

/**
 * Splits a melody into phrases. A phrase ends on a note held for a bar or more, once it is two bars long. A stretch
 * still longer than six bars is cut into even lines counted from its first note, so each line keeps its pickup.
 */
export function phrasesOf(path: Pick<SongPath, 'notes' | 'meter' | 'length'>): Phrase[] {
  const { notes } = path;
  if (!notes.length) return [];
  const bar = path.meter[0] * 4 / path.meter[1];
  const end = (k: number) => notes[k].start + notes[k].beats;
  const EPS = 1e-9;
  // Each range is [first note, last note].
  const ranges: [number, number][] = [];
  let from = 0;
  for (let k = 0; k < notes.length - 1; k++) {
    if (notes[k].beats < bar - EPS || k - from + 1 < MIN_NOTES || end(k) - notes[from].start < 2 * bar - EPS) continue;
    ranges.push([from, k]);
    from = k + 1;
  }
  ranges.push([from, notes.length - 1]);

  const lines = ranges.flatMap(([first, last]): [number, number][] => {
    const span = end(last) - notes[first].start;
    if (span <= LONG_PHRASE * bar + EPS) return [[first, last]];
    const perBar = (last - first + 1) / (span / bar);
    const line = (perBar * 2 >= FULL_LINE ? 2 : 4) * bar;
    const cut: [number, number][] = [];
    let start = first;
    for (let k = first + 1; k <= last; k++) {
      const boundary = notes[first].start + line * Math.round((notes[k].start - notes[first].start) / line);
      const crosses = notes[k].start >= boundary - EPS && notes[k - 1].start < boundary - EPS;
      if (crosses && k - start >= MIN_NOTES && last - k + 1 >= MIN_NOTES) { cut.push([start, k - 1]); start = k; }
    }
    cut.push([start, last]);
    return cut;
  });
  // A leftover too short to stand alone joins the phrase before it.
  for (let k = lines.length - 1; k > 0; k--) if (lines[k][1] - lines[k][0] + 1 < MIN_NOTES) lines.splice(k - 1, 2, [lines[k - 1][0], lines[k][1]]);
  if (lines.length > 1 && lines[0][1] - lines[0][0] + 1 < MIN_NOTES) lines.splice(0, 2, [lines[0][0], lines[1][1]]);

  return lines.map(([first, last], index) => ({
    index, from: first, to: last, start: notes[first].start,
    beats: (index < lines.length - 1 ? notes[lines[index + 1][0]].start : path.length) - notes[first].start,
  }));
}

export type DegreeKind = 'root' | 'skeleton' | 'added' | 'outside';
/** How much of the melody sits on one degree of the key. `share` is by time, not by count. */
export type DegreeUse = { semitones: number; label: string; degree: number | undefined; kind: DegreeKind; count: number; beats: number; share: number };
/** One chord of the song: its function, its tones as degrees of the key, and the share of the song's chord time it holds. */
export type ChordUse = { chord: Chord; roman: string; first: number; beats: number; share: number; degrees: ReturnType<typeof chordInKey> };
export type Insight = {
  /** Every tone of the scale, used or not, and any tone from outside it that the melody touches, low to high. */
  degrees: DegreeUse[];
  /** The share of the melody's time on the pentatonic the scale is built on; absent for a scale built on neither. */
  pentatonic?: { family: Family; share: number; count: number };
  /** The share of the melody's time that lands on a tone of the chord under it; absent when the song has no chords. */
  chordTones?: { share: number; count: number; of: number };
  chords: ChordUse[];
  range: { low: number; high: number };
};

export function songInsight(path: SongPath): Insight {
  const scale = scaleById(path.scaleId);
  const total = path.notes.reduce((sum, n) => sum + n.beats, 0) || 1;
  const used = new Map<number, { count: number; beats: number }>();
  for (const note of path.notes) {
    const semitones = mod(note.midi - path.root);
    const use = used.get(semitones) ?? { count: 0, beats: 0 };
    used.set(semitones, { count: use.count + 1, beats: use.beats + note.beats });
  }
  const degrees = [...new Set([...scale.tones.map(t => t.semitones), ...used.keys()])].sort((a, b) => a - b).map((semitones): DegreeUse => {
    const tone = scale.tones.find(t => t.semitones === semitones);
    const { count, beats } = used.get(semitones) ?? { count: 0, beats: 0 };
    return {
      semitones, label: tone ? degreeLabel(tone) : genericDegree(semitones), degree: tone?.degree,
      kind: !tone ? 'outside' : semitones === 0 ? 'root' : tone.skeleton ? 'skeleton' : 'added', count, beats, share: beats / total,
    };
  });
  const core = degrees.filter(d => d.kind === 'root' || d.kind === 'skeleton');
  const pentatonic = scale.family && { family: scale.family, share: core.reduce((sum, d) => sum + d.share, 0), count: core.reduce((sum, d) => sum + d.count, 0) };

  const harmonised = path.notes.filter(n => n.chord !== null);
  const onChord = harmonised.filter(n => path.chords[n.chord!].chord.tones.some(t => t.pitch === mod(n.midi)));
  const beatsOf = (notes: typeof harmonised) => notes.reduce((sum, n) => sum + n.beats, 0);
  const chordTones = harmonised.length ? { share: beatsOf(onChord) / beatsOf(harmonised), count: onChord.length, of: harmonised.length } : undefined;

  const chordTime = path.chords.reduce((sum, c) => sum + c.beats, 0) || 1;
  const chords: ChordUse[] = [];
  for (const span of path.chords) {
    let use = chords.find(c => c.chord.symbol === span.chord.symbol);
    if (!use) {
      use = { chord: span.chord, roman: romanNumeral(span.chord, path.root), first: path.notes.find(n => n.chord === span.index)?.index ?? -1, beats: 0, share: 0, degrees: chordInKey(span.chord, path.root, scale) };
      chords.push(use);
    }
    use.beats += span.beats;
    use.share = use.beats / chordTime;
  }
  const pitches = path.notes.map(n => n.midi);
  return { degrees, pentatonic, chordTones, chords, range: { low: Math.min(...pitches), high: Math.max(...pitches) } };
}
