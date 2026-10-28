import { useEffect, useRef, useState } from 'react';
import { describeNote, position, scaleById } from '../core/music';
import { nextDrill, tapResult } from '../core/drill';
import type { Drill } from '../core/drill';
import type { State } from '../core/state';
import { tuningOf } from '../core/study';
import type { Study } from '../core/study';
import { pluck, thud } from './audio';
import { Icon } from './controls';

const BEST_KEY = 'fret-atlas-best-streak';
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };

export interface DrillView { drill: Drill; found: string[]; miss: string | null; complete: boolean }

/** Runs "find every X" rounds against the current view. A new round starts whenever the view it depends on changes. */
export function useDrill(state: State, study: Study | undefined, active: boolean, sound: boolean, onRound?: (drill: Drill) => void) {
  const [drill, setDrill] = useState<Drill>();
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(readBest);
  const [rounds, setRounds] = useState(0);
  const [feedback, setFeedback] = useState('');
  const started = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const tuning = tuningOf(state);
  const context = JSON.stringify([state.root, state.scaleId, state.customPitches, state.spelling, state.frets, state.lowest, state.fourths, state.strings, state.focus, state.from, state.to, state.studyMode, study?.id]);

  function begin(previous?: string) {
    clearTimers();
    setDrill(nextDrill(state, study, previous));
    setFound([]);
    setMiss(null);
    started.current = performance.now();
  }

  useEffect(() => {
    if (active) { begin(); setFeedback(''); }
    else { clearTimers(); setDrill(undefined); }
    // Starting over on every relevant view change keeps the answers honest.
  }, [active, context]);
  useEffect(() => clearTimers, []);

  function tap(id: string) {
    if (!drill || found.length === drill.targets.length) return;
    const [string, fret] = id.split(':').map(Number);
    const note = position(string, fret, tuning);
    const result = tapResult(drill, found, id);
    if (result === 'repeat') { if (sound) pluck(note.midi, 0, .5); return; }
    if (result === 'miss') {
      if (sound) thud();
      setStreak(0);
      setMiss(id);
      later(() => setMiss(current => current === id ? null : current), 650);
      setFeedback(`That's ${describeNote(note, state.root, scaleById(state.scaleId), state.spelling).name}. Keep looking for ${drill.name}.`);
      return;
    }
    const next = [...found, id];
    const nextStreak = streak + 1;
    const record = nextStreak > best;
    setFound(next);
    setStreak(nextStreak);
    if (record) {
      setBest(nextStreak);
      try { localStorage.setItem(BEST_KEY, String(nextStreak)); } catch { /* The record is optional. */ }
    }
    if (next.length < drill.targets.length) {
      if (sound) pluck(note.midi);
      setFeedback(`${next.length} of ${drill.targets.length}`);
      return;
    }
    // Round complete: play every answer low to high, then deal the next prompt.
    const seconds = ((performance.now() - started.current) / 1000).toFixed(1);
    if (sound) next.map(n => position(...(n.split(':').map(Number) as [number, number]), tuning).midi).sort((a, b) => a - b).forEach((midi, i) => pluck(midi, i * .09, .8));
    setRounds(r => r + 1);
    onRound?.(drill);
    setFeedback(`All ${drill.targets.length} in ${seconds}s${record && nextStreak > 1 ? ' · New best streak!' : ''}`);
    later(() => begin(drill.key), 1300);
  }

  const view: DrillView | undefined = active && drill ? { drill, found, miss, complete: found.length === drill.targets.length } : undefined;
  return { view, tap, skip: () => { setStreak(0); begin(drill?.key); setFeedback('Skipped'); }, streak, best, rounds, feedback };
}

export function DrillBar({ session, onEnd }: { session: ReturnType<typeof useDrill>; onEnd: () => void }) {
  const { view, streak, best, rounds, feedback, skip } = session;
  if (!view) return <section className="drill-bar" aria-label="Practice drill"><p className="drill-empty">No notes to find in this view. Try a different scale or clear the focus.</p><button className="text-button" onClick={onEnd}>Done</button></section>;
  const { drill, found, complete } = view;
  return <section className={`drill-bar ${complete ? 'is-complete' : ''}`} aria-label="Practice drill">
    <div className="drill-prompt">
      <span className="drill-eyebrow">Find every</span>
      <strong>{drill.name}</strong>
      {drill.degree && <em title="Scale degree">{drill.degree}</em>}
      <span className="drill-where">{drill.where}</span>
    </div>
    <div className="drill-progress" role="img" aria-label={`${found.length} of ${drill.targets.length} found`}>
      {drill.targets.map((_, i) => <i key={i} className={i < found.length ? 'done' : ''} />)}
    </div>
    <div className="drill-stats">
      <span className={`drill-streak ${streak > 0 ? 'is-hot' : ''}`} title="Correct taps in a row"><Icon name="flame" /><b key={streak}>{streak}</b></span>
      <span>Best {best}</span>
      <span>{rounds} {rounds === 1 ? 'round' : 'rounds'}</span>
    </div>
    <div className="drill-actions">
      <button className="text-button" onClick={skip}>Skip</button>
      <button className="text-button" onClick={onEnd}>Done</button>
    </div>
    <p className="drill-feedback" role="status" aria-live="polite">{feedback || 'Tap the fretboard. Notes stay hidden until you find them.'}</p>
  </section>;
}
