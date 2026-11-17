import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAbc } from '../src/core/abc';
import { songPath } from '../src/core/song';
import { recallClean, recallHint, recallTap, startRecall } from '../src/core/song-recall';

const neck = { frets: 12, lowest: 0, fourths: false };
const path = songPath(parseAbc('X:1\nT:Test\nM:4/4\nL:1/4\nK:Am\nA, C D E G A'), neck, { octave: 0, scaleId: 'minor-pentatonic' });
const notes = path.notes;
const hit = (recall: ReturnType<typeof startRecall>) => recallTap(recall, notes, notes[recall.at].id, notes[recall.at].midi);
// A place on the neck that is not the wanted note and does not sound its pitch.
const wrongId = '1:1';
const wrong = (recall: ReturnType<typeof startRecall>) => recallTap(recall, notes, wrongId, 65);

test('a recall starts on its first note, which is given, and moves on with each right note', () => {
  let recall = startRecall(1, 3);
  assert.deepEqual(recall, { from: 1, to: 3, at: 1, hinted: true, miss: null, misses: 0, slips: [], done: false });
  const first = hit(recall);
  assert.equal(first.result, 'hit');
  recall = first.recall;
  assert.equal(recall.at, 2);
  assert.equal(recall.hinted, false, 'the notes after the first are hidden');
  recall = hit(hit(recall).recall).recall;
  assert.equal(recall.done, true);
  assert.equal(recallClean(recall), 3);
  assert.equal(hit({ ...recall, at: 3 }).result, 'ignored', 'nothing is wanted once the phrase is done');
});

test('a wrong note is a slip; two on the same note ring it; the count of clean notes drops by one', () => {
  let recall = hit(startRecall(0, 2)).recall;
  const once = wrong(recall);
  assert.equal(once.result, 'miss');
  assert.equal(once.recall.miss, wrongId);
  assert.equal(once.recall.hinted, false);
  assert.equal(once.recall.at, 1, 'a miss does not move on');
  const twice = wrong(once.recall);
  assert.equal(twice.recall.hinted, true);
  assert.deepEqual(twice.recall.slips, [1]);
  recall = hit(hit(twice.recall).recall).recall;
  assert.equal(recall.done, true);
  assert.equal(recallClean(recall), 2);
});

test('the right pitch on another string is told apart from a miss and costs nothing', () => {
  const recall = hit(startRecall(0, 2)).recall;
  const wanted = notes[1];
  // The same pitch five frets up the next lower string.
  const elsewhere = recallTap(recall, notes, `${wanted.string + 1}:${wanted.fret + 5}`, wanted.midi);
  assert.equal(elsewhere.result, 'elsewhere');
  assert.deepEqual(elsewhere.recall, recall);
});

test('asking for a hint rings the note and counts as a slip, once', () => {
  const recall = hit(startRecall(0, 2)).recall;
  const hinted = recallHint(recallHint(recall));
  assert.equal(hinted.hinted, true);
  assert.deepEqual(hinted.slips, [1]);
  assert.deepEqual(recallHint(startRecall(0, 2)).slips, [], 'the first note is already given');
});
