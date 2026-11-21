// Chord grips a guitarist actually holds, from two hand-made sources and nothing generated.
// The chord book is chords-db (MIT, © 2016 David Rubert): the voicings a chord book prints for each chord, first choice
// first. The five CAGED shapes are entered here by hand, so every chord type they cover can be found in every position,
// and a grip can be named by the shape it is. Placing a CAGED shape only slides it to the chord's root.
import book from '@tombatossals/chords-db/lib/guitar.json' with { type: 'json' };
import { parseChord } from './harmony';
import type { Chord, ChordTone } from './harmony';
import { genericDegree, mod, tuningFor } from './music';
import type { State } from './state';
import { inStudy } from './study';
import type { Study } from './study';

export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D';
/** `hard` marks a grip players know but reach for less: the C and G shapes barred up the neck, the minor C and G shapes. */
export type GripRating = 'common' | 'hard';
export type GripNote = { string: number; fret: number; finger: number; midi: number; tone: ChordTone };
/**
 * A grip on the neck. Strings are numbered from high e (1); a barre runs from its lowest string `from` to `to`.
 * `rank` orders the chord book's grips for a chord, 0 being its first choice. `shape` names the CAGED shape it is, if any.
 */
export type Grip = {
  source: 'book' | 'caged'; rank: number; shape?: CagedShape; rating: GripRating; inversion: boolean;
  notes: GripNote[]; muted: number[]; barre?: { fret: number; from: number; to: number };
};
type Neck = Pick<State, 'frets' | 'lowest' | 'fourths'>;
type Kind = 'major' | 'minor' | '7';
// Low E to high e, as a chord chart reads; null is a muted string.
type Frets = (number | null)[];

// Moved frets count from the barre (or first finger) fret.
type Form = { frets: Frets; fingers: number[] };
// `rating` is the moved grip's; an open chord is common unless `openRating` says otherwise.
type Template = { shape: CagedShape; kind: Kind; open?: Form; moved: Form; rating: GripRating; openRating?: GripRating };
const x = null;
const TEMPLATES: Template[] = [
  { shape: 'C', kind: 'major', rating: 'hard', open: { frets: [x, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] }, moved: { frets: [x, 3, 2, 0, 1, 0], fingers: [0, 4, 3, 1, 2, 1] } },
  { shape: 'A', kind: 'major', rating: 'common', open: { frets: [x, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }, moved: { frets: [x, 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] } },
  // The full G shape cannot be barred up the neck; players keep its lower four strings.
  { shape: 'G', kind: 'major', rating: 'hard', open: { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] }, moved: { frets: [3, 2, 0, 0, 0, x], fingers: [4, 3, 1, 1, 1, 0] } },
  { shape: 'E', kind: 'major', rating: 'common', open: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] }, moved: { frets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] } },
  { shape: 'D', kind: 'major', rating: 'common', open: { frets: [x, x, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }, moved: { frets: [x, x, 0, 2, 3, 2], fingers: [0, 0, 1, 2, 4, 3] } },

  // There is no open C minor; the movable one keeps the middle four strings.
  { shape: 'C', kind: 'minor', rating: 'hard', moved: { frets: [x, 3, 1, 0, 1, x], fingers: [0, 4, 2, 1, 3, 0] } },
  { shape: 'A', kind: 'minor', rating: 'common', open: { frets: [x, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] }, moved: { frets: [x, 0, 2, 2, 1, 0], fingers: [0, 1, 3, 4, 2, 1] } },
  { shape: 'G', kind: 'minor', rating: 'hard', openRating: 'hard', open: { frets: [3, 1, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] }, moved: { frets: [3, 1, 0, 0, x, x], fingers: [4, 2, 1, 1, 0, 0] } },
  { shape: 'E', kind: 'minor', rating: 'common', open: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] }, moved: { frets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] } },
  { shape: 'D', kind: 'minor', rating: 'common', open: { frets: [x, x, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] }, moved: { frets: [x, x, 0, 2, 3, 1], fingers: [0, 0, 1, 3, 4, 2] } },

  { shape: 'C', kind: '7', rating: 'common', open: { frets: [x, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] }, moved: { frets: [x, 3, 2, 3, 1, x], fingers: [0, 3, 2, 4, 1, 0] } },
  { shape: 'A', kind: '7', rating: 'common', open: { frets: [x, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] }, moved: { frets: [x, 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] } },
  { shape: 'G', kind: '7', rating: 'hard', open: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] }, moved: { frets: [3, 2, 0, 0, 0, 1], fingers: [4, 3, 1, 1, 1, 2] } },
  { shape: 'E', kind: '7', rating: 'common', open: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] }, moved: { frets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] } },
  { shape: 'D', kind: '7', rating: 'common', open: { frets: [x, x, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] }, moved: { frets: [x, x, 0, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] } },
];
// Each shape's root at the nut: the letter it is named for, on this string (6 = low E) and fret.
const SHAPE_ROOT: Record<CagedShape, { string: number; fret: number }> = {
  C: { string: 5, fret: 3 }, A: { string: 5, fret: 0 }, G: { string: 6, fret: 3 }, E: { string: 6, fret: 0 }, D: { string: 4, fret: 0 },
};

const CAGED_KIND: Record<string, Kind> = { '': 'major', m: 'minor', 7: '7' };

// The chord book's names for keys and suffixes. A slash chord's bass is named the book's way too.
const BOOK_KEYS = ['C', 'Csharp', 'D', 'Eb', 'E', 'F', 'Fsharp', 'G', 'Ab', 'A', 'Bb', 'B'];
const BOOK_BASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const BOOK_SUFFIX: Record<string, string> = {
  '': 'major', m: 'minor', 7: '7', m7: 'm7', maj7: 'maj7', mmaj7: 'mmaj7', 6: '6', m6: 'm6', 9: '9', m9: 'm9', maj9: 'maj9',
  add9: 'add9', dim: 'dim', dim7: 'dim7', m7b5: 'm7b5', aug: 'aug', sus2: 'sus2', sus4: 'sus4', '7sus4': '7sus4',
};
const STANDARD = tuningFor(0, false).midi;
const chartOf = (frets: Frets) => frets.map(f => f ?? 'x').join(' ');

/** Turns frets and fingers into a grip, or nothing if it sounds a note outside the chord (a slash chord's bass is allowed). */
function build(frets: Frets, fingers: readonly number[], chord: Chord, open: readonly number[], meta: Pick<Grip, 'source' | 'rank' | 'shape' | 'rating'>): Grip | undefined {
  const notes: GripNote[] = [];
  const muted: number[] = [];
  for (const [i, fret] of frets.entries()) {
    const string = 6 - i;
    if (fret === null) { muted.push(string); continue; }
    const midi = open[string - 1] + fret;
    const tone = chord.tones.find(t => t.pitch === mod(midi))
      ?? (chord.bass === mod(midi) ? { semitones: mod(midi - chord.root), pitch: mod(midi), label: genericDegree(midi - chord.root), role: 'color' as const } : undefined);
    if (!tone) return undefined;
    notes.push({ string, fret, finger: fret === 0 ? 0 : fingers[i], midi, tone });
  }
  // The barre is the finger laid across two or more strings, the first finger when it is one of them.
  const byFinger = new Map<number, GripNote[]>();
  for (const n of notes) if (n.finger) byFinger.set(n.finger, [...(byFinger.get(n.finger) ?? []), n]);
  const laid = [...byFinger].filter(([, held]) => held.length > 1).sort(([a], [b]) => a - b)[0]?.[1];
  const barre = laid && { fret: laid[0].fret, from: laid[0].string, to: laid.at(-1)!.string };
  const bass = notes.reduce((low, n) => n.midi < low.midi ? n : low, notes[0]);
  return { ...meta, inversion: !!bass && mod(bass.midi) !== chord.root, notes, muted, ...(barre ? { barre } : {}) };
}

/** What a hand can hold: three strings or more, a finger per fretted string, four fingers each on one fret, five frets of reach. */
function playable(grip: Grip) {
  if (grip.notes.length < 3 || grip.notes.some(n => (n.fret === 0) !== (n.finger === 0))) return false;
  const held = new Map<number, Set<number>>();
  for (const n of grip.notes) if (n.fret > 0) held.set(n.finger, (held.get(n.finger) ?? new Set()).add(n.fret));
  if ([...held.keys()].some(f => f < 1 || f > 4) || [...held.values()].some(frets => frets.size > 1)) return false;
  const frets = grip.notes.filter(n => n.fret > 0).map(n => n.fret);
  if (frets.length && Math.max(...frets) - Math.min(...frets) > 4) return false;
  const { barre } = grip;
  return !barre || grip.notes.every(n => n.string > barre.from || n.string < barre.to || n.fret >= barre.fret);
}

type BookPosition = (typeof book.chords)[string][number]['positions'][number];
const bookFrets = (p: BookPosition): Frets => p.frets.map(f => f < 0 ? null : f === 0 ? 0 : f + p.baseFret - 1);
const bookEntry = (root: number, suffix: string) => book.chords[BOOK_KEYS[root]]?.find(c => c.suffix === suffix)?.positions ?? [];

// The chord book is for standard tuning. A slash chord takes the book's grips with that bass first, then the chord's own.
function bookGrips(chord: Chord, neck: Neck): Grip[] {
  const suffix = BOOK_SUFFIX[chord.kind];
  if (!suffix || neck.lowest !== 0) return [];
  const slash = chord.bass !== undefined && (chord.kind === '' || chord.kind === 'm') ? bookEntry(chord.root, `${chord.kind}/${BOOK_BASS[chord.bass]}`) : [];
  return [...slash, ...bookEntry(chord.root, suffix)].flatMap((p, rank) => {
    const grip = build(bookFrets(p), p.fingers, chord, STANDARD, { source: 'book', rank, rating: 'common' });
    return grip && playable(grip) && grip.notes.every(n => n.fret <= neck.frets) ? [grip] : [];
  });
}

function cagedGrips(chord: Chord, neck: Neck): Grip[] {
  const kind = CAGED_KIND[chord.kind];
  if (!kind) return [];
  const open = tuningFor(neck.lowest, false).midi;
  return TEMPLATES.filter(t => t.kind === kind).flatMap(template => {
    const root = SHAPE_ROOT[template.shape];
    const grips: Grip[] = [];
    for (let offset = mod(chord.root - open[root.string - 1] - root.fret); ; offset += 12) {
      const form = offset === 0 ? template.open : template.moved;
      if (!form) continue;
      if (Math.max(...form.frets.map(f => f ?? 0)) + offset > neck.frets) break;
      const rating = form === template.open ? template.openRating ?? 'common' : template.rating;
      const grip = build(form.frets.map(f => f === null ? null : f + offset), form.fingers.map((f, i) => form.frets[i] === null ? 0 : f), chord, open,
        { source: 'caged', rank: Infinity, shape: template.shape, rating });
      if (grip) grips.push(grip);
    }
    return grips;
  });
}

const lowest = (grip: Grip) => Math.min(...grip.notes.map(n => n.fret));
const chart = (grip: Grip) => chartOf([6, 5, 4, 3, 2, 1].map(s => grip.notes.find(n => n.string === s)?.fret ?? null));

/**
 * Every grip for the chord on this neck, low to high: the chord book's, and the CAGED shapes in every position. A CAGED shape
 * the book also prints is kept once, as the book's grip, named by its shape. None for a fourths tuning.
 */
export function gripsFor(chord: Chord, neck: Neck): Grip[] {
  if (neck.fourths) return [];
  const booked = bookGrips(chord, neck);
  const caged = cagedGrips(chord, neck).filter(grip => {
    const same = booked.find(b => chart(b) === chart(grip));
    if (same) Object.assign(same, { shape: grip.shape, rating: grip.rating });
    return !same;
  });
  return [...booked, ...caged].sort((a, b) => lowest(a) - lowest(b) || a.rank - b.rank);
}

/** The grip a guitarist strums for the chord: the chord book's first choice, or the lowest common CAGED shape without one. */
export function commonGrip(chord: Chord, neck: Neck): Grip | undefined {
  const grips = gripsFor(chord, neck);
  return grips.filter(g => g.source === 'book').sort((a, b) => a.rank - b.rank)[0] ?? grips.find(g => g.rating === 'common') ?? grips[0];
}

/**
 * The grip the hand finds in a form: fewest notes outside it, then a common grip over a hard one, the root in the bass,
 * the chord book's earlier choices, and the nearest.
 */
export function gripInForm(chord: Chord, study: Study, neck: Neck): Grip | undefined {
  const cost = (grip: Grip) => grip.notes.filter(n => !inStudy(n.string, n.fret, study)).length * 10
    + (grip.rating === 'hard' ? 3 : 0) + (grip.inversion ? 2 : 0) + (grip.source === 'book' ? grip.rank * .5 : 1)
    + Math.abs(lowest(grip) - study.anchor) * .1;
  return gripsFor(chord, neck).reduce<Grip | undefined>((best, grip) => !best || cost(grip) < cost(best) ? grip : best, undefined);
}

/** A grip strummed down: low string first, each string a moment after the one above it. */
export const strum = (grip: Grip, at: number) =>
  [...grip.notes].sort((a, b) => b.string - a.string).map((n, i) => ({ midi: n.midi, at: at + i * .022 }));

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
/** How much of the chord book survives the hand checks, for the chord types read here. Grips dropped are named. */
export function bookCoverage() {
  let offered = 0, kept = 0;
  const dropped: string[] = [];
  for (const [root, name] of NAMES.entries()) for (const [kind, suffix] of Object.entries(BOOK_SUFFIX)) {
    const chord = parseChord(name + kind)!;
    for (const p of bookEntry(root, suffix)) {
      offered++;
      const grip = build(bookFrets(p), p.fingers, chord, STANDARD, { source: 'book', rank: 0, rating: 'common' });
      if (grip && playable(grip)) kept++; else dropped.push(`${chord.symbol} ${chartOf(bookFrets(p))}`);
    }
  }
  return { offered, kept, dropped };
}
