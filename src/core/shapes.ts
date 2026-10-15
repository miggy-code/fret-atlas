import { mod, SCALES, STANDARD_TUNING } from './music';
import type { Tuning } from './music';

export type ShapeKind = 'rectangle' | 'stack';
export type ShapeRow = { string: number; left: number; right: number };
export type Shape = { id: string; kind: ShapeKind; rows: ShapeRow[]; from: number; to: number; warped: boolean; partial: boolean; endpoints: string[]; continuesAbove?: boolean; continuesBelow?: boolean };
export type ShapeRequest = { root: number; scaleId: string; kind: ShapeKind; frets: number; includeFretEdges?: boolean; tuning?: Tuning };

// Extend the fourths grid beyond the outer strings to recognize edge fragments.
// The only tuning discontinuity remains the physical G–B boundary.
const tuningAt = (midi: readonly number[], string: number) => string < 1 ? midi[0] + 5 * (1 - string) : string > 6 ? midi[5] - 5 * (string - 6) : midi[string - 1];

export function findShapes({ root, scaleId, kind, frets, includeFretEdges = false, tuning = STANDARD_TUNING }: ShapeRequest): Shape[] {
  const scale = SCALES.find(s => s.id === scaleId);
  if (!scale?.family || !Number.isInteger(root) || root < 0 || root > 11 || !Number.isInteger(frets) || frets < 0 || frets > 24) return [];
  const skeleton = scale.tones.filter(t => t.skeleton).map(t => mod(root + t.semitones));
  const count = kind === 'rectangle' ? 2 : 3;
  const width = kind === 'rectangle' ? 3 : 2;
  const result: Shape[] = [];
  for (let bottom = 1; bottom <= 6 + count - 1; bottom++) {
    for (let fret = includeFretEdges ? -width : -1; fret <= (includeFretEdges ? frets : frets - width); fret++) {
      const fullRows = Array.from({ length: count }, (_, i) => {
        const string = bottom - i;
        const left = fret + 5 * i - (tuningAt(tuning.midi, string) - tuningAt(tuning.midi, bottom));
        return { string, left, right: left + width };
      }).sort((a, b) => a.string - b.string);
      if (!fullRows.every(row => [row.left, row.right].every(fret => skeleton.includes(mod(tuningAt(tuning.midi, row.string) + fret))))) continue;
      const rows = fullRows.filter(row => row.string >= 1 && row.string <= 6 && (includeFretEdges ? row.right >= 0 && row.left <= frets : row.left >= 0 && row.right <= frets));
      if (!rows.length) continue;
      const endpoints = rows.flatMap(row => [`${row.string}:${row.left}`, `${row.string}:${row.right}`]);
      result.push({ id: `${kind}:${bottom}:${fret}`, kind, rows, endpoints, from: Math.min(...rows.map(r => r.left)), to: Math.max(...rows.map(r => r.right)), warped: rows.some(r => r.left !== rows[0].left), partial: rows.length < count, continuesAbove: fullRows[0].string < 1, continuesBelow: fullRows.at(-1)!.string > 6 });
    }
  }
  return result.sort((a, b) => a.from - b.from || a.rows[0].string - b.rows[0].string);
}
export const insideShape = (string: number, fret: number, shape?: Shape) => !!shape?.rows.some(r => r.string === string && fret >= r.left && fret <= r.right);
export function closestShape(shapes: Shape[], fret: number, topString = 1): Shape | undefined {
  return [...shapes].sort((a, b) => (Math.abs(a.from - fret) * 10 + Math.abs(a.rows[0].string - topString)) - (Math.abs(b.from - fret) * 10 + Math.abs(b.rows[0].string - topString)))[0];
}
