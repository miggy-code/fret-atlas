import type { CSSProperties, Dispatch, ReactNode } from 'react';
import { degreeLabel, pitchName, SHARPS, spellTone } from '../core/music';
import type { Scale } from '../core/music';
import { sectionModified, selectedPitches } from '../core/state';
import type { Action, NoteColors, NoteView, State } from '../core/state';
import { degreeColor } from '../core/presentation';
import { Charm } from './Charm';
import { ControlModule, RestoreButton, Segments, Toggle } from './controls';
import type { ChordChange, ChordKind } from './useChord';

type Props = { state: State; dispatch: Dispatch<Action> };
export interface ChordRowProps {
  kind: ChordKind;
  root: number;
  shown: boolean;
  onChange: (next: ChordChange) => void;
  onToggle: () => void;
  onHear: () => void;
}

/** Everything below the board in Explore: how notes look, the scale's degrees, the chord, overlays and focus. */
export function ExploreDeck({ state, dispatch, scale, chord }: Props & { scale: Scale; chord: ChordRowProps }) {
  return <>
    <NoteViewBar state={state} dispatch={dispatch} />
    <section className="explore" aria-label="Explore">
      <ToneStrip state={state} dispatch={dispatch} scale={scale} />
      <ChordRow state={state} scale={scale} {...chord} />
    </section>
    <ControlModule title="Overlays" summary="Patterns and visual guides" modified={sectionModified(state, 'overlays')}
      onRestore={() => dispatch({ type: 'reset-section', value: 'overlays' })}>
      <Overlays state={state} dispatch={dispatch} scale={scale} />
    </ControlModule>
    <ControlModule title="Focus" summary="Limit notes and drills by fret and string" modified={sectionModified(state, 'focus')}
      onRestore={() => dispatch({ type: 'reset-section', value: 'focus' })}>
      <FocusControls state={state} dispatch={dispatch} />
    </ControlModule>
  </>;
}

function NoteViewBar({ state, dispatch }: Props) {
  const views: { value: NoteView; label: ReactNode }[] = [
    { value: 'none', label: <><span className="view-dot" />Dots</> },
    { value: 'charms', label: <><span className="view-charms" aria-hidden="true">● ▲ ■</span>Lucky Charms</> },
    { value: 'notes', label: 'Names' },
    { value: 'intervals', label: 'Intervals' },
    { value: 'both', label: 'Both' },
  ];
  const colors: { value: NoteColors; label: ReactNode }[] = [
    { value: 'root', label: <><span className="color-preview root-preview" aria-hidden="true">● ● ●</span>Root highlight</> },
    { value: 'chord', label: <><span className="color-preview chord-preview" aria-hidden="true">● ● ●</span>Chord tones</> },
    { value: 'degrees', label: <><span className="color-preview degrees-preview" aria-hidden="true">● ● ●</span>Scale degrees</> },
  ];
  const view = state.luckyCharms ? 'charms' : state.labels;
  const color = state.degreeColors ? 'degrees' : state.chordColors ? 'chord' : 'root';
  return <div className="note-view-bar">
    <div className="label-controls"><span className="field-label">Note view</span>
      <Segments<NoteView> label="Note view" value={view} options={views} onChange={value => dispatch({ type: 'note-view', value })} />
    </div>
    {!state.luckyCharms && <div className="label-controls"><span className="field-label">Colors</span>
      <Segments<NoteColors> label="Note colors" value={color} options={colors} onChange={value => dispatch({ type: 'note-colors', value })} />
    </div>}
    {sectionModified(state, 'note-view')
      && <RestoreButton label="note view" onClick={() => dispatch({ type: 'reset-section', value: 'note-view' })} />}
  </div>;
}

function ToneStrip({ state, dispatch, scale }: Props & { scale: Scale }) {
  const pitches = selectedPitches(state);
  const custom = state.scaleId === 'custom';
  const anyIsolated = state.isolatedTones.length > 0;
  return <div className="degree-legend">
    <p className="degree-legend-heading">{custom ? 'Custom notes' : <>Scale degrees<span>Click to isolate</span></>}</p>
    <section className="tone-strip" aria-label="Scale tones">
      <div className={`tone-sequence ${custom ? 'custom' : ''}`}>
        {custom
          ? SHARPS.map((_, pitch) => <button key={pitch} className={`tone-chip ${pitches.includes(pitch) ? 'selected' : ''}`}
            aria-pressed={pitches.includes(pitch)} onClick={() => dispatch({ type: 'pitch', value: pitch })}
            aria-label={`Toggle ${pitchName(pitch, state.spelling)}`}><strong>{pitchName(pitch, state.spelling)}</strong></button>)
          : scale.tones.map(t => {
            const isolated = state.isolatedTones.includes(t.semitones);
            const name = spellTone(state.root, state.spelling, t).name;
            const chordRole = state.chordColors && !state.luckyCharms ? t.degree === 3 ? 'third' : t.degree === 5 ? 'fifth' : '' : '';
            const markerClass = [
              'degree-marker note-node', state.luckyCharms && 'lucky-charm', t.semitones === 0 ? 'root' : 'skeleton',
              state.degreeColors && !state.luckyCharms && t.semitones !== 0 && 'degree-colored', chordRole,
            ].filter(Boolean).join(' ');
            const chipClass = `tone-chip scale-tone-chip ${isolated ? 'isolated' : ''} ${anyIsolated && !isolated ? 'dimmed' : ''} ${t.semitones === 0 ? 'root' : !t.skeleton ? 'added' : ''}`;
            return <button key={`${t.degree}:${t.alteration}`} type="button" className={chipClass}
              aria-pressed={isolated} onClick={() => dispatch({ type: 'isolate-tone', value: t.semitones })}
              aria-label={`${isolated ? 'Clear isolation for' : 'Isolate'} ${name}, degree ${degreeLabel(t)}`}
              title={`Click to ${isolated ? 'stop isolating' : 'isolate'} ${degreeLabel(t)} across the neck`}>
              <svg className={markerClass} data-charm-degree={state.luckyCharms ? t.degree : undefined}
                style={{ '--degree-color': degreeColor(t.degree) } as CSSProperties} viewBox="-17 -17 34 34" aria-hidden="true">
                {state.luckyCharms ? <Charm degree={t.degree} /> : <circle className="note-face" r="11" />}
              </svg>
              <strong>{name}</strong><span>{degreeLabel(t)}</span>
            </button>;
          })}
      </div>
      <div className="tone-actions">{custom
        ? <>
          <button onClick={() => dispatch({ type: 'pitches', value: SHARPS.map((_, i) => i) })}>All</button>
          <button onClick={() => dispatch({ type: 'pitches', value: [0, 2, 4, 5, 7, 9, 11] })}>Naturals</button>
          <button onClick={() => dispatch({ type: 'pitches', value: [] })}>Clear</button>
        </>
        : <>
          {anyIsolated && <button onClick={() => dispatch({ type: 'clear-isolated-tones' })}>Show all degrees</button>}
          <button onClick={() => dispatch({ type: 'scale', value: 'custom' })}>Customize notes</button>
        </>}
      </div>
    </section>
  </div>;
}

function ChordRow({ state, scale, kind, root, shown, onChange, onToggle, onHear }: ChordRowProps & { state: State; scale: Scale }) {
  return <div className="chord-row">
    <span className="explore-label">Chord</span>
    <span className="chord-sentence">
      <select aria-label="Chord root" value={root} onChange={e => onChange({ root: Number(e.target.value) })}>
        {SHARPS.map((_, i) => <option value={i} key={i}>{pitchName(i, state.spelling)}</option>)}
      </select>
      <select aria-label="Chord quality" value={kind} onChange={e => onChange({ kind: e.target.value as ChordKind })}>
        <option value="minor">minor</option><option value="major">major</option>
      </select>
      <span>in {pitchName(state.root, state.spelling)} {scale.name}</span>
    </span>
    <span className="explore-actions">
      <button aria-pressed={shown} onClick={onToggle}>{shown ? 'Hide tones' : 'Show tones'}</button>
      <button onClick={onHear}>Hear chord</button>
    </span>
  </div>;
}

function Overlays({ state, dispatch, scale }: Props & { scale: Scale }) {
  const toggle = (key: 'wholeMap' | 'skeleton' | 'warp' | 'context' | 'hideAdded') => () => dispatch({ type: 'toggle', key });
  return <>
    <div className="map-layers">
      {state.studyMode !== 'all' && <Toggle label="Whole map" checked={state.wholeMap} onChange={toggle('wholeMap')} hint="Show the remaining scale notes quietly behind this form" />}
      <Toggle label="Skeleton" checked={state.skeleton} onChange={toggle('skeleton')} hint="Connect the root notes across the neck" />
      {!state.fourths && <Toggle label="Warp" checked={state.warp} onChange={toggle('warp')} hint="Mark the G–B tuning break where shapes shift one fret" />}
      <Toggle label="Notes outside the scale" checked={state.context} onChange={toggle('context')} />
      {scale.tones.some(t => !t.skeleton) && <Toggle label="Pentatonic only" checked={state.hideAdded} onChange={toggle('hideAdded')} />}
    </div>
    {scale.family && <div className="pattern-options">
      <div className="pattern-string-settings">
        <span className="field-label">Pattern strings</span>
        <div className="row-toggles" role="group" aria-label="Pattern strings">{[1, 2, 3, 4, 5, 6].map(string =>
          <button type="button" key={string} aria-label={`Show patterns on string ${string}`} aria-pressed={state.overlayRows.includes(string)}
            onClick={() => dispatch({ type: 'overlay-row', value: string })}>{string}</button>)}
        </div>
        <p>Hide patterns that use an excluded string. Notes stay visible.</p>
      </div>
    </div>}
  </>;
}

// Focus limits what the board shows, so its controls are always open inside the panel.
function FocusControls({ state, dispatch }: Props) {
  return <section id="focus-panel" className="focus-panel" aria-label="Focus controls">
    <div className="focus-range">
      <Toggle label="Fret range" checked={state.focus} onChange={() => dispatch({ type: 'toggle', key: 'focus' })} />
      <label><span className="sr-only">From fret</span>
        <input type="number" min="0" max={state.to} disabled={!state.focus} value={state.from}
          onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: Math.min(Number(e.target.value), state.to), to: state.to }); }} />
      </label>
      <span>to</span>
      <label><span className="sr-only">To fret</span>
        <input type="number" min={state.from} max={state.frets} disabled={!state.focus} value={state.to}
          onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: state.from, to: Number(e.target.value) }); }} />
      </label>
    </div>
    {/* String 1 is drawn on top, so the buttons follow the board's order. */}
    <div className="focus-strings"><span>Strings</span><div role="group" aria-label="Included strings">{[1, 2, 3, 4, 5, 6].map(s =>
      <button key={s} aria-label={`Include string ${s}`} aria-pressed={state.strings.includes(s)} onClick={() => dispatch({ type: 'string', value: s })}>{s}</button>)}
    </div></div>
  </section>;
}
