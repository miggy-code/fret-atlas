import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { arrowStep, boardGeometry, ROW, shapePath, sharedShapePath } from '../core/geometry';
import type { Point } from '../core/geometry';
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
import { useBoardOrientation } from './useBoardOrientation';

interface Props { state: State; shapes: Shape[]; study: Study | undefined; ghosts: Study[]; fitNeck?: boolean; drill?: DrillView; playing?: string | null; children?: ReactNode; onMark: (id: string) => void; onInspect: (id: string) => void }

export function Fretboard({ state, shapes, study, ghosts, fitNeck: fitRequested = false, drill, playing, children, onMark, onInspect }: Props) {
  const orientation = useBoardOrientation();
  const vertical = orientation === 'vertical';
  // Fitting only applies to the wide views that offer the toggle; a vertical neck already fits its width.
  const fitNeck = fitRequested && !vertical && (state.studyMode === 'diagonal' || state.studyMode === 'all');
  const geo = useMemo(() => boardGeometry(state.frets, state.leftHanded, orientation), [state.frets, state.leftHanded, orientation]);
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
  const formSpan = useRef<SVGRectElement>(null);
  const shownForm = useRef(study?.id);
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
    el.scrollLeft = fitNeck ? 0 : Math.max(0, (geo.at(first, 1).x + geo.at(last, 1).x)/2 * scale - el.clientWidth/2);
  }, [study?.id, state.studyMode, state.shapeKind, state.frets, geo, fitNeck]);

  // A vertical neck scrolls with the page, so a form picked below the fold is brought into view. The first
  // render is left alone: the page opens at its top.
  useEffect(() => {
    if (shownForm.current === study?.id) return;
    shownForm.current = study?.id;
    if (!vertical || state.studyMode === 'all') return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formSpan.current?.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
  }, [study?.id, vertical, state.studyMode]);

  function navigate(event: KeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onMark(id); return; }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let [string, fret] = id.split(':').map(Number);
    // Arrows follow what the screen shows, whichever way the neck is drawn.
    const step = arrowStep(geo, event.key);
    if (step) { string += step.string; fret += step.fret; }
    if (event.key === 'Home') fret = 0;
    if (event.key === 'End') fret = state.frets;
    const next = `${Math.max(1, Math.min(6, string))}:${Math.max(0, Math.min(state.frets, fret))}`;
    setCursor(next);
    const node = nodes.current.get(next);
    node?.focus({ preventScroll: true });
    node?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  // A fitted diagonal crops to its own frets, mirrored or not, with room for string names.
  const fitXs = fitNeck && study && state.studyMode === 'diagonal' ? study.rows.flatMap(row => [geo.at(Math.max(0, row.left), 1).x, geo.at(Math.min(state.frets, row.right), 1).x]) : [];
  const fitLeft = fitXs.length ? Math.max(0, Math.min(...fitXs) - 52) : 0;
  const fitRight = fitXs.length ? Math.min(geo.width, Math.max(...fitXs) + 52) : geo.width;
  const view = fitNeck ? { x: fitLeft, y: 0, width: fitRight - fitLeft, height: geo.height } : geo.box;
  // String names and the Warp label share one margin line, which a fitted (cropped) diagonal pulls in with its view.
  const nameGutter = geo.project(geo.labelAlong, 0).x;
  const nameAt = (across: number): Point => {
    const point = geo.project(geo.labelAlong, across);
    if (!fitNeck) return point;
    return { x: state.leftHanded ? fitRight < geo.width ? fitRight - 16 : nameGutter : fitLeft > 0 ? fitLeft + 16 : nameGutter, y: point.y };
  };
  const wireEnds = (fret: number): [Point, Point] => [geo.project(geo.wire(fret), geo.across(1) - 23), geo.project(geo.wire(fret), geo.across(6) + 23)];
  const neck = geo.rect(geo.wire(0), geo.wire(state.frets), geo.across(1) - 23, geo.across(6) + 23);
  const warpAcross = (geo.across(2) + geo.across(3)) / 2;
  const warpBand = geo.rect(geo.wire(0), geo.wire(state.frets), warpAcross - 8, warpAcross + 8);
  const warpLine = [geo.project(geo.wire(0), warpAcross), geo.project(geo.wire(state.frets), warpAcross)];
  const warpLabel = nameAt(warpAcross);
  // Text is positioned in screen space and never rotated; its baseline drops a little to sit centered on the point.
  const numberAt = (fret: number) => geo.project(geo.along(fret), geo.numberAcross);
  return <div data-orientation={orientation} className={`board-shell ${scrollEdges.left ? 'has-left' : ''} ${scrollEdges.right ? 'has-right' : ''}`} onPointerLeave={() => setEmphasized(null)}>
    <div ref={scrollRef} className="board-scroll" role="region" aria-label={`Fretboard. Tab to a note; arrow keys navigate, Enter marks. ${vertical ? 'Scroll the page for more frets.' : 'Scroll horizontally for more frets.'}`}>
      <svg className={`fretboard ${shapes.length ? 'has-patterns' : ''} ${state.studyMode === 'all' ? 'is-whole-neck' : ''} ${drill ? 'is-drilling' : entering ? 'form-enter' : ''} ${drill?.complete ? 'drill-complete' : ''}`} role="group" aria-label="Interactive six-string guitar fretboard" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} style={fitNeck ? { width: '100%', maxWidth: fitRight - fitLeft, overflow: 'hidden' } : { '--board-width': vertical ? view.width : geo.width } as CSSProperties} data-labels={state.labels} data-handedness={state.leftHanded ? 'left' : 'right'} data-orientation={orientation}>
        <title>{vertical
          ? `Guitar fretboard, nut at top, ${state.leftHanded ? 'high' : 'low'} strings on the left`
          : `Guitar fretboard, high strings above, nut ${state.leftHanded ? 'right' : 'left'}`}</title>
        <defs>
          {/* Patterns may reach past the open notes, but stop at the last fret so cut-off shapes end on the neck. */}
          <clipPath id={patternClip}><rect {...geo.rect(geo.along(0) - 16, geo.wire(state.frets), 0, geo.breadth)} /></clipPath>
        </defs>
        <g aria-hidden="true" className="neck-base">
          <rect {...neck} rx="2" fill="var(--neck)" />
          {frets.map(fret => {
            const [start, end] = wireEnds(fret);
            const number = numberAt(fret);
            return <g key={fret}>
              <text className={`fret-number ${fret === 0 ? 'open-fret' : ''}`} x={number.x} y={number.y} dy={vertical ? '.35em' : undefined} textAnchor="middle">{fret === 0 ? 'OPEN' : fret}</text>
              <line className={fret === 0 ? 'nut' : 'fret-wire'} x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
            </g>;
          })}
          {frets.filter(f => [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(f)).map(f => <g key={f} className="inlay" data-inlay-fret={f}>
            {/* Physical position markers live on a separate rail beside the neck. */}
            {(f % 12 === 0 ? [-4, 4] : [0]).map(offset => {
              const dot = geo.project(geo.along(f) + offset, geo.inlayAcross);
              return <circle key={offset} cx={dot.x} cy={dot.y} r="2.5" />;
            })}
          </g>)}
          {tuning.midi.map((midi, i) => {
            const from = geo.project(geo.along(0), geo.across(i + 1)), to = geo.project(geo.wire(state.frets), geo.across(i + 1));
            const name = nameAt(geo.across(i + 1));
            return <g key={i}>
              <line className="guitar-string" x1={from.x} x2={to.x} y1={from.y} y2={to.y} strokeWidth={0.8 + i * .25} />
              {state.stringNames && <text className="string-name" x={name.x} y={name.y + 4} textAnchor="middle">{i === 0 ? pitchName(midi, state.spelling).toLowerCase() : pitchName(midi, state.spelling)}</text>}
            </g>;
          })}
        </g>
        {state.warp && !state.fourths && <g className="warp-guide" role="img" aria-label="Warp: one-fret shift across the G–B boundary">
          <rect className="warp-band" {...warpBand} />
          <title>Warp marks the one-fret shift toward the bridge when crossing from G to B.</title>
          <line x1={warpLine[0].x} x2={warpLine[1].x} y1={warpLine[0].y} y2={warpLine[1].y} />
          {/* The shift reads in the label gutter, away from the notes on frets 1–2. */}
          <text className="warp-label" x={warpLabel.x} y={warpLabel.y + 4} textAnchor="middle">+1</text>
        </g>}
        {drill && <g className="drill-zone" aria-hidden="true">{drill.drill.zone.map(row => {
          const zone = geo.rect(geo.along(Math.min(row.left, row.right)) - geo.cell / 2 + 4, geo.along(Math.max(row.left, row.right)) + geo.cell / 2 - 4, geo.across(row.string) - ROW / 2 + 5, geo.across(row.string) + ROW / 2 - 5);
          return <rect key={row.string} {...zone} rx="10" />;
        })}</g>}
        {vertical && study && state.studyMode !== 'all' && <rect ref={formSpan} className="form-span" aria-hidden="true" {...geo.rect(geo.along(Math.max(0, Math.min(...study.rows.map(row => row.left)))) - geo.cell / 2, geo.along(Math.min(state.frets, Math.max(...study.rows.map(row => row.right)))) + geo.cell / 2, geo.across(1) - ROW / 2, geo.across(6) + ROW / 2)} />}
        {state.skeleton && <g className="root-skeleton" aria-hidden="true">{roots.map(({a,b})=>{
          const from = geo.at(a.fret, a.string), to = geo.at(b.fret, b.string);
          return <line key={`${a.id}-${b.id}`} data-from={a.id} data-to={b.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} vectorEffect="non-scaling-stroke" />;
        })}</g>}
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
          const assisted = !!drill && (drill.hint === note.id || (drill.revealed && drill.drill.targets.includes(note.id)));
          const visible = drill ? drillFound || drillMiss || assisted : p.visible;
          const aria = drill && !drillFound ? `String ${note.string}, ${fret === 0 ? 'open' : `fret ${fret}`}` : p.aria;
          return <g key={note.id} ref={node => { if (node) nodes.current.set(note.id, node); else nodes.current.delete(note.id); }}
            role="button" tabIndex={cursor === note.id ? 0 : -1} aria-label={aria} aria-pressed={drill ? undefined : p.marked}
            data-note-id={note.id} data-active={p.active ? 'true' : 'false'} data-triad={p.triad ? 'true' : undefined} data-tone-kind={p.kind} data-shape-member={p.member ? 'true' : undefined} data-visible={visible ? 'true' : 'false'} data-drill={drillFound ? 'found' : drillMiss ? 'miss' : undefined}
            data-charm-degree={charmDegree}
            className={`note-node ${charmDegree ? 'lucky-charm' : ''} ${p.kind} ${chordTone} ${degreeHue === undefined ? '' : 'degree-colored'} ${visible ? '' : 'is-hidden'} ${drillFound ? 'is-drill-found' : ''} ${assisted ? 'is-drill-hint' : ''} ${drillMiss ? 'is-drill-miss' : ''} ${playing === note.id ? 'is-playing' : ''} ${p.background && !p.marked && !p.triad ? 'is-background' : ''} ${p.marked ? 'is-marked' : ''} ${p.triad ? 'is-triad' : ''} ${p.member ? 'is-member' : ''} ${p.run ? 'is-run' : ''} ${p.ghost ? 'is-ghost' : ''} ${p.degreeDimmed ? 'is-degree-dimmed' : ''} ${p.isolated && visible ? 'is-degree-isolated' : ''} ${state.labels === 'both' ? 'both-labels' : ''}`}
            transform={`translate(${geo.at(fret, i + 1).x},${geo.at(fret, i + 1).y})`} style={{ '--note-label-size': label.length > 2 ? '11px' : '13px', '--wave': Math.abs(fret - studyLeft), ...(toneColor === undefined ? {} : { '--degree-color': toneColor }) } as CSSProperties}
            onFocus={() => { setCursor(note.id); setEmphasized(note.id); onInspect(note.id); }} onPointerEnter={() => { setEmphasized(note.id); onInspect(note.id); }}
            onClick={() => { setCursor(note.id); onInspect(note.id); onMark(note.id); }} onKeyDown={event => navigate(event, note.id)}>
            <title>{aria}</title>
            <rect className="note-hit" x={-geo.hit.width / 2} y={-geo.hit.height / 2} width={geo.hit.width} height={geo.hit.height} rx="7" />
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
          // The chip sits above its note, or below it where the header is above: the first string when horizontal, the open fret when vertical.
          const tipPoint = geo.at(tipFret, tipString);
          const below = vertical ? tipFret === 0 : tipString === 1;
          return <NoteTooltip noteId={tipId} x={tipPoint.x} y={tipPoint.y + (below ? TIP_OFFSET : -TIP_OFFSET)} minX={geo.box.x} maxX={geo.box.x + geo.box.width}
            pitch={tipP.name} octave={tipP.octave} degree={tipP.kind === 'root' ? 'Root' : `Deg ${tipP.interval}`} member={tipMemberLabel} />;
        })()}
      </svg>
    </div>
    {children}
    {!vertical && (scrollEdges.left || scrollEdges.right) && <div className="scroll-cue" aria-hidden="true">{scrollEdges.left ? '← ' : ''}Scroll fretboard{scrollEdges.right ? ' →' : ''}</div>}
  </div>;
}

// Clears the hover ring (±21 with its stroke) and stops short of the neighboring string's markers (54 − 12).
const TIP_OFFSET = 31;

/** A one-line chip centered between strings; its box is measured from the text so long labels never spill out. */
function NoteTooltip({ noteId, x, y, minX, maxX, pitch, octave, degree, member }: { noteId: string; x: number; y: number; minX: number; maxX: number; pitch: string; octave: number; degree: string; member: string }) {
  const text = useRef<SVGTextElement>(null);
  const [textWidth, setTextWidth] = useState(0);
  useLayoutEffect(() => { setTextWidth(text.current?.getComputedTextLength() ?? 0); }, [pitch, octave, degree, member]);
  const width = Math.ceil(textWidth) + 20;
  const height = 18;
  const left = Math.max(minX + 8, Math.min(maxX - width - 8, x - width / 2));
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
