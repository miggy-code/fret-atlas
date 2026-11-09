import type { Dispatch } from 'react';
import { pitchName, SCALES, SHARPS } from '../core/music';
import type { Scale } from '../core/music';
import { selectedPitches } from '../core/state';
import type { Action, State } from '../core/state';
import type { Study, StudyMode } from '../core/study';
import type { ShapeKind } from '../core/shapes';
import { Icon, Segments } from './controls';

const scaleOptions = SCALES.filter(scale => !scale.id.endsWith('-triad'));
const scaleGroups = [...new Set(scaleOptions.map(s => s.group))];

interface StudyControlsProps {
  state: State;
  dispatch: Dispatch<Action>;
  scale: Scale;
  study: Study | undefined;
  choiceCount: number;
  // Practice shows each form's progress on the picker; Explore passes nothing.
  formLevel?: (form: number) => number;
  playing: boolean;
  onPlay?: () => void;
  connected: boolean;
  onConnect: () => void;
}

/** Key, scale and study view, then the form bar that steps through what that view offers. */
export function StudyControls(props: StudyControlsProps) {
  return <section className="study-controls" aria-label="Study controls">
    <StudyPicker {...props} />
    <div className="form-bar">
      <FormNavigation {...props} withPlay />
      <StudyOptions {...props} />
    </div>
  </section>;
}

/** Key, scale and study view. A phone shows these above the board and the rest elsewhere. */
export function StudyPicker({ state, dispatch, scale }: Pick<StudyControlsProps, 'state' | 'dispatch' | 'scale'>) {
  const pitches = selectedPitches(state);
  const custom = state.scaleId === 'custom';
  const familyHint = scale.family ? undefined : 'Requires a pentatonic pattern family';
  const sevenNotes = new Set(pitches).size === 7;
  const views: { value: StudyMode; label: string; disabled?: boolean; hint?: string }[] = [
    { value: 'position', label: 'Position', disabled: custom, hint: custom ? 'Choose a named scale' : undefined },
    { value: 'shape', label: 'Shape', disabled: !scale.family, hint: familyHint },
    { value: 'diagonal', label: 'Diagonal', disabled: !scale.family, hint: familyHint },
    { value: 'all', label: 'Whole neck' },
    { value: 'string', label: 'One string', disabled: !pitches.length },
    { value: 'nps', label: '3 notes/string', disabled: !sevenNotes, hint: sevenNotes ? undefined : 'Requires a seven-note scale' },
  ];
  return <>
    <div className="study-primary">
      <div className="musical-controls">
        <label className="field key-field"><span>{custom ? 'Reference' : 'Key'}</span>
          <select id="root" value={state.root} onChange={e => dispatch({ type: 'root', value: Number(e.target.value) })}>
            {SHARPS.map((_, i) => <option key={i} value={i}>{pitchName(i, state.spelling)}</option>)}
          </select>
        </label>
        <label className="field scale-field"><span>Scale</span>
          <select id="scale" value={state.scaleId} onChange={e => dispatch({ type: 'scale', value: e.target.value })}>
            {scaleGroups.map(group => <optgroup key={group} label={group === 'Triads & custom' ? 'Custom' : group}>
              {scaleOptions.filter(s => s.group === group).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>)}
          </select>
        </label>
      </div>
      <Segments<StudyMode> label="Study view" value={state.studyMode} options={views} onChange={value => dispatch({ type: 'study-mode', value })} />
    </div>
    {!scale.family && <p className="study-availability">
      Shape and Diagonal need a scale built on a pentatonic.{!custom && ' Position shows a nearby fret range.'}
    </p>}
  </>;
}

const hasForms = (study: Study | undefined, state: State) => !!study || state.studyMode === 'all';

/** The form stepper, and Play where the page keeps it beside the stepper. */
export function FormNavigation({ state, dispatch, scale, study, choiceCount, formLevel, playing, onPlay, withPlay }: StudyControlsProps & { withPlay?: boolean }) {
  if (!hasForms(study, state)) return null;
  return <div className="form-navigation">
    {state.studyMode !== 'all' && study
      && <FormStepper state={state} dispatch={dispatch} scale={scale} study={study} choiceCount={choiceCount} formLevel={formLevel} />}
    {withPlay && <PlayButton playing={playing} onPlay={onPlay} />}
  </div>;
}

/** The form bar on a phone: only the stepper, attached to the board. */
export function FormBar(props: StudyControlsProps) {
  return <div className="form-bar"><FormNavigation {...props} /></div>;
}

// In Practice, Play through owns playback, so Explore alone passes onPlay.
function PlayButton({ playing, onPlay }: Pick<StudyControlsProps, 'playing' | 'onPlay'>) {
  if (!onPlay) return null;
  return <button type="button" className={`play-button ${playing ? 'is-playing' : ''}`} aria-pressed={playing} onClick={onPlay}>
    <Icon name={playing ? 'stop' : 'play'} />{playing ? 'Stop' : 'Play'}
  </button>;
}

/** Pattern choices, Connect positions and neck length, beside the form stepper. */
export function StudyOptions({ state, dispatch, scale, connected, onConnect, playing, onPlay, withPlay }: StudyControlsProps & { withPlay?: boolean }) {
  const visibleFamilies = state.patterns.length === 2 ? 'both' : state.patterns[0] ?? 'both';
  return <>
    {withPlay && <PlayButton playing={playing} onPlay={onPlay} />}
    {/* The one place to choose rectangles or stacks: a filter in Position and Whole neck, the studied family in Shape and Diagonal. */}
    {scale.family && ['position', 'all'].includes(state.studyMode) && <Segments<'both' | ShapeKind> label="Pattern families" value={visibleFamilies} options={[
      { value: 'both', label: 'Both' },
      { value: 'rectangle', label: <><i className="shape-icon" />Rectangles</> },
      { value: 'stack', label: <><i className="shape-icon stack" />Stacks</> },
    ]} onChange={value => dispatch({ type: 'patterns', value: value === 'both' ? ['rectangle', 'stack'] : [value] })} />}
    {scale.family && ['shape', 'diagonal'].includes(state.studyMode) && <Segments<ShapeKind> label="Shape family" value={state.shapeKind} options={[
      { value: 'rectangle', label: <><i className="shape-icon" />Rectangle</> },
      { value: 'stack', label: <><i className="shape-icon stack" />Stack</> },
    ]} onChange={value => dispatch({ type: 'shape-kind', value })} />}
    {scale.family && <button type="button" className="connect-button" aria-pressed={connected} onClick={onConnect}
      title="Outline the neighboring forms to see how they connect">Connect positions</button>}
    <label className="neck-length"><span>Neck</span>
      <select aria-label="Neck length" value={state.frets} onChange={e => dispatch({ type: 'frets', value: Number(e.target.value) })}>
        {[12, 15, 17, 22, 24].map(f => <option key={f} value={f}>{f} frets</option>)}
      </select>
    </label>
    {state.studyMode === 'all' && scale.family && <span className="form-hint">Hover a note to highlight its shapes</span>}
  </>;
}

/** The same choices on a phone, with Play, in a block below the board. */
export function StudyOptionsBar(props: StudyControlsProps) {
  return hasForms(props.study, props.state) ? <div className="study-options"><StudyOptions {...props} withPlay /></div> : null;
}

type StepperProps = Pick<StudyControlsProps, 'state' | 'dispatch' | 'scale' | 'choiceCount' | 'formLevel'> & { study: Study };

/** ‹ 1 2 3 4 5 › with the fret range beside it, or ‹ label › where the view has no numbered forms. */
function FormStepper({ state, dispatch, scale, study, choiceCount, formLevel }: StepperProps) {
  const left = Math.max(0, Math.min(...study.rows.map(r => r.left)));
  const right = Math.min(state.frets, Math.max(...study.rows.map(r => r.right)));
  const frets = `Frets ${left}–${right}`;
  const picker = !!scale.family && (state.studyMode === 'position' || state.studyMode === 'shape');
  const item = state.studyMode === 'shape' ? 'shape' : state.studyMode === 'diagonal' ? 'diagonal' : 'form';
  // With the 1–5 picker the form number is already visible, so the status shows only the frets.
  return <div className="form-stepper">
    <button className="icon-button" aria-label={`Previous ${item}`} disabled={choiceCount < 2} onClick={() => dispatch({ type: 'study-step', direction: -1 })}>‹</button>
    {picker
      ? <div className="form-picker" role="group" aria-label="Pentatonic form">{[1, 2, 3, 4, 5].map(form => {
        const level = state.studyMode === 'position' ? formLevel?.(form) ?? 0 : 0;
        return <button key={form} type="button" aria-label={`Form ${form}`} aria-pressed={study.form === form}
          data-progress={['', 'seen', 'practiced'][level] || undefined} title={['', 'Seen', 'Practiced'][level] || undefined}
          onClick={() => dispatch({ type: 'form', value: form })}>{form}</button>;
      })}</div>
      : <div className="form-status" aria-live="polite"><strong>{study.label}</strong><span>{frets}</span></div>}
    <button className="icon-button" aria-label={`Next ${item}`} disabled={choiceCount < 2} onClick={() => dispatch({ type: 'study-step', direction: 1 })}>›</button>
    {picker && <span className="form-frets" aria-live="polite">{frets}</span>}
  </div>;
}
