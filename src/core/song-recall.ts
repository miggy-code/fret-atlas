// Playing a stretch of a melody back from memory, one note at a time, in order. Pure: the hook around it owns sound and timers.
import type { SongNote } from './song';

/**
 * `at` is the note wanted next. `hinted` rings it on the board: the first note is given, and a note missed twice is
 * given too. `slips` lists the notes that took a miss or a hint, so what is left was played clean.
 */
export type Recall = { from: number; to: number; at: number; hinted: boolean; miss: string | null; misses: number; slips: number[]; done: boolean };
export type TapResult = 'hit' | 'elsewhere' | 'miss' | 'ignored';

const HINT_AFTER = 2;

export const startRecall = (from: number, to: number): Recall => ({ from, to, at: from, hinted: true, miss: null, misses: 0, slips: [], done: false });
const slipped = (recall: Recall) => recall.slips.includes(recall.at) ? recall.slips : [...recall.slips, recall.at];

/**
 * A tap on the board. The wanted place is a hit. The wanted pitch on another string is `elsewhere`: the right note,
 * but not where this route plays it, so it neither moves on nor counts against the player. Anything else is a miss.
 */
export function recallTap(recall: Recall, notes: readonly SongNote[], id: string, midi: number): { recall: Recall; result: TapResult } {
  const wanted = notes[recall.at];
  if (recall.done || !wanted || recall.at > recall.to) return { recall, result: 'ignored' };
  if (id === wanted.id) {
    const done = recall.at === recall.to;
    return { recall: { ...recall, at: recall.at + 1, hinted: false, miss: null, misses: 0, done }, result: 'hit' };
  }
  if (midi === wanted.midi) return { recall, result: 'elsewhere' };
  const misses = recall.misses + 1;
  return { recall: { ...recall, miss: id, misses, hinted: recall.hinted || misses >= HINT_AFTER, slips: slipped(recall) }, result: 'miss' };
}

/** Rings the wanted note. Asking costs a slip, unless the note was already given. */
export const recallHint = (recall: Recall): Recall => recall.done || recall.hinted ? recall : { ...recall, hinted: true, slips: slipped(recall) };
export const clearMiss = (recall: Recall): Recall => recall.miss === null ? recall : { ...recall, miss: null };
/** How many of the notes were played without a miss or a hint. */
export const recallClean = (recall: Recall) => recall.to - recall.from + 1 - recall.slips.length;
