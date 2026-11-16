// Music theory first (pitch classes, scales, triads), then the instrument that plays it (tuning, strings, frets).
// Nothing here knows about the saved view, the screen or the patterns drawn on the neck.
export const mod = (n: number, divisor = 12) => ((n % divisor) + divisor) % divisor;

// ---- Pitch classes and their names ----
export const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export type Spelling = 'sharps' | 'flats';
const NATURALS = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const pitchName = (pitch: number, spelling: Spelling = 'sharps') => (spelling === 'flats' ? FLATS : SHARPS)[mod(pitch)];
export const accidental = (amount: number) => amount < 0 ? '♭'.repeat(-amount) : '♯'.repeat(amount);

// ---- Scales ----
// A tone is an interval from the root, spelled as a degree of the major scale plus an alteration: 6 semitones is ♭5 or ♯4.
// `skeleton` marks the tones of the pentatonic the scale is built on; the rest are additions drawn around its patterns.
export type Tone = { semitones: number; degree: number; alteration: number; skeleton: boolean };
/** Which pentatonic a scale contains whole, and so whose rectangles and stacks it wears. */
export type Family = 'minor' | 'major';
// Generic over the id so the catalog below keeps each id as a literal, from which `ScaleId` is derived.
type ScaleOf<Id extends string> = { id: Id; name: string; group: string; tones: readonly Tone[]; family?: Family };
const tone = (semitones: number, degree: number, alteration = 0, skeleton = true): Tone => ({ semitones, degree, alteration, skeleton });
const minor = [tone(0, 1), tone(3, 3, -1), tone(5, 4), tone(7, 5), tone(10, 7, -1)];
const major = [tone(0, 1), tone(2, 2), tone(4, 3), tone(7, 5), tone(9, 6)];
// A scale gets pentatonic rectangle/stack geometry only when it contains a whole pentatonic.
const familyOf = (semitones: number[]): Family | undefined =>
  minor.every(t => semitones.includes(t.semitones)) ? 'minor' : major.every(t => semitones.includes(t.semitones)) ? 'major' : undefined;
const diatonic = (steps: number[], family: Family | undefined) => steps.map((step, i) => tone(step, i + 1, step - NATURALS[i], !family || (family === 'minor' ? minor : major).some(t => t.semitones === step)));
// Explicit [semitones, degree] pairs; the alteration is derived from the major-scale natural for that degree.
const spelled = (pairs: [number, number][]) => pairs.map(([semitones, degree]) => tone(semitones, degree, semitones - NATURALS[degree - 1]));
const named = <Id extends string>(id: Id, name: string, group: string, tones: readonly Tone[], family?: Family): ScaleOf<Id> => ({ id, name, group, tones, family });
const mode = <Id extends string>(id: Id, name: string, group: string, steps: number[]): ScaleOf<Id> => {
  const family = familyOf(steps);
  return { id, name, group, tones: diatonic(steps, family), family };
};
const explicit = <Id extends string>(id: Id, name: string, group: string, pairs: [number, number][]): ScaleOf<Id> => ({ id, name, group, tones: spelled(pairs) });
const CATALOG = [
  named('minor-pentatonic', 'Minor pentatonic', 'Pentatonic & blues', minor, 'minor'),
  named('major-pentatonic', 'Major pentatonic', 'Pentatonic & blues', major, 'major'),
  named('minor-blues', 'Blues', 'Pentatonic & blues', [...minor, tone(6, 5, -1, false)].sort((a, b) => a.semitones - b.semitones), 'minor'),
  named('major-blues', 'Major blues', 'Pentatonic & blues', [...major, tone(3, 3, -1, false)].sort((a, b) => a.semitones - b.semitones), 'major'),
  named('minor-hexatonic', 'Minor hexatonic', 'Pentatonic & blues', [...minor, tone(2, 2, 0, false)].sort((a, b) => a.semitones - b.semitones), 'minor'),
  explicit('dominant-pentatonic-1', 'Dominant pentatonic 1', 'Pentatonic & blues', [[0, 1], [2, 2], [4, 3], [7, 5], [10, 7]]),
  explicit('dominant-pentatonic-2', 'Dominant pentatonic 2', 'Pentatonic & blues', [[0, 1], [4, 3], [5, 4], [7, 5], [10, 7]]),
  explicit('minor-major-pentatonic', 'Minor-major pentatonic', 'Pentatonic & blues', [[0, 1], [3, 3], [5, 4], [7, 5], [9, 6]]),
  explicit('dominant-7', 'Dominant seventh', 'Arpeggios', [[0, 1], [4, 3], [7, 5], [10, 7]]),
  explicit('major-7', 'Major seventh', 'Arpeggios', [[0, 1], [4, 3], [7, 5], [11, 7]]),
  explicit('minor-7', 'Minor seventh', 'Arpeggios', [[0, 1], [3, 3], [7, 5], [10, 7]]),
  mode('major', 'Major · Ionian', 'Diatonic', [0, 2, 4, 5, 7, 9, 11]),
  mode('dorian', 'Dorian', 'Diatonic', [0, 2, 3, 5, 7, 9, 10]),
  mode('phrygian', 'Phrygian', 'Diatonic', [0, 1, 3, 5, 7, 8, 10]),
  mode('lydian', 'Lydian', 'Diatonic', [0, 2, 4, 6, 7, 9, 11]),
  mode('mixolydian', 'Mixolydian', 'Diatonic', [0, 2, 4, 5, 7, 9, 10]),
  mode('minor', 'Natural minor · Aeolian', 'Diatonic', [0, 2, 3, 5, 7, 8, 10]),
  mode('locrian', 'Locrian', 'Diatonic', [0, 1, 3, 5, 6, 8, 10]),
  mode('harmonic-minor', 'Harmonic minor', 'Minor scales & altered dominants', [0, 2, 3, 5, 7, 8, 11]),
  mode('melodic-minor', 'Melodic minor', 'Minor scales & altered dominants', [0, 2, 3, 5, 7, 9, 11]),
  mode('phrygian-dominant', 'Phrygian dominant', 'Minor scales & altered dominants', [0, 1, 4, 5, 7, 8, 10]),
  mode('mixolydian-b6', 'Mixolydian ♭6', 'Minor scales & altered dominants', [0, 2, 4, 5, 7, 8, 10]),
  mode('lydian-dominant', 'Lydian dominant', 'Minor scales & altered dominants', [0, 2, 4, 6, 7, 9, 10]),
  explicit('altered', 'Altered', 'Minor scales & altered dominants', [[0, 1], [1, 2], [3, 2], [4, 3], [6, 5], [8, 5], [10, 7]]),
  explicit('whole-tone', 'Whole tone', 'Symmetric', [[0, 1], [2, 2], [4, 3], [6, 4], [8, 5], [10, 7]]),
  explicit('diminished-hw', 'Diminished (half–whole)', 'Symmetric', [[0, 1], [1, 2], [3, 3], [4, 3], [6, 4], [7, 5], [9, 6], [10, 7]]),
  explicit('diminished-wh', 'Diminished (whole–half)', 'Symmetric', [[0, 1], [2, 2], [3, 3], [5, 4], [6, 5], [8, 6], [9, 6], [11, 7]]),
  named('custom', 'Custom notes', 'Custom', []),
];
export type ScaleId = typeof CATALOG[number]['id'];
export type Scale = ScaleOf<ScaleId>;
/** Every scale that can be chosen, in menu order. `custom` has no tones of its own: the view holds its pitch classes. */
export const SCALES: readonly Scale[] = CATALOG;
/** Outside data (a saved view, a link, a menu) passes this check before its scale id is used anywhere else. */
export const isScaleId = (id: unknown): id is ScaleId => SCALES.some(s => s.id === id);
/** No fallback: a wrong id must fail loudly rather than show a plausible board for another scale. */
export const scaleById = (id: ScaleId): Scale => {
  const scale = SCALES.find(s => s.id === id);
  if (!scale) throw new RangeError(`Unknown scale id: ${id}`);
  return scale;
};
export const degreeLabel = (t: Tone) => `${accidental(t.alteration)}${t.degree}`;
export const genericDegree = (semitones: number) => ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'][mod(semitones)];
export const toneAt = (scale: Scale, root: number, pitch: number) => scale.tones.find(t => t.semitones === mod(pitch - root));
/** The pitch classes on the board: a named scale transposed to its root, or the custom notes as they are. */
export const selectedPitches = (s: { root: number; scaleId: ScaleId; customPitches: number[] }) =>
  s.scaleId === 'custom' ? s.customPitches : scaleById(s.scaleId).tones.map(t => mod(s.root + t.semitones));
export function spellTone(root: number, spelling: Spelling, t: Tone) {
  const letter = mod(LETTERS.indexOf(pitchName(root, spelling)[0]) + t.degree - 1, 7);
  const pitch = mod(root + t.semitones);
  const alteration = mod(pitch - NATURALS[letter] + 6) - 6;
  return { name: LETTERS[letter] + accidental(alteration), natural: NATURALS[letter], alteration };
}

// ---- Triads ----
export type TriadQuality = 'major' | 'minor';
/** Root, third and fifth, in semitones above the root. */
export const TRIAD_INTERVALS: Record<TriadQuality, readonly number[]> = { major: [0, 4, 7], minor: [0, 3, 7] };
/** A triad's pitch classes, root first. */
export const triadOf = (root: number, quality: TriadQuality) => TRIAD_INTERVALS[quality].map(interval => mod(root + interval));
export type ChordRole = 'third' | 'fifth';
/**
 * A tone's part in the scale's own tonic triad. Where a scale has two tones on one degree (the blues ♭5 beside 5,
 * the major blues ♭3 beside 3), only the less altered one is the chord tone; the other is a passing color.
 */
export function chordRole(scale: Scale, t: Tone): ChordRole | undefined {
  if (t.degree !== 3 && t.degree !== 5) return undefined;
  const leastAltered = Math.min(...scale.tones.filter(other => other.degree === t.degree).map(other => Math.abs(other.alteration)));
  return Math.abs(t.alteration) === leastAltered ? t.degree === 3 ? 'third' : 'fifth' : undefined;
}

// ---- The instrument: six strings, numbered 1 (high e) to 6 (low E), and up to 24 frets ----
export const STRINGS = [1, 2, 3, 4, 5, 6] as const;
export const MAX_FRET = 24;
export const NECK_LENGTHS = [12, 15, 17, 22, 24] as const;
export const isNeckLength = (frets: unknown): frets is number => (NECK_LENGTHS as readonly unknown[]).includes(frets);
export const TUNING = [64, 59, 55, 50, 45, 40] as const;
// High string first, like TUNING. `shift` is the one-fret G–B correction: 1 in standard tuning, 0 in all fourths.
export type Tuning = { midi: readonly number[]; shift: number };
export const STANDARD_TUNING: Tuning = { midi: TUNING, shift: 1 };
// `lowered` drops every string by that many semitones (negative raises), keeping the same fingerings.
export const tuningFor = (lowered = 0, fourths = false): Tuning => ({
  midi: (fourths ? [65, 60, 55, 50, 45, 40] : TUNING).map(midi => midi - lowered),
  shift: fourths ? 0 : 1,
});
export const LOWEST_STRING_CHOICES: readonly { lowered: number; label: string }[] = [
  { lowered: -2, label: 'F♯' }, { lowered: -1, label: 'F' }, { lowered: 0, label: 'E (standard)' }, { lowered: 1, label: 'E♭' },
  { lowered: 2, label: 'D' }, { lowered: 3, label: 'C♯' }, { lowered: 4, label: 'C' }, { lowered: 5, label: 'B' },
];
/** The open string's name as the board's gutter shows it: high e is lowercase. */
export const stringName = (string: number, tuning: Tuning, spelling: Spelling) => {
  const name = pitchName(tuning.midi[string - 1], spelling);
  return string === 1 ? name.toLowerCase() : name;
};

// A note is one physical place on the neck. Its id, "string:fret", is what the view saves, the DOM carries and drills compare;
// the same pitch on another string is a different note.
export type Note = { id: string; string: number; fret: number; midi: number; pitch: number; octave: number };
export const noteId = (string: number, fret: number) => `${string}:${fret}`;
export const parseNoteId = (id: string) => id.split(':').map(Number) as [string: number, fret: number];
export const isNoteId = (id: unknown): id is string => typeof id === 'string' && /^[1-6]:(?:[0-9]|1[0-9]|2[0-4])$/.test(id);
export function position(string: number, fret: number, tuning: Tuning = STANDARD_TUNING): Note {
  if (!Number.isInteger(string) || string < 1 || string > tuning.midi.length || !Number.isInteger(fret) || fret < 0 || fret > MAX_FRET) throw new RangeError('Invalid fretboard position');
  const midi = tuning.midi[string - 1] + fret;
  return { id: noteId(string, fret), string, fret, midi, pitch: mod(midi), octave: Math.floor(midi / 12) - 1 };
}
export const noteAt = (id: string, tuning: Tuning = STANDARD_TUNING) => position(...parseNoteId(id), tuning);
export function describeNote(note: Note, root: number, scale: Scale, spelling: Spelling) {
  const t = toneAt(scale, root, note.pitch);
  const spelled = t && spellTone(root, spelling, t);
  return {
    name: spelled?.name ?? pitchName(note.pitch, spelling),
    octave: spelled ? Math.floor((note.midi - spelled.natural - spelled.alteration) / 12) - 1 : note.octave,
    interval: t ? degreeLabel(t) : genericDegree(note.pitch - root),
    tone: t,
  };
}
