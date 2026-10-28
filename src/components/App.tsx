import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties, Dispatch, ReactNode } from 'react';
import { describeNote, degreeLabel, LOWEST_STRING_CHOICES, pitchName, position, scaleById, SCALES, SHARPS, spellTone } from '../core/music';
import type { Scale } from '../core/music';
import { loadState, reducer, sectionModified, selectedPitches, visibleShapes, STORAGE_KEY } from '../core/state';
import type { Action, NoteColors, NoteView, State, Triad } from '../core/state';
import { degreeColor, notePresentation } from '../core/presentation';
import { deriveStudy, tuningOf } from '../core/study';
import type { Study, StudyMode } from '../core/study';
import type { Shape, ShapeKind } from '../core/shapes';
import { Charm } from './Charm';
import { ControlModule, Icon, RestoreButton, Segments, Toggle } from './controls';
import { Fretboard } from './Fretboard';
import { GuideDialog } from './GuideDialog';
import { pluck } from './audio';
import { DrillBar, useDrill } from './Drill';
import { usePlayback } from './usePlayback';

const scaleOptions = SCALES.filter(scale => !scale.id.endsWith('-triad'));
const shapeName = (kind: string) => kind === 'rectangle' ? 'Rectangle' : 'Stack';
type Props = { state: State; dispatch: Dispatch<Action> };

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [darkMode, setDarkMode] = useState(() => {
    try { const theme = localStorage.getItem('fret-atlas-theme'); return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch { return false; }
  });
  const [sound, setSound] = useState(() => { try { return localStorage.getItem('fret-atlas-sound') !== 'off'; } catch { return true; } });
  const [practicing, setPracticing] = useState(false);
  const [fitNeck, setFitNeck] = useState(false);
  const [inspected, setInspected] = useState<string | null>(null);
  const [storageWorks, setStorageWorks] = useState(true);
  const [shareMessage, setShareMessage] = useState('');
  const [manualLink, setManualLink] = useState('');
  const guide = useRef<HTMLDialogElement>(null);
  const guideButton = useRef<HTMLButtonElement>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scale = scaleById(state.scaleId);
  const tuning = tuningOf(state);
  const { choices, study, ghosts } = useMemo(() => deriveStudy(state), [state]);
  const shapes = useMemo(() => visibleShapes(state, study), [state, study]);
  const drill = useDrill(state, study, practicing, sound);
  const playback = usePlayback(sound);
  // A drill hides every hint that would give the answer away.
  const boardState = useMemo<State>(() => practicing ? { ...state, skeleton: false, ghostForms: false, triad: 'off', marks: [], isolatedTones: [], wholeMap: false, context: false } : state, [state, practicing]);
  const inspection = inspected ? describeNote(position(...(inspected.split(':').map(Number) as [number, number]), tuning), state.root, scale, state.spelling) : undefined;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageWorks(true); }
    catch { setStorageWorks(false); }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try { localStorage.setItem('fret-atlas-theme', darkMode ? 'dark' : 'light'); } catch { /* The visual preference is optional. */ }
  }, [darkMode]);
  useEffect(() => () => clearTimeout(shareTimer.current), []);
  // A playing run belongs to the form it started on.
  useEffect(() => { playback.stop(); }, [study?.id]);
  useEffect(() => { try { localStorage.setItem('fret-atlas-sound', sound ? 'on' : 'off'); } catch { /* The sound preference is optional. */ } }, [sound]);

  function togglePractice() {
    playback.stop();
    setInspected(null);
    setPracticing(value => !value);
  }
  function markNote(id: string) {
    dispatch({ type: 'mark', id });
    if (sound) pluck(position(...(id.split(':').map(Number) as [number, number]), tuning).midi);
  }
  // A form plays the way it is fingered: low string to high, each string left to right.
  function playForm() {
    if (playback.running) { playback.stop(); return; }
    const notes = [6, 5, 4, 3, 2, 1].flatMap(string => Array.from({ length: state.frets + 1 }, (_, fret) => position(string, fret, tuning)))
      .filter(note => { const p = notePresentation(note, state, shapes, study, ghosts); return p.active && p.visible; });
    playback.play(notes);
  }

  async function share() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('atlas', JSON.stringify(state));
    try { await navigator.clipboard.writeText(url.toString()); setShareMessage('View link copied'); setManualLink(''); }
    catch { setManualLink(url.toString()); setShareMessage('Select and copy your view link'); }
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShareMessage(''), 3500);
  }

  return <>
    <main className="workspace minimal-studio">
      <section className="board-card" aria-label="Interactive fretboard">
        <div className="board-heading">
          <div className="board-title">
            <span className="tonic-badge">{pitchName(state.root, state.spelling)}</span>
            <div><h1>{scale.name}</h1><p>{state.fourths ? 'All fourths' : state.lowest === 0 ? 'Standard tuning' : `Tuned ${LOWEST_STRING_CHOICES.find(c => c.lowered === state.lowest)?.label} lowest`} <span>·</span> High strings above <span>·</span> Nut {state.leftHanded ? 'right' : 'left'}</p></div>
          </div>
          <div className="header-actions">
            <button className={`text-button practice-button ${practicing ? 'is-active' : ''}`} aria-pressed={practicing} onClick={togglePractice}><Icon name="target" /><span>{practicing ? 'Stop practice' : 'Practice'}</span></button>
            <button className="text-button" aria-label="Share view" onClick={share}><Icon name="link" /><span>Share</span></button>
            <button ref={guideButton} className="text-button" onClick={() => guide.current?.showModal()}><Icon name="help" /><span>Guide</span></button>
            <button className="text-button" title="Restore every panel's defaults. Key, scale and marked notes stay." onClick={() => dispatch({ type: 'reset-view' })}><Icon name="undo" /><span>Reset view</span></button>
          </div>
          <span className="map-tag">{study ? `${study.label}${state.studyMode === 'shape' ? ` · ${shapeName(state.shapeKind)}` : ''}` : 'Custom map'}</span>
        </div>
        <StudyControls state={state} dispatch={dispatch} scale={scale} study={study} choiceCount={choices.length} playing={playback.running} onPlay={practicing ? undefined : playForm} />
        {practicing && <DrillBar session={drill} onEnd={togglePractice} />}

        {!practicing && scale.family && !['string', 'nps'].includes(state.studyMode) && state.patterns.length > 0 && !shapes.length && <div className="board-notice" role="status">No patterns fit the current strings and fret range. The notes are still shown.</div>}
        {(state.studyMode === 'diagonal' || state.studyMode === 'all') && <button className={`fit-neck ${state.frets > 17 ? 'long-neck' : ''}`} type="button" aria-pressed={fitNeck} onClick={() => setFitNeck(value => !value)}>Fit neck to screen</button>}
        <Fretboard state={boardState} shapes={practicing ? [] : shapes} study={study} ghosts={ghosts} fitNeck={fitNeck} drill={drill.view} playing={playback.playing} onMark={practicing ? drill.tap : markNote} onInspect={practicing ? () => {} : setInspected}>
          {!practicing && <BoardLegend state={state} shapes={shapes} scale={scale} />}
        </Fretboard>
        <NoteViewBar state={state} dispatch={dispatch} />
        <ToneStrip state={state} dispatch={dispatch} scale={scale} />

        <ControlModule title="Overlays" summary="Patterns and visual guides" modified={sectionModified(state, 'overlays')} onRestore={() => dispatch({ type: 'reset-section', value: 'overlays' })}>
          <Overlays state={state} dispatch={dispatch} scale={scale} />
        </ControlModule>
        <ControlModule title="Practice tools" summary="Triads and fret/string focus" modified={sectionModified(state, 'practice')} onRestore={() => dispatch({ type: 'reset-section', value: 'practice' })}>
          <PracticeTools state={state} dispatch={dispatch} />
        </ControlModule>
        <ControlModule title="Instrument & display" summary="Tuning, neck and appearance" className="instrument-settings" modified={sectionModified(state, 'instrument')} onRestore={() => dispatch({ type: 'reset-section', value: 'instrument' })}>
          <InstrumentSettings state={state} dispatch={dispatch} darkMode={darkMode} onDarkMode={() => setDarkMode(value => !value)} sound={sound} onSound={() => setSound(value => !value)} />
        </ControlModule>

        <div className="inspection-row">
          <div className="note-inspector" role="status" aria-live="polite">{inspection && inspected
            ? <><strong>{inspection.name}<small>{inspection.octave}</small></strong><span>Degree {inspection.interval}</span><span>String {inspected.split(':')[0]} · {inspected.endsWith(':0') ? 'Open' : `Fret ${inspected.split(':')[1]}`}</span></>
            : <span>Select a note to inspect or mark it</span>}</div>
          <span className="keyboard-hint"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> navigate <span>·</span> <kbd>enter</kbd> mark</span>
        </div>
      </section>
      {state.marks.length > 0 && <section className="marks-panel" aria-label="Marked positions">
        <div className="marks-title"><h2>{state.marks.length} marked {state.marks.length === 1 ? 'position' : 'positions'}</h2><button className="text-button" onClick={() => dispatch({ type: 'clear-marks' })}>Clear marks</button></div>
        <div className="marks-list">{state.marks.map(id => {
          const [s, f] = id.split(':').map(Number);
          const d = describeNote(position(s, f, tuning), state.root, scale, state.spelling);
          return <button key={id} onClick={() => dispatch({ type: 'mark', id })} aria-label={`Remove marked ${d.name}${d.octave}, string ${s}, fret ${f}`}><strong>{d.name}<small>{d.octave}</small></strong><span>S{s} · {f === 0 ? 'Open' : `F${f}`}{f > state.frets ? ' · off screen' : ''}</span><Icon name="close" /></button>;
        })}</div>
      </section>}
      {manualLink && <label className="manual-link">View link<input readOnly value={manualLink} onFocus={e => e.target.select()} /></label>}
      <footer className="page-footer">
        <span>{storageWorks ? 'Saved on this device' : 'Storage unavailable · use Share view'}</span>
      </footer>
    </main>
    {shareMessage && <div className="toast" role="status">{shareMessage}</div>}
    <GuideDialog dialog={guide} onClose={() => guideButton.current?.focus()} />
  </>;
}

function StudyControls({ state, dispatch, scale, study, choiceCount, playing, onPlay }: Props & { scale: Scale; study: Study | undefined; choiceCount: number; playing: boolean; onPlay?: () => void }) {
  const pitches = selectedPitches(state);
  const custom = state.scaleId === 'custom';
  const familyHint = scale.family ? undefined : 'Requires a pentatonic pattern family';
  const sevenNotes = new Set(pitches).size === 7;
  const views: { value: StudyMode; label: string; disabled?: boolean; hint?: string }[] = [
    { value: 'position', label: 'Position', disabled: !scale.family, hint: familyHint },
    { value: 'shape', label: 'Shape', disabled: !scale.family, hint: familyHint },
    { value: 'diagonal', label: 'Diagonal', disabled: !scale.family, hint: familyHint },
    { value: 'all', label: 'Whole neck' },
    { value: 'string', label: 'One string', disabled: !pitches.length },
    { value: 'nps', label: '3 notes/string', disabled: !sevenNotes, hint: sevenNotes ? undefined : 'Requires a seven-note scale' },
  ];
  const visibleFamilies = state.patterns.length === 2 ? 'both' : state.patterns[0] ?? 'both';
  return <section className="study-controls" aria-label="Study controls">
    <div className="study-primary">
      <div className="musical-controls">
        <label className="field key-field"><span>{custom ? 'Reference' : 'Key'}</span><select id="root" value={state.root} onChange={e => dispatch({ type: 'root', value: Number(e.target.value) })}>{SHARPS.map((_, i) => <option key={i} value={i}>{pitchName(i, state.spelling)}</option>)}</select></label>
        <label className="field scale-field"><span>Scale</span><select id="scale" value={state.scaleId} onChange={e => dispatch({ type: 'scale', value: e.target.value })}>
          {[...new Set(scaleOptions.map(s => s.group))].map(group => <optgroup key={group} label={group === 'Triads & custom' ? 'Custom' : group}>{scaleOptions.filter(s => s.group === group).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>)}
        </select></label>
      </div>
      <Segments<StudyMode> label="Study view" value={state.studyMode} options={views} onChange={value => dispatch({ type: 'study-mode', value })} />
    </div>
    {!scale.family && <p className="study-availability">Position, Shape and Diagonal need a scale built on a pentatonic.</p>}
    <div className="form-bar">
      {state.studyMode === 'all' && scale.family && <div className="form-navigation">
        <span className="field-label">Show</span>
        <Segments<'both' | ShapeKind> label="Pattern families" value={visibleFamilies} options={[
          { value: 'both', label: 'Both' },
          { value: 'rectangle', label: <><i className="shape-icon" />Rectangles</> },
          { value: 'stack', label: <><i className="shape-icon stack" />Stacks</> },
        ]} onChange={value => dispatch({ type: 'patterns', value: value === 'both' ? ['rectangle', 'stack'] : [value] })} />
        <span className="form-hint">Hover a note to highlight its shapes</span>
      </div>}
      {state.studyMode !== 'all' && study && <div className="form-navigation">
        <button className="icon-button" aria-label="Previous form" disabled={choiceCount < 2} onClick={() => dispatch({ type: 'study-step', direction: -1 })}>‹</button>
        <div className="form-status" aria-live="polite"><strong>{study.label}</strong><span>Frets {Math.max(0, Math.min(...study.rows.map(r => r.left)))}–{Math.min(state.frets, Math.max(...study.rows.map(r => r.right)))}</span></div>
        <button className="icon-button" aria-label="Next form" disabled={choiceCount < 2} onClick={() => dispatch({ type: 'study-step', direction: 1 })}>›</button>
        {onPlay && <button type="button" className={`play-button ${playing ? 'is-playing' : ''}`} aria-pressed={playing} onClick={onPlay}><Icon name={playing ? 'stop' : 'play'} />{playing ? 'Stop' : 'Play'}</button>}
        {scale.family && (state.studyMode === 'position' || state.studyMode === 'shape') && <div className="form-picker" role="group" aria-label="Pentatonic form">
          {[1, 2, 3, 4, 5].map(form => <button key={form} type="button" aria-label={`Form ${form}`} aria-pressed={study.form === form} onClick={() => dispatch({ type: 'form', value: form })}>{form}</button>)}
        </div>}
        {(state.studyMode === 'shape' || state.studyMode === 'diagonal') && <Segments<ShapeKind> label="Shape family" value={state.shapeKind} options={[
          { value: 'rectangle', label: <><i className="shape-icon" />Rectangle</> },
          { value: 'stack', label: <><i className="shape-icon stack" />Stack</> },
        ]} onChange={value => dispatch({ type: 'shape-kind', value })} />}
      </div>}
    </div>
  </section>;
}

function BoardLegend({ state, shapes, scale }: { state: State; shapes: Shape[]; scale: Scale }) {
  const warp = state.warp && !state.fourths;
  return <div className="board-legend"><div className="legend-items">
    {(['rectangle', 'stack'] as const).filter(kind => shapes.some(shape => shape.kind === kind)).map(kind => <span key={kind}><i className={`legend-outline ${kind}`} />{shapeName(kind)}</span>)}
    {state.studyMode === 'diagonal' && shapes.length > 0 && <span><i className="legend-note run" />Continuation tone</span>}
    {scale.tones.some(t => !t.skeleton) && !state.hideAdded && <span><i className="legend-note added" />{scale.family ? 'Added to the pentatonic' : 'Added tone'}</span>}
    {state.ghostForms && state.studyMode === 'position' && <span><i className="legend-outline ghost" />Ghost forms</span>}
    {state.wholeMap && state.studyMode !== 'all' && <span><i className="legend-note background" />Whole map</span>}
    {state.skeleton && <span><i className="legend-line skeleton" />Skeleton</span>}
    {warp && <span><i className="legend-line warp" />Warp · +1 fret on B and e</span>}
    {state.hideAdded && <span>Pentatonic only</span>}
    {state.triad !== 'off' && <span className="triad-legend"><i className="legend-triad" />{pitchName(state.triadRoot ?? state.root, state.spelling)} {state.triad} triad</span>}
    {state.isolatedTones.length > 0 && <span>Degree isolated</span>}
    {state.marks.length > 0 && <span><i className="legend-note marked" />Marked</span>}
  </div></div>;
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
    { value: 'degrees', label: <><span className="color-preview degrees-preview" aria-hidden="true">● ● ●</span>Scale degrees</> },
    { value: 'chord', label: <><span className="color-preview chord-preview" aria-hidden="true">● ● ●</span>Chord tones</> },
  ];
  return <div className="note-view-bar">
    <div className="label-controls"><span className="field-label">Note view</span><Segments<NoteView> label="Note view" value={state.luckyCharms ? 'charms' : state.labels} options={views} onChange={value => dispatch({ type: 'note-view', value })} /></div>
    {!state.luckyCharms && <div className="label-controls"><span className="field-label">Colors</span><Segments<NoteColors> label="Note colors" value={state.degreeColors ? 'degrees' : state.chordColors ? 'chord' : 'root'} options={colors} onChange={value => dispatch({ type: 'note-colors', value })} /></div>}
    {sectionModified(state, 'note-view') && <RestoreButton label="note view" onClick={() => dispatch({ type: 'reset-section', value: 'note-view' })} />}
  </div>;
}

function ToneStrip({ state, dispatch, scale }: Props & { scale: Scale }) {
  const pitches = selectedPitches(state);
  const custom = state.scaleId === 'custom';
  const anyIsolated = state.isolatedTones.length > 0;
  return <div className="degree-legend">
    <p className="degree-legend-heading">{custom ? 'Custom notes' : 'Scale degrees · click to isolate'}</p>
    <section className="tone-strip" aria-label="Scale tones">
      <div className="tone-strip-heading"><h2>{custom ? 'Custom notes' : 'Scale tones'}</h2><span>{pitches.length} notes</span></div>
      <div className={`tone-sequence ${custom ? 'custom' : ''}`}>
        {custom
          ? SHARPS.map((_, pitch) => <button key={pitch} className={`tone-chip ${pitches.includes(pitch) ? 'selected' : ''}`} aria-pressed={pitches.includes(pitch)} onClick={() => dispatch({ type: 'pitch', value: pitch })} aria-label={`Toggle ${pitchName(pitch, state.spelling)}`}><strong>{pitchName(pitch, state.spelling)}</strong></button>)
          : scale.tones.map(t => {
            const isolated = state.isolatedTones.includes(t.semitones);
            const name = spellTone(state.root, state.spelling, t).name;
            const chordRole = state.chordColors && !state.luckyCharms ? t.degree === 3 ? 'third' : t.degree === 5 ? 'fifth' : '' : '';
            const markerClass = ['degree-marker note-node', state.luckyCharms && 'lucky-charm', t.semitones === 0 ? 'root' : 'skeleton', state.degreeColors && !state.luckyCharms && t.semitones !== 0 && 'degree-colored', chordRole].filter(Boolean).join(' ');
            return <button key={`${t.degree}:${t.alteration}`} type="button"
              className={`tone-chip scale-tone-chip ${isolated ? 'isolated' : ''} ${anyIsolated && !isolated ? 'dimmed' : ''} ${t.semitones === 0 ? 'root' : !t.skeleton ? 'added' : ''}`}
              aria-pressed={isolated} onClick={() => dispatch({ type: 'isolate-tone', value: t.semitones })}
              aria-label={`${isolated ? 'Clear isolation for' : 'Isolate'} ${name}, degree ${degreeLabel(t)}`} title={`Click to ${isolated ? 'stop isolating' : 'isolate'} ${degreeLabel(t)} across the neck`}>
              <svg className={markerClass} data-charm-degree={state.luckyCharms ? t.degree : undefined} style={{ '--degree-color': degreeColor(t.degree) } as CSSProperties} viewBox="-17 -17 34 34" aria-hidden="true">{state.luckyCharms ? <Charm degree={t.degree} /> : <circle className="note-face" r="11" />}</svg>
              <strong>{name}</strong><span>{degreeLabel(t)}</span>
            </button>;
          })}
      </div>
      <div className="tone-actions">{custom
        ? <><button onClick={() => dispatch({ type: 'pitches', value: SHARPS.map((_, i) => i) })}>All</button><button onClick={() => dispatch({ type: 'pitches', value: [0, 2, 4, 5, 7, 9, 11] })}>Naturals</button><button onClick={() => dispatch({ type: 'pitches', value: [] })}>Clear</button></>
        : <>{anyIsolated && <button className="tone-action-btn" onClick={() => dispatch({ type: 'clear-isolated-tones' })}>Show all degrees</button>}<button onClick={() => dispatch({ type: 'scale', value: 'custom' })}>Customize notes</button></>}
      </div>
    </section>
  </div>;
}

function Overlays({ state, dispatch, scale }: Props & { scale: Scale }) {
  return <>
    <div className="map-layers">
      {state.studyMode !== 'all' && <Toggle label="Whole map" checked={state.wholeMap} onChange={() => dispatch({ type: 'toggle', key: 'wholeMap' })} hint="Show the remaining scale notes quietly behind this form" />}
      {state.studyMode === 'position' && scale.family && <Toggle label="Ghost forms" checked={state.ghostForms} onChange={() => dispatch({ type: 'toggle', key: 'ghostForms' })} hint="Outline the neighboring forms to see how they connect" />}
      <Toggle label="Skeleton" checked={state.skeleton} onChange={() => dispatch({ type: 'toggle', key: 'skeleton' })} hint="Connect the root notes across the neck" />
      {!state.fourths && <Toggle label="Warp" checked={state.warp} onChange={() => dispatch({ type: 'toggle', key: 'warp' })} hint="Mark the G–B tuning break where shapes shift one fret" />}
      <Toggle label="Notes outside the scale" checked={state.context} onChange={() => dispatch({ type: 'toggle', key: 'context' })} />
      {scale.tones.some(t => !t.skeleton) && <Toggle label="Pentatonic only" checked={state.hideAdded} onChange={() => dispatch({ type: 'toggle', key: 'hideAdded' })} />}
    </div>
    {scale.family && <div className="pattern-options">
      <div className="pattern-selector" role="group" aria-label="Pattern outlines">{(['rectangle', 'stack'] as const).map(kind => <button type="button" key={kind} className={`pattern-button ${kind}`} aria-pressed={state.patterns.includes(kind)} onClick={() => dispatch({ type: 'pattern', value: kind })}><i className={`shape-icon ${kind}`} />{kind === 'rectangle' ? 'Rectangles' : 'Stacks'}</button>)}</div>
      <div className="pattern-string-settings">
        <span className="field-label">Pattern strings</span>
        <div className="row-toggles" role="group" aria-label="Pattern strings">{[1, 2, 3, 4, 5, 6].map(string => <button type="button" key={string} aria-label={`Show patterns on string ${string}`} aria-pressed={state.overlayRows.includes(string)} onClick={() => dispatch({ type: 'overlay-row', value: string })}>{string}</button>)}</div>
        <p>Hide patterns that use an excluded string. Notes stay visible.</p>
      </div>
    </div>}
  </>;
}

function PracticeTools({ state, dispatch }: Props) {
  const [focusOpen, setFocusOpen] = useState(false);
  const focused = state.focus || state.strings.length !== 6;
  return <>
    <div className="triad-controls">
      <span className="field-label">Triad</span>
      <Segments<Triad> label="Triad highlight" value={state.triad} options={[{ value: 'off', label: 'Off' }, { value: 'major', label: 'Major' }, { value: 'minor', label: 'Minor' }]} onChange={value => dispatch({ type: 'triad', value })} />
      {state.triad !== 'off' && <label className="triad-root-field"><span>Root</span><select id="triad-root" aria-label="Triad root" value={state.triadRoot ?? 'key'} onChange={event => dispatch({ type: 'triad-root', value: event.target.value === 'key' ? null : Number(event.target.value) })}>
        <option value="key">Key · {pitchName(state.root, state.spelling)}</option>
        {SHARPS.map((_, pitch) => <option key={pitch} value={pitch}>{pitchName(pitch, state.spelling)}</option>)}
      </select></label>}
    </div>
    <button className={`text-button ${focused ? 'is-active' : ''}`} onClick={() => setFocusOpen(!focusOpen)} aria-expanded={focusOpen} aria-controls="focus-panel"><Icon name="focus" />Fret & string focus{focused && <span className="active-badge" />}</button>
    {focusOpen && <section id="focus-panel" className="focus-panel" aria-label="Focus controls">
      <div className="focus-range">
        <Toggle label="Fret range" checked={state.focus} onChange={() => dispatch({ type: 'toggle', key: 'focus' })} />
        <label><span className="sr-only">From fret</span><input type="number" min="0" max={state.to} disabled={!state.focus} value={state.from} onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: Math.min(Number(e.target.value), state.to), to: state.to }); }} /></label>
        <span>to</span>
        <label><span className="sr-only">To fret</span><input type="number" min={state.from} max={state.frets} disabled={!state.focus} value={state.to} onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: state.from, to: Number(e.target.value) }); }} /></label>
      </div>
      {/* String 1 is drawn on top, so the buttons follow the board's order. */}
      <div className="focus-strings"><span>Strings</span><div role="group" aria-label="Included strings">{[1, 2, 3, 4, 5, 6].map(s => <button key={s} aria-label={`Include string ${s}`} aria-pressed={state.strings.includes(s)} onClick={() => dispatch({ type: 'string', value: s })}>{s}</button>)}</div></div>
      <button className="text-button" onClick={() => dispatch({ type: 'focus-reset' })}>Clear focus</button>
    </section>}
  </>;
}

function InstrumentSettings({ state, dispatch, darkMode, onDarkMode, sound, onSound }: Props & { darkMode: boolean; onDarkMode: () => void; sound: boolean; onSound: () => void }) {
  return <>
    <label className="field"><span>Frets</span><select id="frets" value={state.frets} onChange={e => dispatch({ type: 'frets', value: Number(e.target.value) })}>{[12, 15, 17, 22, 24].map(f => <option key={f} value={f}>{f} frets</option>)}</select></label>
    <label className="field"><span>Lowest string</span><select id="lowest" value={state.lowest} onChange={e => dispatch({ type: 'lowest', value: Number(e.target.value) })}>{LOWEST_STRING_CHOICES.map(c => <option key={c.lowered} value={c.lowered}>{c.label}</option>)}</select></label>
    <Toggle label="All fourths" checked={state.fourths} onChange={() => dispatch({ type: 'toggle', key: 'fourths' })} hint="Tune the B and e strings up a semitone so every string is a fourth apart" />
    <label className="field"><span>Key spelling</span><select id="spelling" value={state.spelling} onChange={e => dispatch({ type: 'spelling', value: e.target.value as 'sharps' | 'flats' })}><option value="sharps">Sharps ♯</option><option value="flats">Flats ♭</option></select></label>
    <Toggle label="Dark mode" checked={darkMode} onChange={onDarkMode} />
    <Toggle label="Sound" checked={sound} onChange={onSound} hint="Pluck notes when you tap them, play forms and hear drill feedback" />
    <Toggle label="String names" checked={state.stringNames} onChange={() => dispatch({ type: 'toggle', key: 'stringNames' })} />
    <Toggle label="Left-handed" checked={state.leftHanded} onChange={() => dispatch({ type: 'toggle', key: 'leftHanded' })} />
  </>;
}
