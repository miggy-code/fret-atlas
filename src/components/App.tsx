import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { describeNote, degreeLabel, LOWEST_STRING_CHOICES, pitchName, position, scaleById, SHARPS, spellTone } from '../core/music';
import { loadState, reducer, selectedPitches, visibleShapes, STORAGE_KEY } from '../core/state';
import type { NoteView, NoteColors, Triad } from '../core/state';
import { Charm } from './Charm';
import { degreeColor } from '../core/presentation';
import { Fretboard } from './Fretboard';
import { SCALES } from '../core/music';
import { deriveStudy, tuningOf } from '../core/study';
import type { StudyMode } from '../core/study';
import type { ShapeKind } from '../core/shapes';

function Icon({ name }: { name: 'settings' | 'link' | 'focus' | 'close' | 'help' | 'shift' }) {
  const paths = {
    shift: <path d="M3 17 21 7m-7-1 7 1-3 6" />,
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" /><circle cx="15" cy="17" r="3" /></>,
    link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></>,
    focus: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
function Segments<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: ReactNode; disabled?: boolean; hint?: string }[]; onChange: (value: T) => void }) {
  return <div className="segmented" role="group" aria-label={label}>{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className={value === option.value ? 'active' : ''} disabled={option.disabled} title={option.hint} onClick={() => onChange(option.value)}>{option.label}</button>)}</div>;
}
function Toggle({ label, checked, disabled, onChange, hint }: { label: string; checked: boolean; disabled?: boolean; onChange: () => void; hint?: string }) {
  const hintId = useId();
  return <label className="toggle" title={hint}><input type="checkbox" aria-label={label} aria-describedby={hint ? hintId : undefined} checked={checked} disabled={disabled} onChange={onChange} /><span>{label}</span>{hint && <small id={hintId} className="toggle-hint">{hint}</small>}</label>;
}
const scaleOptions = SCALES.filter(scale => !scale.id.endsWith('-triad'));
const shapeName = (kind: string) => kind === 'rectangle' ? 'Rectangle' : 'Stack';

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [darkMode, setDarkMode] = useState(() => {
    try { const theme = localStorage.getItem('fret-atlas-theme'); return theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; }
    catch { return false; }
  });
  const [focusOpen, setFocusOpen] = useState(false);
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
  const pitches = selectedPitches(state);
  const custom = state.scaleId === 'custom';
  const inspection = inspected ? describeNote(position(...(inspected.split(':').map(Number) as [number, number]), tuning), state.root, scale, state.spelling) : undefined;
  const focused = state.focus || state.strings.length !== 6;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageWorks(true); }
    catch { setStorageWorks(false); }
  }, [state]);
  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    try { localStorage.setItem('fret-atlas-theme', darkMode ? 'dark' : 'light'); } catch { /* The visual preference is optional. */ }
  }, [darkMode]);
  useEffect(() => () => clearTimeout(shareTimer.current), []);

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
        <div className="board-heading"><div className="board-title"><span className="tonic-badge">{pitchName(state.root, state.spelling)}</span><div><h1>{scale.name}</h1><p>{state.fourths ? 'All fourths' : state.lowest === 0 ? 'Standard tuning' : `Tuned ${LOWEST_STRING_CHOICES.find(c => c.lowered === state.lowest)?.label} lowest`} <span>·</span> High strings above <span>·</span> Nut {state.leftHanded ? 'right' : 'left'}</p></div></div>
          <div className="header-actions"><button className="text-button" aria-label="Share view" onClick={share}><Icon name="link" /><span>Share</span></button><button ref={guideButton} className="text-button" onClick={() => guide.current?.showModal()}><Icon name="help" /><span>Guide</span></button><button className="text-button" onClick={() => dispatch({ type: 'reset-view' })}>Reset</button></div>
          <span className="map-tag">{study ? `${study.label}${state.studyMode==='shape'?` · ${shapeName(state.shapeKind)}`:''}` : 'Custom map'}</span>
        </div>
      <section className="study-controls" aria-label="Study controls">
        <div className="study-primary">
          <div className="musical-controls">
            <label className="field key-field"><span>{custom ? 'Reference' : 'Key'}</span><select id="root" value={state.root} onChange={e => dispatch({ type: 'root', value: Number(e.target.value) })}>{SHARPS.map((_, i) => <option key={i} value={i}>{pitchName(i, state.spelling)}</option>)}</select></label>
            <label className="field scale-field"><span>Scale</span><select id="scale" value={state.scaleId} onChange={e => dispatch({ type: 'scale', value: e.target.value })}>{[...new Set(scaleOptions.map(s => s.group))].map(group => <optgroup key={group} label={group === 'Triads & custom' ? 'Custom' : group}>{scaleOptions.filter(s => s.group === group).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>)}</select></label>
          </div>
          <Segments<StudyMode> label="Study view" value={state.studyMode} options={[{value:'position',label:'Position',disabled:!scale.family,hint:!scale.family?'Requires a scale containing a major or minor pentatonic':undefined},{value:'shape',label:'Shape',disabled:!scale.family,hint:!scale.family?'Requires a pentatonic pattern family':undefined},{value:'diagonal',label:'Diagonal',disabled:!scale.family,hint:!scale.family?'Requires a pentatonic pattern family':undefined},{value:'all',label:'Whole neck'},{value:'string',label:'One string',disabled:!pitches.length},{value:'nps',label:'3 notes/string',disabled:new Set(pitches).size!==7,hint:new Set(pitches).size!==7?'Requires a seven-note scale':undefined}]} onChange={value=>dispatch({type:'study-mode',value})} />
        </div>
        {(!scale.family || new Set(pitches).size !== 7) && <p className="study-availability">{!scale.family && 'Position, Shape and Diagonal require a pentatonic pattern family. '}{new Set(pitches).size !== 7 && '3 notes/string requires a seven-note scale.'}</p>}
        <div className="form-bar">
          {state.studyMode !== 'all' && study && <div className="form-navigation">
            <button className="icon-button" aria-label="Previous form" disabled={choices.length<2} onClick={()=>dispatch({type:'study-step',direction:-1})}>‹</button>
            <div className="form-status" aria-live="polite"><strong>{study?.label ?? 'Whole neck'}</strong><span>{study ? `Frets ${Math.max(0,Math.min(...study.rows.map(r=>r.left)))}–${Math.min(state.frets,Math.max(...study.rows.map(r=>r.right)))}` : 'Select a named scale for forms'}</span></div>
            <button className="icon-button" aria-label="Next form" disabled={choices.length<2} onClick={()=>dispatch({type:'study-step',direction:1})}>›</button>
            {scale.family && (state.studyMode === 'position' || state.studyMode === 'shape') && <div className="form-picker" role="group" aria-label="Pentatonic form">{[1,2,3,4,5].map(form => <button key={form} type="button" aria-label={`Form ${form}`} aria-pressed={study?.form === form} onClick={() => dispatch({type:'form',value:form})}>{form}</button>)}</div>}
            {(state.studyMode==='shape' || state.studyMode==='diagonal') && <Segments<ShapeKind> label="Shape family" value={state.shapeKind} options={[{value:'rectangle',label:<><i className="shape-icon" />Rectangle</>},{value:'stack',label:<><i className="shape-icon stack" />Stack</>}]} onChange={value=>dispatch({type:'shape-kind',value})} />}
          </div>}

        </div>



      </section>

        {scale.family && !['string','nps'].includes(state.studyMode) && state.patterns.length > 0 && !shapes.length && <div className="board-notice" role="status">No patterns fit the current strings and fret range. The notes are still shown.</div>}
        {(state.studyMode === 'diagonal' || state.studyMode === 'all') && <button className="fit-neck" type="button" aria-pressed={fitNeck} onClick={() => setFitNeck(value => !value)}>Fit neck to screen</button>}
        <Fretboard state={state} shapes={shapes} study={study} ghosts={ghosts} fitNeck={fitNeck} onMark={id => dispatch({ type: 'mark', id })} onInspect={setInspected}>
          <div className="board-legend"><div className="legend-items">{(['rectangle','stack'] as const).filter(kind => shapes.some(shape => shape.kind === kind)).map(kind => <span key={kind}><i className={`legend-outline ${kind}`} />{shapeName(kind)}</span>)}{state.ghostForms && state.studyMode === 'position' && <span><i className="legend-outline ghost" />Ghost forms</span>}{state.wholeMap && <span>Whole map</span>}{state.skeleton && <span>Skeleton</span>}{state.warp && !state.fourths && <span>Warp</span>}{state.hideAdded && <span>Pentatonic only</span>}{state.triad !== 'off' && <span className="triad-legend"><i className="legend-triad" />{pitchName(state.triadRoot ?? state.root, state.spelling)} {state.triad} triad</span>}{state.isolatedTones.length > 0 && <span>Degree isolated</span>}{state.marks.length > 0 && <span><i className="legend-note marked" />Marked</span>}</div></div>
        </Fretboard>
        <div className="note-view-bar">
          <div className="label-controls"><span className="field-label">Note view</span><Segments<NoteView> label="Note view" value={state.luckyCharms ? 'charms' : state.labels} options={[{ value: 'none', label: <><span className="view-dot" />Dots</> }, { value: 'charms', label: <><span className="view-charms">● ◆ ■</span>Lucky Charms</> }, { value: 'notes', label: 'Names' }, { value: 'intervals', label: 'Intervals' }, { value: 'both', label: 'Both' }]} onChange={value => dispatch({ type: 'note-view', value })} /></div>
          {!state.luckyCharms && <div className="label-controls"><span className="field-label">Colors</span><Segments<NoteColors> label="Note colors" value={state.degreeColors ? 'degrees' : state.chordColors ? 'chord' : 'root'} options={[{value:'root',label:<><span className="color-preview root-preview">● ● ●</span>Root highlight</>},{value:'degrees',label:<><span className="color-preview degrees-preview">● ● ●</span>Scale degrees</>},{value:'chord',label:<><span className="color-preview chord-preview">● ● ●</span>Chord tones</>}]} onChange={value => dispatch({type:'note-colors',value})} /></div>}
        </div>
      <div className="degree-legend"><p className="degree-legend-heading">{custom ? 'Custom notes' : 'Scale degrees · click to isolate'}</p><section className="tone-strip" aria-label="Scale tones"><div className="tone-strip-heading"><h2>{custom ? 'Custom notes' : 'Scale tones'}</h2><span>{pitches.length} notes</span></div><div className={`tone-sequence ${custom ? 'custom' : ''}`}>
        {custom ? SHARPS.map((_, pitch) => <button key={pitch} className={`tone-chip ${pitches.includes(pitch) ? 'selected' : ''}`} aria-pressed={pitches.includes(pitch)} onClick={() => dispatch({ type: 'pitch', value: pitch })} aria-label={`Toggle ${pitchName(pitch, state.spelling)}`}><strong>{pitchName(pitch, state.spelling)}</strong></button>) : scale.tones.map(t => {
          const isIsolated = state.isolatedTones.includes(t.semitones);
          const isAnyIsolated = state.isolatedTones.length > 0;
          return <button key={`${t.degree}:${t.alteration}`} type="button" className={`tone-chip scale-tone-chip ${isIsolated ? 'isolated' : ''} ${isAnyIsolated && !isIsolated ? 'dimmed' : ''} ${t.semitones === 0 ? 'root' : !t.skeleton ? 'added' : ''}`} aria-pressed={isIsolated} onClick={() => dispatch({ type: 'isolate-tone', value: t.semitones })} aria-label={`${isIsolated ? 'Clear isolation for' : 'Isolate'} ${spellTone(state.root, state.spelling, t).name}, degree ${degreeLabel(t)}`} title={`Click to ${isIsolated ? 'stop isolating' : 'isolate'} ${degreeLabel(t)} across the neck`}><svg className={`degree-marker note-node ${state.luckyCharms ? 'lucky-charm' : ''} ${t.semitones === 0 ? 'root' : 'skeleton'} ${state.degreeColors && !state.luckyCharms && t.semitones !== 0 ? 'degree-colored' : ''} ${state.chordColors && !state.luckyCharms && t.degree === 3 ? 'third' : state.chordColors && !state.luckyCharms && t.degree === 5 ? 'fifth' : ''}`} data-charm-degree={state.luckyCharms ? t.degree : undefined} style={{ '--degree-color': degreeColor(t.degree) } as CSSProperties} viewBox="-17 -17 34 34" aria-hidden="true">{state.luckyCharms ? <Charm degree={t.degree} /> : <circle className="note-face" r="11" />}</svg><strong>{spellTone(state.root, state.spelling, t).name}</strong><span>{degreeLabel(t)}</span></button>;
        })}
      </div><div className="tone-actions">{custom ? <><button onClick={() => dispatch({ type: 'pitches', value: SHARPS.map((_, i) => i) })}>All</button><button onClick={() => dispatch({ type: 'pitches', value: [0, 2, 4, 5, 7, 9, 11] })}>Naturals</button><button onClick={() => dispatch({ type: 'pitches', value: [] })}>Clear</button></> : <>{state.isolatedTones.length > 0 && <button className="tone-action-btn" onClick={() => dispatch({ type: 'clear-isolated-tones' })}>Show all degrees</button>}<button onClick={() => dispatch({ type: 'scale', value: 'custom' })}>Customize notes</button></>}</div></section></div>


      <details className="control-module"><summary>Overlays<span>Patterns and visual guides</span></summary><div className="control-body">
          <div className="map-layers">
            {state.studyMode !== 'all' && <Toggle label="Whole map" checked={state.wholeMap} onChange={()=>dispatch({type:'toggle',key:'wholeMap'})} hint="Show the remaining scale notes quietly behind this form" />}
            {state.studyMode === 'position' && scale.family && <Toggle label="Ghost forms" disabled={state.studyMode!=='position' || !scale.family} checked={state.ghostForms && state.studyMode==='position'} onChange={()=>dispatch({type:'toggle',key:'ghostForms'})} hint="Show adjacent forms as faint dashed outlines to see how they connect" />}
            <Toggle label="Skeleton" checked={state.skeleton} onChange={()=>dispatch({type:'toggle',key:'skeleton'})} hint="Connect the root notes across the neck" />
            {!state.fourths && <Toggle label="Warp" disabled={state.fourths} checked={state.warp && !state.fourths} onChange={()=>dispatch({type:'toggle',key:'warp'})} hint="Show the G–B tuning boundary and one-fret direction" />}
          </div>
            <Toggle label="Notes outside the scale" checked={state.context} onChange={() => dispatch({ type: 'toggle', key: 'context' })} />
            {scale.tones.some(t => !t.skeleton) && <Toggle label="Pentatonic only" checked={state.hideAdded} onChange={() => dispatch({ type: 'toggle', key: 'hideAdded' })} />}
            {scale.family && <div className="pattern-options">            <div className="pattern-selector" role="group" aria-label="Pattern outlines">{(['rectangle','stack'] as const).map(kind=><button type="button" key={kind} className={`pattern-button ${kind}`} aria-pressed={state.patterns.includes(kind)} disabled={!scale.family} onClick={()=>dispatch({type:'pattern',value:kind})}><i className={`shape-icon ${kind}`} />{kind==='rectangle'?'Rectangles':'Stacks'}</button>)}</div>
            <div className="pattern-string-settings"><span className="field-label">Pattern strings</span><div className="row-toggles" role="group" aria-label="Pattern strings">{[1, 2, 3, 4, 5, 6].map(string => <button type="button" key={string} aria-label={`Show patterns on string ${string}`} aria-pressed={state.overlayRows.includes(string)} onClick={() => dispatch({ type: 'overlay-row', value: string })}>{string}</button>)}</div><p>Hide patterns that use an excluded string. Notes stay visible.</p></div>
</div>}
      </div></details>
      <details className="control-module"><summary>Practice tools<span>Triads and fret/string focus</span></summary><div className="control-body">
          <div className="triad-controls"><span className="field-label">Triad</span><Segments<Triad> label="Triad highlight" value={state.triad} options={[{ value: 'off', label: 'Off' }, { value: 'major', label: 'Major' }, { value: 'minor', label: 'Minor' }]} onChange={value => dispatch({ type: 'triad', value })} />{state.triad !== 'off' && <label className="triad-root-field"><span>Root</span><select id="triad-root" aria-label="Triad root" value={state.triadRoot ?? 'key'} onChange={event => dispatch({ type: 'triad-root', value: event.target.value === 'key' ? null : Number(event.target.value) })}><option value="key">Key · {pitchName(state.root, state.spelling)}</option>{SHARPS.map((_, pitch) => <option key={pitch} value={pitch}>{pitchName(pitch, state.spelling)}</option>)}</select></label>}</div>
<button className={`text-button ${focused ? 'is-active' : ''}`} onClick={() => setFocusOpen(!focusOpen)} aria-expanded={focusOpen} aria-controls="focus-panel"><Icon name="focus" />Fret & string focus{focused && <span className="active-badge" />}</button>
      {focusOpen && <section id="focus-panel" className="focus-panel" aria-label="Focus controls">
        <div className="focus-range"><Toggle label="Fret range" checked={state.focus} onChange={() => dispatch({ type: 'toggle', key: 'focus' })} /><label><span className="sr-only">From fret</span><input type="number" min="0" max={state.to} disabled={!state.focus} value={state.from} onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: Math.min(Number(e.target.value), state.to), to: state.to }); }} /></label><span>to</span><label><span className="sr-only">To fret</span><input type="number" min={state.from} max={state.frets} disabled={!state.focus} value={state.to} onChange={e => { if (e.target.value !== '') dispatch({ type: 'range', from: state.from, to: Number(e.target.value) }); }} /></label></div>
        <div className="focus-strings"><span>Strings</span><div role="group" aria-label="Included strings">{[6, 5, 4, 3, 2, 1].map(s => <button key={s} aria-label={`Include string ${s}`} aria-pressed={state.strings.includes(s)} onClick={() => dispatch({ type: 'string', value: s })}>{s}</button>)}</div></div><button className="text-button" onClick={() => dispatch({ type: 'focus-reset' })}>Clear focus</button>
      </section>}

</div></details>
      <details className="control-module"><summary>Instrument & display<span>Tuning, neck and appearance</span></summary><div className="instrument-settings control-body">
            <label className="field"><span>Frets</span><select id="frets" value={state.frets} onChange={e => dispatch({ type: 'frets', value: Number(e.target.value) })}>{[12, 15, 17, 22, 24].map(f => <option key={f} value={f}>{f} frets</option>)}</select></label>
            <label className="field"><span>Lowest string</span><select id="lowest" value={state.lowest} onChange={e => dispatch({ type: 'lowest', value: Number(e.target.value) })}>{LOWEST_STRING_CHOICES.map(c => <option key={c.lowered} value={c.lowered}>{c.label}</option>)}</select></label>
            <Toggle label="All fourths" checked={state.fourths} onChange={() => dispatch({ type: 'toggle', key: 'fourths' })} hint="Tune the B and e strings up a semitone so every string is a fourth apart" />
            <label className="field"><span>Key spelling</span><select id="spelling" value={state.spelling} onChange={e => dispatch({ type: 'spelling', value: e.target.value as 'sharps' | 'flats' })}><option value="sharps">Sharps ♯</option><option value="flats">Flats ♭</option></select></label>
            <Toggle label="Dark mode" checked={darkMode} onChange={() => setDarkMode(value => !value)} />
            <Toggle label="String names" checked={state.stringNames} onChange={() => dispatch({ type: 'toggle', key: 'stringNames' })} />

            <Toggle label="Left-handed" checked={state.leftHanded} onChange={() => dispatch({ type: 'toggle', key: 'leftHanded' })} />
</div></details>


      <div className="inspection-row"><div className="note-inspector" role="status" aria-live="polite">{inspection && inspected ? <><strong>{inspection.name}<small>{inspection.octave}</small></strong><span>Degree {inspection.interval}</span><span>String {inspected.split(':')[0]} · {inspected.endsWith(':0') ? 'Open' : `Fret ${inspected.split(':')[1]}`}</span></> : <span>Select a note to inspect or mark it</span>}</div><span className="keyboard-hint"><kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> navigate <span>·</span> <kbd>enter</kbd> mark</span></div>
      </section>
      {state.marks.length > 0 && <section className="marks-panel" aria-label="Marked positions"><div className="marks-title"><h2>{state.marks.length} marked {state.marks.length === 1 ? 'position' : 'positions'}</h2><button className="text-button" onClick={() => dispatch({ type: 'clear-marks' })}>Clear marks</button></div><div className="marks-list">{state.marks.map(id => { const [s, f] = id.split(':').map(Number); const d = describeNote(position(s, f, tuning), state.root, scale, state.spelling); return <button key={id} onClick={() => dispatch({ type: 'mark', id })} aria-label={`Remove marked ${d.name}${d.octave}, string ${s}, fret ${f}`}><strong>{d.name}<small>{d.octave}</small></strong><span>S{s} · {f === 0 ? 'Open' : `F${f}`}{f > state.frets ? ' · off screen' : ''}</span><Icon name="close" /></button>; })}</div></section>}
      {manualLink && <label className="manual-link">View link<input readOnly value={manualLink} onFocus={e => e.target.select()} /></label>}
      <footer className="page-footer"><div className="studio-utilities"><button className="text-button theme-button" aria-pressed={darkMode} onClick={() => setDarkMode(value => !value)}>{darkMode ? '☀ Light' : '☾ Dark'}</button></div><span>{storageWorks ? 'Saved on this device' : 'Storage unavailable · use Share view'}</span></footer>
    </main>
    {shareMessage && <div className="toast" role="status">{shareMessage}</div>}
      <dialog ref={guide} className="guide-dialog" onClose={() => guideButton.current?.focus()} onClick={e => { if (e.target === e.currentTarget) guide.current?.close(); }}><div className="guide-content"><div className="dialog-heading"><h2>Read the relationships.</h2><button className="icon-button" aria-label="Close guide" onClick={() => guide.current?.close()}><Icon name="close" /></button></div><dl><dt>Study one form at a time.</dt><dd>Rectangles connect two rows of notes three frets apart. Stacks connect three rows of notes two frets apart. Use Position for a complete playing position, Shape for a single rectangle or stack, Diagonal for a chain of the same shape, and Whole neck to see the entire neck at full strength. Shared red and blue boundaries show both colors. The arrows step through the positions available on this neck.</dd><dt>Choose how much of the neck to see.</dt><dd>Whole map adds the other scale notes quietly behind your current form. Skeleton connects root notes across the neck. Ghost forms show neighboring positions. Pentatonic only hides added scale tones. Focus limits strings and frets. Pattern strings hides whole patterns that touch an excluded string.</dd><dt>Warp across the G–B boundary.</dt><dd>Warp is a thin guide across the G–B boundary. It marks the one-fret shift toward the bridge when crossing from G to B. Diagonal joins already account for the shift; turning Warp off hides the guide without changing notes.</dd><dt>Highlight a triad independently.</dt><dd>Choose Major or Minor in the Triad control. Its root follows the key, or choose another root. Green halos show the chord tones across the neck, including tones outside the current scale or custom notes. The scale, patterns, and marks stay intact. Turn it Off to return to the underlying note map.</dd><dt>Mark your own positions.</dt><dd>Click or press Enter to mark a note. Marks survive key changes and display resets. Custom notes remain fixed when you change their reference key.</dd><dt>Navigate without labels.</dt><dd>Tab into the board. Arrow keys move across strings and frets. Home goes to the nut; End goes to the final fret. Every position retains its full accessible description.</dd></dl><p className="guide-footnote">At the outer strings, short extensions show where a pattern continues. Forms keep their musical identity when you change key; the same patterns repeat an octave higher. Your view and marked positions are saved on this device. Use Share view to copy the current setup.</p></div></dialog>
  </>;
}
