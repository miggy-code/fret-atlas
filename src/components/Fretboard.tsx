import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { boardGeometry, CELL, HIT_SIZE, shapePath, sharedShapePath, ROW } from '../core/geometry';
import { position, pitchName } from '../core/music';
import { Charm } from './Charm';
import { degreeColor, notePresentation } from '../core/presentation';
import { insideShape } from '../core/shapes';
import type { Shape } from '../core/shapes';
import type { State } from '../core/state';
import { inFocus, shapeInFocus } from '../core/state';
import { rootConnections, tuningOf } from '../core/study';
import type { Study } from '../core/study';
import type { DrillView } from './Drill';

interface Props { state: State; shapes: Shape[]; study: Study | undefined; ghosts: Study[]; fitNeck?: boolean; drill?: DrillView; playing?: string | null; children?: ReactNode; onMark: (id: string) => void; onInspect: (id: string) => void }

export function Fretboard({ state, shapes, study, ghosts, fitNeck: fitRequested = false, drill, playing, children, onMark, onInspect }: Props) {
  // Fitting only applies to the wide views that offer the toggle.
  const fitNeck = fitRequested && (state.studyMode === 'diagonal' || state.studyMode === 'all');
  const geo = useMemo(() => boardGeometry(state.frets, state.leftHanded), [state.frets, state.leftHanded]);
  const ghostShapes = useMemo(() => {
    if (!state.ghostForms || state.studyMode !== 'position') return [];
    return ghosts.flatMap(g => g.shapes).filter(shape => state.patterns.includes(shape.kind) && shapeInFocus(state, shape) && shape.rows.every(r => state.overlayRows.includes(r.string)));
  }, [ghosts, state.ghostForms, state.studyMode, state.patterns, state.strings, state.focus, state.from, state.to, state.overlayRows]);
  const sharedRails = useMemo(()=>sharedShapePath(shapes,geo),[shapes,geo]);
  const roots = useMemo(()=>rootConnections(state).filter(({a,b})=>inFocus(state,a.string,a.fret)&&inFocus(state,b.string,b.fret)),[state]);
  const tuning = useMemo(()=>tuningOf(state),[state.lowest,state.fourths]);
  const patternClip = useId();
  const [emphasized, setEmphasized] = useState<string | null>(null);
  // Each new form fades its outlines in and sweeps its notes in from the left.
  const [entering, setEntering] = useState(true);
  const studyLeft = study ? Math.max(0, Math.min(...study.rows.map(row => row.left))) : 0;
  useEffect(() => {
    setEntering(true);
    const timer = setTimeout(() => setEntering(false), 900);
    return () => clearTimeout(timer);
  }, [study?.id]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState('1:5');
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const nodes = useRef(new Map<string, SVGGElement>());
  const frets = Array.from({ length: state.frets + 1 }, (_, i) => i);
  const patternLayers = (['rectangle', 'stack'] as const).map(kind => ({ kind, shapes: shapes.filter(shape => shape.kind === kind) }));

  useEffect(() => {
    const [string, fret] = cursor.split(':').map(Number);
    if (fret > state.frets) setCursor(`${string}:${state.frets}`);
  }, [state.frets, cursor]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateEdges = () => setScrollEdges({ left: el.scrollLeft > 3, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 3 });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    el.addEventListener('scroll', updateEdges, { passive: true });
    updateEdges();
    return () => { observer.disconnect(); el.removeEventListener('scroll', updateEdges); };
  }, [geo]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !study) return;
    if (state.studyMode==='all') { el.scrollLeft=state.leftHanded?el.scrollWidth:0; return; }
    const svg = el.querySelector('svg');
    if (!svg) return;
    const first = Math.min(...study.rows.map(row=>row.left));
    const last = Math.min(state.frets,Math.max(...study.rows.map(row=>row.right)));
    const scale = svg.getBoundingClientRect().width / geo.width;
    el.scrollLeft = fitNeck ? 0 : Math.max(0, (geo.x(first)+geo.x(last))/2 * scale - el.clientWidth/2);
  }, [study?.id, state.studyMode, state.shapeKind, state.frets, geo, fitNeck]);

  function navigate(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onMark(id); return; }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let [string, fret] = id.split(':').map(Number);
    if (event.key === 'ArrowUp') string--;
    if (event.key === 'ArrowDown') string++;
    if (event.key === 'ArrowLeft') fret += state.leftHanded ? 1 : -1;
    if (event.key === 'ArrowRight') fret += state.leftHanded ? -1 : 1;
    if (event.key === 'Home') fret = 0;
    if (event.key === 'End') fret = state.frets;
    const next = `${Math.max(1, Math.min(6, string))}:${Math.max(0, Math.min(state.frets, fret))}`;
    setCursor(next);
    const node = nodes.current.get(next);
    node?.focus({ preventScroll: true });
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // A fitted diagonal crops to its own frets, mirrored or not, with room for string names.
  const fitXs = fitNeck && study && state.studyMode === 'diagonal' ? study.rows.flatMap(row => [geo.x(Math.max(0, row.left)), geo.x(Math.min(state.frets, row.right))]) : [];
  const fitLeft = fitXs.length ? Math.max(0, Math.min(...fitXs) - 52) : 0;
  const fitRight = fitXs.length ? Math.min(geo.width, Math.max(...fitXs) + 52) : geo.width;
  const labelX = state.leftHanded ? fitRight < geo.width ? fitRight - 16 : geo.labelX : fitLeft > 0 ? fitLeft + 16 : geo.labelX;
  return <div className={`board-shell ${scrollEdges.left ? 'has-left' : ''} ${scrollEdges.right ? 'has-right' : ''}`} onPointerLeave={() => setEmphasized(null)}>
    <div ref={scrollRef} className="board-scroll" role="region" aria-label="Fretboard. Tab to a note; arrow keys navigate, Enter marks. Scroll horizontally for more frets.">
      <svg className={`fretboard ${shapes.length ? 'has-patterns' : ''} ${state.studyMode === 'all' ? 'is-whole-neck' : ''} ${drill ? 'is-drilling' : entering ? 'form-enter' : ''} ${drill?.complete ? 'drill-complete' : ''}`} role="group" aria-label="Interactive six-string guitar fretboard" viewBox={`${fitLeft} 0 ${fitRight-fitLeft} ${geo.height}`} style={fitNeck ? { width: '100%', maxWidth: fitRight - fitLeft, overflow: 'hidden' } : { minWidth: geo.width }} data-labels={state.labels} data-handedness={state.leftHanded ? 'left' : 'right'}>
        <title>Guitar fretboard, high strings above, nut {state.leftHanded ? 'right' : 'left'}</title>
        <defs>
          {/* Patterns may reach past the open notes, but stop at the last fret so cut-off shapes end on the neck. */}
          <clipPath id={patternClip}><rect x={state.leftHanded ? geo.end : geo.x(0) - 16} y="0" width={Math.abs(geo.end - geo.x(0)) + 16} height={geo.height} /></clipPath>
        </defs>
        <g aria-hidden="true" className="neck-base">
          <rect x={Math.min(geo.nut, geo.end)} y={geo.y(1) - 23} width={Math.abs(geo.end - geo.nut)} height={ROW * 5 + 46} rx="2" fill="var(--neck)" />
          {frets.map(fret => <g key={fret}>
            <text className={`fret-number ${fret === 0 ? 'open-fret' : ''}`} x={geo.x(fret)} y="22" textAnchor="middle">{fret === 0 ? 'OPEN' : fret}</text>
            <line className={fret === 0 ? 'nut' : 'fret-wire'} x1={geo.line(fret)} x2={geo.line(fret)} y1={geo.y(1) - 23} y2={geo.y(6) + 23} />
          </g>)}
          {frets.filter(f => [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f)).map(f => <g key={f} className="inlay" data-inlay-fret={f}>
            {/* Physical position markers live on a separate bottom rail. */}
            {(f % 12 === 0 ? [-4, 4] : [0]).map(dx => <circle key={dx} cx={geo.x(f) + dx} cy={geo.y(6) + 43} r="2.5" />)}
          </g>)}
          {tuning.midi.map((midi, i) => <g key={i}>
            <line className="guitar-string" x1={geo.x(0)} x2={geo.end} y1={geo.y(i + 1)} y2={geo.y(i + 1)} strokeWidth={0.8 + i * .25} />
            {state.stringNames && <text className="string-name" x={labelX} y={geo.y(i + 1) + 4} textAnchor="middle">{i === 0 ? pitchName(midi, state.spelling).toLowerCase() : pitchName(midi, state.spelling)}</text>}
          </g>)}
        </g>
        {state.warp && !state.fourths && <g className="warp-guide" role="img" aria-label="Warp: one-fret shift across the G–B boundary">
          <rect className="warp-band" x={Math.min(geo.nut,geo.end)} y={(geo.y(2)+geo.y(3))/2-8} width={Math.abs(geo.end-geo.nut)} height="16" />
          <title>Warp marks the one-fret shift toward the bridge when crossing from G to B.</title>
          <line x1={geo.nut} x2={geo.end} y1={(geo.y(2) + geo.y(3)) / 2} y2={(geo.y(2) + geo.y(3)) / 2} />
          {/* The shift reads in the label gutter, away from the notes on frets 1–2. */}
          <text className="warp-label" x={labelX} y={(geo.y(2) + geo.y(3)) / 2 + 4} textAnchor="middle">+1</text>
        </g>}
        {drill && <g className="drill-zone" aria-hidden="true">{drill.drill.zone.map(row => {
          const left = Math.min(geo.x(row.left), geo.x(row.right)) - CELL / 2 + 4;
          return <rect key={row.string} x={left} y={geo.y(row.string) - ROW / 2 + 5} width={Math.abs(geo.x(row.right) - geo.x(row.left)) + CELL - 8} height={ROW - 10} rx="10" />;
        })}</g>}
        {state.skeleton && <g className="root-skeleton" aria-hidden="true">{roots.map(({a,b})=><line key={`${a.id}-${b.id}`} data-from={a.id} data-to={b.id} x1={geo.x(a.fret)} y1={geo.y(a.string)} x2={geo.x(b.fret)} y2={geo.y(b.string)} vectorEffect="non-scaling-stroke" />)}</g>}
        {state.ghostForms && ghostShapes.length > 0 && <g className="ghost-pattern-layer" aria-hidden="true" clipPath={`url(#${patternClip})`}>
          {ghostShapes.map(shape => <path key={`ghost:${shape.id}`} className={`shape-ghost-outline ${shape.kind}`} data-ghost-shape-id={shape.id} d={shapePath(shape, geo)} vectorEffect="non-scaling-stroke" />)}
        </g>}
        <g className="pattern-halos" aria-hidden="true" clipPath={`url(#${patternClip})`}>
          {patternLayers.flatMap(({ kind, shapes }) => shapes.map(shape => <path key={shape.id} className={`shape-halo ${kind}`} d={shapePath(shape, geo)} vectorEffect="non-scaling-stroke" />))}
        </g>
        {patternLayers.map(({ kind, shapes }) => <g key={kind} className={`pattern-layer ${kind}`} aria-hidden="true" clipPath={`url(#${patternClip})`}>
          {shapes.map(shape => <path key={shape.id} className={`shape-outline ${kind} ${emphasized && shape.endpoints.includes(emphasized) ? 'is-emphasized' : ''}`} data-shape-id={shape.id} data-partial={shape.partial || undefined} d={shapePath(shape, geo)} vectorEffect="non-scaling-stroke" />)}
        </g>)}
        {sharedRails && <g className="shared-rails" aria-hidden="true" clipPath={`url(#${patternClip})`}>
          <path className="shared-rail rectangle" d={sharedRails} vectorEffect="non-scaling-stroke" />
          <path className="shared-rail stack" d={sharedRails} vectorEffect="non-scaling-stroke" />
        </g>}
        {tuning.midi.flatMap((_, i) => frets.map(fret => {
          const note = position(i + 1, fret, tuning);
          const p = notePresentation(note, state, shapes, study, ghosts);
          const charmDegree = state.luckyCharms && p.selected ? p.tone?.degree : undefined;
          const degreeHue = !state.luckyCharms && state.degreeColors && p.selected && p.kind !== 'root' && p.tone ? degreeColor(p.tone.degree) : undefined;
          const toneColor = p.tone ? degreeColor(p.tone.degree) : undefined;
          const chordTone = !state.luckyCharms && degreeHue === undefined && state.chordColors && p.selected && (p.tone?.degree === 3 || p.tone?.degree === 5) ? p.tone.degree === 3 ? 'third' : 'fifth' : '';
          const label = state.labels === 'intervals' ? p.interval : p.name;
          // While drilling, only answers already found are drawn, and nothing names a hidden note.
          const drillFound = drill?.found.includes(note.id) ?? false;
          const drillMiss = drill?.miss === note.id;
          const visible = drill ? drillFound || drillMiss : p.visible;
          const aria = drill && !drillFound ? `String ${note.string}, ${fret === 0 ? 'open' : `fret ${fret}`}` : p.aria;
          return <g key={note.id} ref={node => { if (node) nodes.current.set(note.id, node); else nodes.current.delete(note.id); }}
            role="button" tabIndex={cursor === note.id ? 0 : -1} aria-label={aria} aria-pressed={drill ? undefined : p.marked}
            data-note-id={note.id} data-active={p.active ? 'true' : 'false'} data-triad={p.triad ? 'true' : undefined} data-tone-kind={p.kind} data-shape-member={p.member ? 'true' : undefined} data-visible={visible ? 'true' : 'false'} data-drill={drillFound ? 'found' : drillMiss ? 'miss' : undefined}
            data-charm-degree={charmDegree}
            className={`note-node ${charmDegree ? 'lucky-charm' : ''} ${p.kind} ${chordTone} ${degreeHue === undefined ? '' : 'degree-colored'} ${visible ? '' : 'is-hidden'} ${drillFound ? 'is-drill-found' : ''} ${drillMiss ? 'is-drill-miss' : ''} ${playing === note.id ? 'is-playing' : ''} ${p.background && !p.marked && !p.triad ? 'is-background' : ''} ${p.marked ? 'is-marked' : ''} ${p.triad ? 'is-triad' : ''} ${p.member ? 'is-member' : ''} ${p.run ? 'is-run' : ''} ${p.ghost ? 'is-ghost' : ''} ${p.degreeDimmed ? 'is-degree-dimmed' : ''} ${p.isolated && visible ? 'is-degree-isolated' : ''} ${state.labels === 'both' ? 'both-labels' : ''}`}
            transform={`translate(${geo.x(fret)},${geo.y(i + 1)})`} style={{ '--note-label-size': label.length > 2 ? '11px' : '13px', '--wave': Math.abs(fret - studyLeft), ...(toneColor === undefined ? {} : { '--degree-color': toneColor }) } as CSSProperties}
            onFocus={() => { setCursor(note.id); setEmphasized(note.id); onInspect(note.id); }} onPointerEnter={() => { setEmphasized(note.id); onInspect(note.id); }}
            onClick={() => { setCursor(note.id); onInspect(note.id); onMark(note.id); }} onKeyDown={event => navigate(event, note.id)}>
            <title>{aria}</title>
            <rect className="note-hit" x={-HIT_SIZE / 2} y={-HIT_SIZE / 2} width={HIT_SIZE} height={HIT_SIZE} rx="7" />
            <rect className="focus-ring" x="-20" y="-20" width="40" height="40" rx="9" />
            <rect className="mark-ring" x="-17" y="-17" width="34" height="34" rx="7" />
            <g className="note-symbol">
              {drillMiss ? <><circle className="note-face" r="11" /><path className="miss-cross" d="M-4,-4 4,4M4,-4-4,4" /></>
                : p.kind === 'context' && !p.marked && !p.triad
                ? <circle className="note-face" r="3" />
                : charmDegree ? <Charm degree={charmDegree} />
                : state.labels === 'none' ? <circle className="note-face" r={p.kind === 'root' ? 12 : 11} />
                : <rect className="note-face" x="-15" y="-15" width="30" height="30" rx="5" />}
              {p.triad && <circle className="triad-halo" r="18" />}
              {(drillFound || playing === note.id) && <circle className="note-burst" r="13" />}
              {!drillMiss && state.labels !== 'none' && (p.selected || p.marked || p.triad) && <text className="note-label" textAnchor="middle" dominantBaseline="central" y={state.labels === 'both' ? -5 : 0}>{label}</text>}
              {!drillMiss && state.labels === 'both' && (p.selected || p.marked || p.triad) && <text className="note-interval" textAnchor="middle" y="10">{p.interval}</text>}
              {!drillMiss && state.labels === 'none' && (charmDegree === undefined || charmDegree === 1) && p.kind === 'root' && <circle r="2.7" className="root-center" />}
            </g>
          </g>;
        }))}
        {(() => {
          const tipId = emphasized;
          if (!tipId || drill) return null;
          const [tipString, tipFret] = tipId.split(':').map(Number);
          if (!tipString || isNaN(tipFret)) return null;
          const tipNote = position(tipString, tipFret, tuning);
          const tipP = notePresentation(tipNote, state, shapes, study, ghosts);
          if (!tipP.visible && !tipP.marked && !tipP.triad) return null;
          const tipMembership = shapes.filter(s => insideShape(tipString, tipFret, s));
          const tipMemberLabel = [...new Set(tipMembership.map(s => s.kind === 'rectangle' ? 'Rectangle' : 'Stack'))].join(' & ');
          return <NoteTooltip noteId={tipId} x={geo.x(tipFret)} y={tipString === 1 ? geo.y(1) + TIP_OFFSET : geo.y(tipString) - TIP_OFFSET} maxX={geo.width}
            pitch={tipP.name} octave={tipP.octave} degree={tipP.kind === 'root' ? 'Root' : `Deg ${tipP.interval}`} member={tipMemberLabel} />;
        })()}
      </svg>
    </div>
    {children}
    {(scrollEdges.left || scrollEdges.right) && <div className="scroll-cue" aria-hidden="true">{scrollEdges.left ? '← ' : ''}Scroll fretboard{scrollEdges.right ? ' →' : ''}</div>}
  </div>;
}

// Clears the hover ring (±21 with its stroke) and stops short of the neighboring string's markers (54 − 12).
const TIP_OFFSET = 31;

/** A one-line chip centered between strings; its box is measured from the text so long labels never spill out. */
function NoteTooltip({ noteId, x, y, maxX, pitch, octave, degree, member }: { noteId: string; x: number; y: number; maxX: number; pitch: string; octave: number; degree: string; member: string }) {
  const text = useRef<SVGTextElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  useLayoutEffect(() => { setTextWidth(text.current?.getComputedTextLength() ?? 0); }, [pitch, octave, degree, member]);
  const width = Math.ceil(textWidth) + 20;
  const height = 18;
  const left = Math.max(8, Math.min(maxX - width - 8, x - width / 2));
  return <g className="inline-note-tooltip" data-tooltip-note={noteId} transform={`translate(${left},${y})`} pointerEvents="none" aria-hidden="true" visibility={textWidth ? 'visible' : 'hidden'}>
    <rect x={0} y={-height / 2} width={width} height={height} rx="5" className="tooltip-box" />
    <text ref={text} className="tooltip-line-main" x={width / 2} textAnchor="middle" dominantBaseline="central">
      <tspan className="tooltip-pitch">{pitch}</tspan>
      <tspan className="tooltip-octave">{octave}</tspan>
      <tspan className="tooltip-sep"> · </tspan>
      <tspan className="tooltip-degree">{degree}</tspan>
      {member ? <tspan className="tooltip-member">{` · ${member}`}</tspan> : null}
    </text>
  </g>;
}
