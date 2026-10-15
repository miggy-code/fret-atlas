export const mod = (n: number, divisor = 12) => ((n % divisor) + divisor) % divisor;
export const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export type Spelling = 'sharps' | 'flats';
export type Tone = { semitones: number; degree: number; alteration: number; skeleton: boolean };
export type Scale = { id: string; name: string; group: string; tones: readonly Tone[]; family?: 'minor' | 'major' };
export type Note = { id: string; string: number; fret: number; midi: number; pitch: number; octave: number };
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
const NATURALS = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const tone = (semitones: number, degree: number, alteration = 0, skeleton = true): Tone => ({ semitones, degree, alteration, skeleton });
const minor = [tone(0, 1), tone(3, 3, -1), tone(5, 4), tone(7, 5), tone(10, 7, -1)];
const major = [tone(0, 1), tone(2, 2), tone(4, 3), tone(7, 5), tone(9, 6)];
// A scale gets pentatonic rectangle/stack geometry only when it contains a whole pentatonic.
const familyOf = (semitones: number[]): 'minor' | 'major' | undefined =>
  minor.every(t => semitones.includes(t.semitones)) ? 'minor' : major.every(t => semitones.includes(t.semitones)) ? 'major' : undefined;
const diatonic = (steps: number[], family: 'minor' | 'major' | undefined) => steps.map((step, i) => tone(step, i + 1, step - NATURALS[i], !family || (family === 'minor' ? minor : major).some(t => t.semitones === step)));
// Explicit [semitones, degree] pairs; the alteration is derived from the major-scale natural for that degree.
const spelled = (pairs: [number, number][]) => pairs.map(([semitones, degree]) => tone(semitones, degree, semitones - NATURALS[degree - 1]));
const mode = (id: string, name: string, group: string, steps: number[]): Scale => {
  const family = familyOf(steps);
  return { id, name, group, tones: diatonic(steps, family), family };
};
const explicit = (id: string, name: string, group: string, pairs: [number, number][]): Scale => ({ id, name, group, tones: spelled(pairs) });
export const SCALES: readonly Scale[] = [
  { id: 'minor-pentatonic', name: 'Minor pentatonic', group: 'Pentatonic & blues', tones: minor, family: 'minor' },
  { id: 'major-pentatonic', name: 'Major pentatonic', group: 'Pentatonic & blues', tones: major, family: 'major' },
  { id: 'minor-blues', name: 'Blues', group: 'Pentatonic & blues', tones: [...minor, tone(6, 5, -1, false)].sort((a, b) => a.semitones - b.semitones), family: 'minor' },
  { id: 'major-blues', name: 'Major blues', group: 'Pentatonic & blues', tones: [...major, tone(3, 3, -1, false)].sort((a, b) => a.semitones - b.semitones), family: 'major' },
  { id: 'minor-hexatonic', name: 'Minor hexatonic', group: 'Pentatonic & blues', tones: [...minor, tone(2, 2, 0, false)].sort((a, b) => a.semitones - b.semitones), family: 'minor' },
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
  { id: 'major-triad', name: 'Major triad', group: 'Triads & custom', tones: [tone(0, 1), tone(4, 3), tone(7, 5)] },
  { id: 'minor-triad', name: 'Minor triad', group: 'Triads & custom', tones: [tone(0, 1), tone(3, 3, -1), tone(7, 5)] },
  { id: 'custom', name: 'Custom notes', group: 'Triads & custom', tones: [] },
];
export const scaleById = (id: string) => SCALES.find(s => s.id === id) ?? SCALES[0];
export const pitchName = (pitch: number, spelling: Spelling = 'sharps') => (spelling === 'flats' ? FLATS : SHARPS)[mod(pitch)];
export const accidental = (amount: number) => amount < 0 ? '♭'.repeat(-amount) : '♯'.repeat(amount);
export const degreeLabel = (t: Tone) => `${accidental(t.alteration)}${t.degree}`;
export const genericDegree = (semitones: number) => ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'][mod(semitones)];
export const toneAt = (scale: Scale, root: number, pitch: number) => scale.tones.find(t => t.semitones === mod(pitch - root));
export function position(string: number, fret: number, tuning: Tuning = STANDARD_TUNING): Note {
  if (!Number.isInteger(string) || string < 1 || string > tuning.midi.length || !Number.isInteger(fret) || fret < 0 || fret > 24) throw new RangeError('Invalid fretboard position');
  const midi = tuning.midi[string - 1] + fret;
  return { id: `${string}:${fret}`, string, fret, midi, pitch: mod(midi), octave: Math.floor(midi / 12) - 1 };
}
export function spellTone(root: number, spelling: Spelling, t: Tone) {
  const letter = mod(LETTERS.indexOf(pitchName(root, spelling)[0]) + t.degree - 1, 7);
  const pitch = mod(root + t.semitones);
  const alteration = mod(pitch - NATURALS[letter] + 6) - 6;
  return { name: LETTERS[letter] + accidental(alteration), natural: NATURALS[letter], alteration };
}
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
