import { useEffect, useRef, useState } from 'react';
import { describeNote, position, scaleById } from '../core/music';
import { nextDrill } from '../core/drill';
import type { Drill, DrillRequest } from '../core/drill';
import { transitionDrill, initialDrillSession } from '../core/drill-session';
import type { DrillEvent } from '../core/drill-session';
import type { State } from '../core/state';
import { tuningOf } from '../core/study';
import type { Study } from '../core/study';
import { pluck, thud } from './audio';
import { Icon } from './controls';

const BEST_KEY = 'fret-atlas-best-streak';
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };

export interface DrillView { drill: Drill; found: string[]; miss: string | null; complete: boolean; hint?: string; revealed: boolean }

/** Runs "find every X" rounds against the current view. A new round starts whenever the view it depends on changes. */
export function useDrill(state: State, study: Study | undefined, active: boolean, sound: boolean, onRound?: (drill: Drill) => void, request?: DrillRequest) {
  const [session, setSession] = useState(() => initialDrillSession(readBest()));
  const sessionRef = useRef(session);
  const { phase, streak, best, rounds, feedback } = session;
  const started = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const tuning = tuningOf(state);
  const context = JSON.stringify([state.root, state.scaleId, state.customPitches, state.spelling, state.frets, state.lowest, state.fourths, state.strings, state.focus, state.from, state.to, state.studyMode, study?.id, request]);

  function send(event: DrillEvent) {
    const transition = transitionDrill(sessionRef.current, event);
    sessionRef.current = transition.state;
    setSession(transition.state);
    for (const effect of transition.effects) {
      const midi = (id: string) => position(...(id.split(':').map(Number) as [number, number]), tuning).midi;
      if (effect.kind === 'record') {
        try { localStorage.setItem(BEST_KEY, String(effect.best)); } catch { /* The record is optional. */ }
      } else if (effect.kind === 'miss') {
        if (sound) thud();
        later(() => send({ type: 'clear-miss', id: effect.id }), 650);
      } else if (effect.kind === 'repeat') { if (sound) pluck(midi(effect.id), 0, .5); }
      else if (effect.kind === 'hit') { if (sound) pluck(midi(effect.id)); }
      else if (effect.kind === 'complete') {
        if (sound) effect.found.map(midi).sort((a, b) => a - b).forEach((note, i) => pluck(note, i * .09, .8));
        if (effect.credit) onRound?.(effect.drill);
        later(() => begin(effect.drill.key), 1300);
      }
    }
  }
  function begin(previous?: string, feedback?: string, resetStreak = false) {
    clearTimers();
    send({ type: 'begin', drill: nextDrill(state, study, previous, Math.random, request), feedback, resetStreak });
    started.current = performance.now();
  }

  useEffect(() => {
    if (active) begin(undefined, '');
    else { clearTimers(); send({ type: 'stop' }); }
    return clearTimers;
  }, [active, context]);

  function tap(id: string) {
    const current = sessionRef.current.phase;
    if (current.kind !== 'finding') return;
    const note = position(...(id.split(':').map(Number) as [number, number]), tuning);
    send({ type: 'tap', id, seconds: ((performance.now() - started.current) / 1000).toFixed(1), missFeedback: `That's ${describeNote(note, state.root, scaleById(state.scaleId), state.spelling).name}. Keep looking for ${current.drill.name}.` });
  }

  const view: DrillView | undefined = active && (phase.kind === 'finding' || phase.kind === 'complete' || phase.kind === 'revealed')
    ? { drill: phase.drill, found: phase.found, miss: phase.miss, complete: phase.kind === 'complete', hint: phase.hint, revealed: phase.kind === 'revealed' } : undefined;
  const skip = () => { const current = sessionRef.current.phase; begin('drill' in current ? current.drill.key : undefined, 'Next prompt', true); };
  const showHint = () => send({ type: 'hint' });
  const reveal = () => send({ type: 'reveal' });
  return { view, tap, skip, hint: showHint, reveal, streak, best, rounds, feedback };
}

export function DrillBar({ session, onEnd }: { session: ReturnType<typeof useDrill>; onEnd: () => void }) {
  const { view, streak, best, rounds, feedback, skip, hint, reveal } = session;
  if (!view) return <section className="drill-bar" aria-label="Practice drill"><p className="drill-empty">No notes to find in this view. Try a different scale or clear the focus.</p><button className="text-button" onClick={onEnd}>End</button></section>;
  const { drill, found, complete } = view;
  return <section className={`drill-bar ${complete ? 'is-complete' : ''}`} aria-label="Practice drill">
    <div className="drill-prompt">
      <span className="drill-eyebrow">Find every</span>
      <strong>{drill.name}</strong>
      {drill.degree && <em title="Scale degree">{drill.degree}</em>}
      <span className="drill-where">{drill.where}</span>
      {drill.group && <span className="drill-where">· {drill.group}</span>}
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
      <button className="text-button" onClick={hint} disabled={view.revealed}>Hint</button>
      <button className="text-button" onClick={reveal} disabled={view.revealed}>Reveal</button>
      <button className="text-button" onClick={skip}>Next</button>
      <button className="text-button" onClick={onEnd}>End</button>
    </div>
    <p className="drill-feedback" role="status" aria-live="polite">{feedback || 'Tap the fretboard. Notes stay hidden until you find them.'}</p>
  </section>;
}
