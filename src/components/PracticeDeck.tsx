import type { Dispatch } from 'react';
import { degreeLabel, pitchName, SHARPS, spellTone } from '../core/music';
import type { Scale } from '../core/music';
import { practicedForms } from '../core/progress';
import type { Family, Progress } from '../core/progress';
import type { Action, State } from '../core/state';
import { selectedPitches } from '../core/state';
import type { DrillRequest } from '../core/drill';
import type { Study } from '../core/study';
import { Icon } from './controls';
import { ProgressPanel } from './Progress';

type Chord = { root: number; kind: 'major' | 'minor' };

/**
 * The Practice tab: every drill, play-through credit and progress in one place, so the atlas in
 * Explore stays complete without it. Each drill practices the view chosen above the board.
 */
export function PracticeDeck({ state, dispatch, scale, study, family, progress, onClearProgress, chord, onChord, degrees, onDegrees, playing, onFindNotes, onFind, onPlayThrough }: {
  state: State; dispatch: Dispatch<Action>; scale: Scale; study: Study | undefined; family: Family | undefined; progress: Progress; onClearProgress: () => void;
  chord: Chord; onChord: (next: Partial<Chord>) => void; degrees: number[]; onDegrees: (intervals: number[]) => void; playing: boolean;
  onFindNotes: () => void; onFind: (request: DrillRequest, trigger: string) => void; onPlayThrough: () => void;
}) {
  const custom = state.scaleId === 'custom';
  const tones = custom
    ? [...new Set(selectedPitches(state))].sort((a, b) => a - b).map(pitch => ({ pitch, name: pitchName(pitch, state.spelling), label: '' }))
    : scale.tones.map(t => ({ pitch: (state.root + t.semitones) % 12, name: spellTone(state.root, state.spelling, t).name, label: degreeLabel(t) }));
  // Degrees are kept as intervals from the root, so a new key keeps the same choice.
  const interval = (pitch: number) => (pitch - state.root + 12) % 12;
  const chosen = tones.filter(t => degrees.includes(interval(t.pitch)));
  const where = study ? `${study.label}` : 'the visible neck';
  const canPlayThrough = !!family && state.studyMode === 'position' && !!study;

  return <section className="practice-deck" aria-label="Practice">
    <p className="deck-context">Practicing <strong>{pitchName(state.root, state.spelling)} {scale.name}</strong> in <strong>{where}</strong>. Change the view above the board.</p>
    <div className="practice-options">
      <article className="practice-option">
        <h3>Find notes</h3>
        <p>One note at a time, everywhere it appears on a string or in this form.</p>
        <button id="find-notes" className="start-button" onClick={onFindNotes}><Icon name="target" />Start</button>
      </article>
      <article className="practice-option">
        <h3>Find scale degrees</h3>
        <div className="degree-picks" role="group" aria-label="Degrees to find">{tones.map(t => <button key={t.pitch} type="button" aria-pressed={degrees.includes(interval(t.pitch))} onClick={() => onDegrees(degrees.includes(interval(t.pitch)) ? degrees.filter(d => d !== interval(t.pitch)) : [...degrees, interval(t.pitch)])}>
          <strong>{t.name}</strong>{t.label && <span>{t.label}</span>}
        </button>)}</div>
        <button id="find-degrees" className="start-button" disabled={!chosen.length} onClick={() => onFind({ pitches: chosen.map(t => t.pitch), label: 'selected degrees' }, 'find-degrees')}><Icon name="target" />Start</button>
      </article>
      <article className="practice-option">
        <h3>Find chord tones</h3>
        <p>The root, third and fifth of any chord, in or out of the scale.</p>
        <div className="chord-sentence">
          <select aria-label="Chord root" value={chord.root} onChange={e => onChord({ root: Number(e.target.value) })}>{SHARPS.map((_, i) => <option value={i} key={i}>{pitchName(i, state.spelling)}</option>)}</select>
          <select aria-label="Chord quality" value={chord.kind} onChange={e => onChord({ kind: e.target.value as Chord['kind'] })}><option value="minor">minor</option><option value="major">major</option></select>
        </div>
        <button id="find-chord" className="start-button" onClick={() => onFind({ pitches: [0, chord.kind === 'major' ? 4 : 3, 7].map(n => (chord.root + n) % 12), label: `${pitchName(chord.root, state.spelling)} ${chord.kind} chord` }, 'find-chord')}><Icon name="target" />Start</button>
      </article>
      <article className="practice-option">
        <h3>Play through</h3>
        <p>{canPlayThrough ? 'Hear this form up and back. Finishing it counts as practiced.' : 'Choose a Position form on a pentatonic scale to play it through for credit.'}</p>
        <button className="start-button" aria-pressed={playing} disabled={!canPlayThrough} onClick={onPlayThrough}><Icon name={playing ? 'stop' : 'play'} />{playing ? 'Stop' : 'Play through'}</button>
      </article>
    </div>
    {family && <section className="deck-progress" aria-label="Progress">
      <h3>Progress <span>{practicedForms(progress, family, state.root)} of 5 forms practiced in {pitchName(state.root, state.spelling)} {family}</span></h3>
      <ProgressPanel progress={progress} family={family} root={state.root} spelling={state.spelling} onKey={value => dispatch({ type: 'root', value })} onClear={onClearProgress} />
    </section>}
  </section>;
}
