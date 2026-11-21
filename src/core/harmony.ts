// Chords as a song's page writes them, and how a chord relates to a key and to the notes played over it.
// A chord here is a root and a set of tones; where those tones fall on the neck is the song's business (`song.ts`).
import { degreeLabel, genericDegree, genericTone, mod, toneAt, TRIAD_INTERVALS } from './music';
import type { Scale, TriadQuality } from './music';

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'suspended' | 'power';
export type ChordRole = 'root' | 'third' | 'fifth' | 'seventh' | 'color';
/** One tone of a chord. `label` names it from the chord's own root (R, ♭3, 5, ♭7), never from the key. */
export type ChordTone = { semitones: number; pitch: number; label: string; role: ChordRole };
/** `figure` is what follows the chord's Roman numeral: `7` in V7, `°` in vii°. `kind` is the suffix in one spelling (`m7b5` for ø7). */
export type Chord = { symbol: string; root: number; kind: string; quality: ChordQuality; figure: string; tones: ChordTone[]; bass?: number };

type Part = readonly [semitones: number, label: string, role: ChordRole];
type Kind = { quality: ChordQuality; parts: readonly Part[]; figure: string };
const TRIAD_ROLES: readonly ChordRole[] = ['root', 'third', 'fifth'];
// The two triads come from the one definition in music.ts; every other chord here is one of them altered or extended.
const triad = (quality: TriadQuality): Part[] => TRIAD_INTERVALS[quality].map((semitones, i) => [semitones, i ? genericDegree(semitones) : 'R', TRIAD_ROLES[i]]);
const [MAJOR, MINOR] = [triad('major'), triad('minor')];
const without = (parts: Part[], role: ChordRole) => parts.filter(part => part[2] !== role);
const FLAT_FIFTH: Part = [6, '♭5', 'fifth'], SHARP_FIFTH: Part = [8, '♯5', 'fifth'];
const FLAT_SEVENTH: Part = [10, '♭7', 'seventh'], SEVENTH: Part = [11, '7', 'seventh'];
const SIXTH: Part = [9, '6', 'color'], NINTH: Part = [2, '9', 'color'], FOURTH: Part = [5, '4', 'color'], SECOND: Part = [2, '2', 'color'];
const DIMINISHED = [...without(MINOR, 'fifth'), FLAT_FIFTH];
// Keyed by the suffix after the root, once spelling variants are folded together.
const KINDS: Record<string, Kind> = {
  '': { quality: 'major', parts: MAJOR, figure: '' },
  m: { quality: 'minor', parts: MINOR, figure: '' },
  7: { quality: 'major', parts: [...MAJOR, FLAT_SEVENTH], figure: '7' },
  m7: { quality: 'minor', parts: [...MINOR, FLAT_SEVENTH], figure: '7' },
  maj7: { quality: 'major', parts: [...MAJOR, SEVENTH], figure: 'maj7' },
  mmaj7: { quality: 'minor', parts: [...MINOR, SEVENTH], figure: 'maj7' },
  6: { quality: 'major', parts: [...MAJOR, SIXTH], figure: '6' },
  m6: { quality: 'minor', parts: [...MINOR, SIXTH], figure: '6' },
  9: { quality: 'major', parts: [...MAJOR, FLAT_SEVENTH, NINTH], figure: '9' },
  m9: { quality: 'minor', parts: [...MINOR, FLAT_SEVENTH, NINTH], figure: '9' },
  maj9: { quality: 'major', parts: [...MAJOR, SEVENTH, NINTH], figure: 'maj9' },
  add9: { quality: 'major', parts: [...MAJOR, NINTH], figure: 'add9' },
  dim: { quality: 'diminished', parts: DIMINISHED, figure: '°' },
  dim7: { quality: 'diminished', parts: [...DIMINISHED, [9, '°7', 'seventh']], figure: '°7' },
  m7b5: { quality: 'diminished', parts: [...DIMINISHED, FLAT_SEVENTH], figure: 'ø7' },
  aug: { quality: 'augmented', parts: [...without(MAJOR, 'fifth'), SHARP_FIFTH], figure: '+' },
  sus4: { quality: 'suspended', parts: [MAJOR[0], FOURTH, MAJOR[2]], figure: 'sus4' },
  sus2: { quality: 'suspended', parts: [MAJOR[0], SECOND, MAJOR[2]], figure: 'sus2' },
  '7sus4': { quality: 'suspended', parts: [MAJOR[0], FOURTH, MAJOR[2], FLAT_SEVENTH], figure: '7sus4' },
  5: { quality: 'power', parts: without(MAJOR, 'third'), figure: '5' },
};

const LETTERS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const rootOf = (letter: string, accidental: string) => mod(LETTERS[letter] + (accidental === '#' || accidental === '♯' ? 1 : accidental ? -1 : 0));
const pretty = (text: string) => text.replace('#', '♯').replace('b', '♭');
// `min`, `-`, `M`, `Δ`, `+`, `°`, `ø` and a bare `sus` are other ways to write the suffixes above.
const fold = (suffix: string) => suffix.replace(/\s+/g, '').replace(/^(maj|M|Δ)(?=\d|$)/, 'maj').replace(/^(min|mi|-)/, 'm').replace(/^maj$/, '')
  .replace(/^\+$/, 'aug').replace(/^(°|o)(?=7|$)/, 'dim').replace(/^ø7?$/, 'm7b5').replace(/♭/g, 'b').replace(/sus$/, 'sus4');

/** Reads a chord symbol. Text that names no root is not a chord; a suffix beyond this vocabulary keeps its triad. */
export function parseChord(text: string): Chord | undefined {
  const match = /^([A-G])([#b♯♭]?)([^/]*)(?:\/([A-G])([#b♯♭]?))?$/.exec(text.trim());
  if (!match) return undefined;
  const [, letter, accidental, suffix, bassLetter, bassAccidental] = match;
  const folded = fold(suffix);
  const known = folded in KINDS ? folded : folded.startsWith('dim') ? 'dim' : folded.startsWith('m') && !folded.startsWith('maj') ? 'm' : '';
  const kind = KINDS[known];
  const root = rootOf(letter, accidental);
  return {
    symbol: `${letter}${pretty(accidental)}${suffix.trim()}${bassLetter ? `/${bassLetter}${pretty(bassAccidental)}` : ''}`,
    root, kind: known, quality: kind.quality, figure: kind.figure,
    tones: kind.parts.map(([semitones, label, role]) => ({ semitones, pitch: mod(root + semitones), label, role })),
    ...(bassLetter ? { bass: rootOf(bassLetter, bassAccidental) } : {}),
  };
}

/** What a pitch is to a chord: one of its tones (with its role), or a tone passing over it, named from the chord root either way. */
export function chordDegree(chord: Chord, pitch: number): { label: string; role: ChordRole | undefined } {
  const tone = chord.tones.find(t => t.pitch === mod(pitch));
  return tone ? { label: tone.label, role: tone.role } : { label: genericDegree(pitch - chord.root), role: undefined };
}

const NUMERALS = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
/** The chord's function in a key: its root as a degree of the key, lower case for minor and diminished chords. */
export function romanNumeral(chord: Chord, keyRoot: number) {
  const numeral = NUMERALS[mod(chord.root - keyRoot)];
  const lower = chord.quality === 'minor' || chord.quality === 'diminished';
  return `${lower ? numeral.toLowerCase() : numeral}${chord.figure}`;
}

/** A chord's tones as degrees of the key, each marked as inside the scale or not. `tone` spells the note in that key. */
export const chordInKey = (chord: Chord, keyRoot: number, scale: Scale) => chord.tones.map(chordTone => {
  const scaleTone = toneAt(scale, keyRoot, chordTone.pitch);
  const tone = scaleTone ?? genericTone(chordTone.pitch - keyRoot);
  return { pitch: chordTone.pitch, tone, label: degreeLabel(tone), inScale: !!scaleTone };
});
/** The chord tones a scale lacks, as degrees of the key: the notes a chord borrows from outside it. */
export const outsideScale = (chord: Chord, keyRoot: number, scale: Scale) =>
  chordInKey(chord, keyRoot, scale).filter(tone => !tone.inScale).map(({ pitch, label }) => ({ pitch, label }));
