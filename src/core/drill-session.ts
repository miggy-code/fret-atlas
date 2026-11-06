import { tapResult } from './drill';
import type { Drill } from './drill';

type Round = { drill: Drill; found: string[]; miss: string | null; hint?: string; assisted: boolean };
export type DrillPhase = { kind: 'inactive' | 'empty' } | ({ kind: 'finding' | 'complete' | 'revealed' } & Round);
export interface DrillSession { phase: DrillPhase; streak: number; best: number; rounds: number; feedback: string }
export type DrillEvent =
  | { type: 'begin'; drill?: Drill; feedback?: string; resetStreak?: boolean }
  | { type: 'stop' }
  | { type: 'tap'; id: string; missFeedback: string; seconds: string }
  | { type: 'clear-miss'; id: string }
  | { type: 'hint' }
  | { type: 'reveal' };

export const initialDrillSession = (best: number): DrillSession => ({ phase: { kind: 'inactive' }, streak: 0, best, rounds: 0, feedback: '' });

export function drillSessionReducer(state: DrillSession, event: DrillEvent): DrillSession {
  const phase = state.phase;
  switch (event.type) {
    case 'begin': return { ...state, streak: event.resetStreak ? 0 : state.streak, feedback: event.feedback ?? state.feedback,
      phase: event.drill ? { kind: 'finding', drill: event.drill, found: [], miss: null, assisted: false } : { kind: 'empty' } };
    case 'stop': return { ...state, phase: { kind: 'inactive' } };
    case 'clear-miss': return phase.kind === 'finding' && phase.miss === event.id ? { ...state, phase: { ...phase, miss: null } } : state;
    case 'hint': {
      if (phase.kind !== 'finding') return state;
      const hint = phase.drill.targets.find(id => !phase.found.includes(id));
      return hint ? { ...state, phase: { ...phase, hint, assisted: true }, feedback: 'One answer is highlighted. Assisted rounds do not count toward form progress.' } : state;
    }
    case 'reveal':
      return phase.kind === 'finding' ? { ...state, phase: { ...phase, kind: 'revealed', assisted: true }, feedback: 'Answers revealed. Assisted rounds do not count toward form progress. Choose Next when you are ready.' } : state;
    case 'tap': {
      if (phase.kind !== 'finding') return state;
      const result = tapResult(phase.drill, phase.found, event.id);
      if (result === 'repeat') return state;
      if (result === 'miss') return { ...state, streak: 0, phase: { ...phase, miss: event.id }, feedback: event.missFeedback };
      const found = [...phase.found, event.id];
      const streak = state.streak + 1;
      const record = streak > state.best;
      const complete = found.length === phase.drill.targets.length;
      return { ...state, streak, best: Math.max(state.best, streak), rounds: state.rounds + (complete ? 1 : 0),
        phase: { ...phase, found, kind: complete ? 'complete' : 'finding' },
        feedback: complete ? `All ${found.length} in ${event.seconds}s${record && streak > 1 ? ' · New best streak!' : ''}` : `${found.length} of ${phase.drill.targets.length}` };
    }
  }
}

export type DrillEffect =
  | { kind: 'repeat'; id: string }
  | { kind: 'miss'; id: string }
  | { kind: 'hit'; id: string }
  | { kind: 'record'; best: number }
  | { kind: 'complete'; drill: Drill; found: string[]; credit: boolean };

/** Effects are decided from the same transition that accepts or rejects the event. */
export function transitionDrill(state: DrillSession, event: DrillEvent): { state: DrillSession; effects: DrillEffect[] } {
  const next = drillSessionReducer(state, event);
  const effects: DrillEffect[] = [];
  if (event.type !== 'tap' || state.phase.kind !== 'finding') return { state: next, effects };
  const result = tapResult(state.phase.drill, state.phase.found, event.id);
  if (result === 'repeat') effects.push({ kind: 'repeat', id: event.id });
  else if (result === 'miss') effects.push({ kind: 'miss', id: event.id });
  else {
    if (next.best > state.best) effects.push({ kind: 'record', best: next.best });
    if (next.phase.kind === 'complete') effects.push({ kind: 'complete', drill: next.phase.drill, found: next.phase.found, credit: !next.phase.assisted });
    else effects.push({ kind: 'hit', id: event.id });
  }
  return { state: next, effects };
}
