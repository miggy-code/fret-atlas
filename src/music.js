import { scaleById, scalePitches } from './scales.js';

// Pitch identity is independent of spelling and screen position.
export const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
export const NATURALS = [0, 2, 4, 5, 7, 9, 11];
// String numbers are physical identities: 1 is always high E, 6 is low E.
export const STRINGS = [
  { number: 1, midi: 64, name: 'E', octave: 4 },
  { number: 2, midi: 59, name: 'B', octave: 3 },
  { number: 3, midi: 55, name: 'G', octave: 3 },
  { number: 4, midi: 50, name: 'D', octave: 3 },
  { number: 5, midi: 45, name: 'A', octave: 2 },
  { number: 6, midi: 40, name: 'E', octave: 2 },
];
export const INTERVALS = ['R', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7'];
export const INTERVAL_NAMES = ['Root / octave', 'Minor second', 'Major second', 'Minor third', 'Major third', 'Perfect fourth', 'Tritone', 'Perfect fifth', 'Minor sixth', 'Major sixth', 'Minor seventh', 'Major seventh'];
export const mod = (n, d = 12) => ((n % d) + d) % d;
export const noteName = (pitch, spelling = 'sharps') => (spelling === 'flats' ? FLATS : SHARPS)[mod(pitch)];
export const intervalFrom = (pitch, root) => mod(pitch - root);
export function position(stringNumber, fret) {
  const string = STRINGS.find(s => s.number === stringNumber);
  if (!string || !Number.isInteger(fret) || fret < 0 || fret > 24) throw new RangeError('Invalid fretboard position');
  const midi = string.midi + fret;
  return { id: `${stringNumber}:${fret}`, string: stringNumber, fret, midi, pitch: mod(midi), octave: Math.floor(midi / 12) - 1 };
}
export function isInFocus(note, state) {
  return state.strings.includes(note.string) && (!state.focus || (note.fret >= state.from && note.fret <= state.to));
}
export function moveRegion(from, to, direction, maxFret) {
  const shift = Math.max(-from, Math.min(maxFret - to, direction));
  return { from: from + shift, to: to + shift };
}
export function defaultState() {
  return {
    root: 9, notes: [0, 2, 4, 7, 9], spelling: 'sharps', labels: 'none', frets: 15,
    focus: false, from: 3, to: 7, strings: [1, 2, 3, 4, 5, 6],
    context: false, leftHanded: false, marks: [], inspected: null,
    scale: 'minor-pentatonic', overlay: 'rectangle', shapeIndex: 2, stringNames: false,
  };
}
export function restoreState(raw) {
  const state = defaultState();
  if (!raw || typeof raw !== 'object') return state;
  if (Number.isInteger(raw.root) && raw.root >= 0 && raw.root < 12) state.root = raw.root;
  if (Array.isArray(raw.notes)) state.notes = [...new Set(raw.notes.filter(n => Number.isInteger(n) && n >= 0 && n < 12))];
  if (Array.isArray(raw.strings)) state.strings = [...new Set(raw.strings.filter(n => Number.isInteger(n) && n >= 1 && n <= 6))];
  if (['sharps', 'flats'].includes(raw.spelling)) state.spelling = raw.spelling;
  if (['none', 'notes', 'intervals', 'both'].includes(raw.labels)) state.labels = raw.labels;
  if ([12, 15, 24].includes(raw.frets)) state.frets = raw.frets;
  for (const key of ['focus', 'context', 'leftHanded', 'stringNames']) if (typeof raw[key] === 'boolean') state[key] = raw[key];
  if (Number.isInteger(raw.from)) state.from = Math.max(0, Math.min(state.frets, raw.from));
  if (Number.isInteger(raw.to)) state.to = Math.max(state.from, Math.min(state.frets, raw.to));
  state.to = Math.max(state.from, state.to);
  if (Array.isArray(raw.marks)) state.marks = [...new Set(raw.marks.filter(id => typeof id === 'string' && /^[1-6]:(?:[0-9]|1[0-9]|2[0-4])$/.test(id)))];
  state.scale = scaleById(raw.scale).id;
  if (state.scale !== 'custom') state.notes = scalePitches(state.scale, state.root);
  state.overlay = ['none', 'rectangle', 'stack'].includes(raw.overlay) && scaleById(state.scale).skeleton ? raw.overlay : 'none';
  state.shapeIndex = Number.isInteger(raw.shapeIndex) && raw.shapeIndex >= 0 ? raw.shapeIndex : 0;
  return state;
}
