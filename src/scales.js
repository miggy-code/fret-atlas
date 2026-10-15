import { mod, position, noteName } from './music.js';

export const SCALES = [
  { id: 'custom', name: 'Custom notes', intervals: null },
  { id: 'minor-pentatonic', name: 'Minor pentatonic', intervals: [0, 3, 5, 7, 10], skeleton: [0, 3, 5, 7, 10] },
  { id: 'major-pentatonic', name: 'Major pentatonic', intervals: [0, 2, 4, 7, 9], skeleton: [0, 2, 4, 7, 9] },
  { id: 'minor-blues', name: 'Minor blues', intervals: [0, 3, 5, 6, 7, 10], skeleton: [0, 3, 5, 7, 10] },
  { id: 'major', name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11], skeleton: [0, 2, 4, 7, 9] },
  { id: 'minor', name: 'Natural minor', intervals: [0, 2, 3, 5, 7, 8, 10], skeleton: [0, 3, 5, 7, 10] },
  { id: 'dorian', name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10], skeleton: [0, 3, 5, 7, 10] },
  { id: 'mixolydian', name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10], skeleton: [0, 2, 4, 7, 9] },
  { id: 'major-triad', name: 'Major triad', intervals: [0, 4, 7] },
  { id: 'minor-triad', name: 'Minor triad', intervals: [0, 3, 7] },
];

export const scaleById = id => SCALES.find(s => s.id === id) || SCALES[0];
export const scalePitches = (id, root) => (scaleById(id).intervals || []).map(i => mod(root + i)).sort((a, b) => a - b);

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const DEGREES = {
  'minor-pentatonic': [0, 2, 3, 4, 6], 'major-pentatonic': [0, 1, 2, 4, 5],
  'minor-blues': [0, 2, 3, 4, 4, 6], 'major-triad': [0, 2, 4], 'minor-triad': [0, 2, 4],
};
function spellingFor(state, pitch) {
  const scale = scaleById(state.scale);
  const index = scale.intervals?.indexOf(mod(pitch - state.root)) ?? -1;
  if (index < 0) return null;
  const rootLetter = LETTERS.indexOf(noteName(state.root, state.spelling)[0]);
  const degree = (DEGREES[state.scale] || [0, 1, 2, 3, 4, 5, 6])[index];
  const letter = (rootLetter + degree) % 7;
  const accidental = mod(pitch - NATURAL_PITCHES[letter] + 6) - 6;
  return { letter, accidental };
}
export function displayNote(state, pitch) {
  const spelled = spellingFor(state, pitch);
  if (!spelled) return noteName(pitch, state.spelling);
  return LETTERS[spelled.letter] + (spelled.accidental < 0 ? '♭'.repeat(-spelled.accidental) : '♯'.repeat(spelled.accidental));
}
export function displayOctave(state, note) {
  const spelled = spellingFor(state, note.pitch);
  return spelled ? Math.floor((note.midi - NATURAL_PITCHES[spelled.letter] - spelled.accidental) / 12) - 1 : note.octave;
}

// Enumerate the two pentatonic building blocks in sounding-pitch space.
// A rectangle is two rows of minor thirds. A stack is three rows of whole tones.
// Above the G–B boundary every fret shifts +1 to preserve fourths geometry.
export function shapesFor(state, type = state.overlay) {
  const skeleton = scaleById(state.scale).skeleton;
  if (!skeleton || !['rectangle', 'stack'].includes(type)) return [];
  const pitches = skeleton.map(i => mod(state.root + i));
  const rowCount = type === 'rectangle' ? 2 : 3;
  const width = type === 'rectangle' ? 3 : 2;
  const shapes = [];
  for (let lower = rowCount; lower <= 6; lower++) {
    for (let base = 0; base <= state.frets; base++) {
      const rows = Array.from({ length: rowCount }, (_, i) => {
        const string = lower - i;
        const fret = base + (lower >= 3 && string <= 2 ? 1 : 0);
        return { string, left: fret, right: fret + width };
      }).sort((a, b) => a.string - b.string);
      if (rows.some(r => r.right > state.frets)) continue;
      const notes = rows.flatMap(r => [position(r.string, r.left), position(r.string, r.right)]);
      if (!notes.every(n => pitches.includes(n.pitch))) continue;
      // A partial shape after string/range filtering must not masquerade as complete.
      if (rows.some(r => !state.strings.includes(r.string) || (state.focus && (r.left < state.from || r.right > state.to)))) continue;
      shapes.push({ id: `${type}:${lower}:${base}`, type, rows, ids: notes.map(n => n.id), from: Math.min(...rows.map(r => r.left)), to: Math.max(...rows.map(r => r.right)), warped: rows.some(r => r.left !== rows[0].left) });
    }
  }
  return shapes.sort((a, b) => a.from - b.from || a.rows[0].string - b.rows[0].string);
}

export function activeShape(state) {
  const shapes = shapesFor(state);
  return shapes[Math.min(state.shapeIndex, shapes.length - 1)] || null;
}

export function insideShape(note, shape) {
  const row = shape?.rows.find(r => r.string === note.string);
  return Boolean(row && note.fret >= row.left && note.fret <= row.right);
}

export function preferredShapeIndex(state) {
  const shapes = shapesFor(state);
  // Prefer a useful central-neck example; A minor starts at the familiar fifth fret.
  const target = state.focus ? state.from : 5;
  let best = 0;
  for (let i = 1; i < shapes.length; i++) {
    if (Math.abs(shapes[i].from - target) < Math.abs(shapes[best].from - target)) best = i;
  }
  return best;
}

export function shapePolygon(shape, frets, leftHanded) {
  const x = f => leftHanded ? frets - f + 0.5 : f + 0.5;
  const rows = shape.rows.map(r => ({ y: r.string - 0.5, left: Math.min(x(r.left), x(r.right)) - 0.32, right: Math.max(x(r.left), x(r.right)) + 0.32 }));
  const first = rows[0];
  const last = rows.at(-1);
  const points = [[first.left, first.y - 0.43], [first.right, first.y - 0.43]];
  for (let i = 1; i < rows.length; i++) {
    const mid = (rows[i - 1].y + rows[i].y) / 2;
    points.push([rows[i - 1].right, mid], [rows[i].right, mid]);
  }
  points.push([last.right, last.y + 0.43], [last.left, last.y + 0.43]);
  for (let i = rows.length - 2; i >= 0; i--) {
    const mid = (rows[i].y + rows[i + 1].y) / 2;
    points.push([rows[i + 1].left, mid], [rows[i].left, mid]);
  }
  return points.map(p => p.join(',')).join(' ');
}
