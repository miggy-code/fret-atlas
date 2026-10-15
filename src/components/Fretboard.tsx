import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { boardGeometry, HIT_SIZE, shapePath, sharedShapePath, ROW } from '../core/geometry';
import { position, pitchName } from '../core/music';
import { notePresentation } from '../core/presentation';
import { insideShape } from '../core/shapes';
import type { Shape } from '../core/shapes';
import type { State } from '../core/state';
import { inFocus, shapeInFocus } from '../core/state';
import { activeStudy, ghostStudies, rootConnections, tuningOf } from '../core/study';

interface Props { state: State; shapes: Shape[]; onMark: (id: string) => void; onInspect: (id: string) => void }

export function Fretboard({ state, shapes, onMark, onInspect }: Props) {
  const geo = useMemo(() => boardGeometry(state.frets, state.leftHanded), [state.frets, state.leftHanded]);
  const study = useMemo(()=>activeStudy(state),[state]);
  const ghosts = useMemo(()=>ghostStudies(state),[state]);
  const ghostShapes = useMemo(() => {
    if (!state.ghostForms || state.studyMode !== 'position') return [];
    return ghosts.flatMap(g => g.shapes).filter(shape => state.patterns.includes(shape.kind) && shapeInFocus(state, shape) && shape.rows.every(r => state.overlayRows.includes(r.string)));
  }, [ghosts, state.ghostForms, state.studyMode, state.patterns, state.strings, state.focus, state.from, state.to, state.overlayRows]);
  const sharedRails = useMemo(()=>sharedShapePath(shapes,geo),[shapes,geo]);
  const roots = useMemo(()=>rootConnections(state).filter(({a,b})=>inFocus(state,a.string,a.fret)&&inFocus(state,b.string,b.fret)),[state]);
  const tuning = useMemo(()=>tuningOf(state),[state.lowest,state.fourths]);
  const warpArrow = useId();
  const patternClip = useId();
  const [emphasized, setEmphasized] = useState<string | null>(null);
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
    const center = () => {
      const svg = el.querySelector('svg');
      if (!svg) return;
      if (state.leftHanded) el.scrollLeft = el.scrollWidth;
      updateEdges();
    };
    const observer = new ResizeObserver(center);
    observer.observe(el);
    el.addEventListener('scroll', updateEdges, { passive: true });
    center();
    return () => { observer.disconnect(); el.removeEventListener('scroll', updateEdges); };
  }, [geo, state.leftHanded]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !study) return;
    if (state.studyMode==='all') { el.scrollLeft=state.leftHanded?el.scrollWidth:0; return; }
    const svg = el.querySelector('svg');
    if (!svg) return;
    const first = Math.min(...study.rows.map(row=>row.left));
    const last = Math.min(state.frets,Math.max(...study.rows.map(row=>row.right)));
    const scale = svg.getBoundingClientRect().width / geo.width;
    el.scrollLeft = Math.max(0, (geo.x(first)+geo.x(last))/2 * scale - el.clientWidth/2);
  }, [study?.id, state.studyMode, state.shapeKind, state.frets, geo]);

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

  return <div className={`board-shell ${scrollEdges.left ? 'has-left' : ''} ${scrollEdges.right ? 'has-right' : ''}`} onPointerLeave={() => setEmphasized(null)}>
    <div ref={scrollRef} className="board-scroll" role="region" aria-label="Fretboard. Tab to a note; arrow keys navigate, Enter marks. Scroll horizontally for more frets.">
      <svg className={`fretboard ${shapes.length ? 'has-patterns' : ''}`} role="group" aria-label="Interactive six-string guitar fretboard" viewBox={`0 0 ${geo.width} ${geo.height}`} style={{ minWidth: geo.width }} data-labels={state.labels} data-handedness={state.leftHanded ? 'left' : 'right'}>
        <title>Guitar fretboard, high strings above, nut {state.leftHanded ? 'right' : 'left'}</title>
        <defs>
          <marker id={warpArrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="var(--shift)" strokeWidth="1.5" /></marker>
          <clipPath id={patternClip}><rect x={Math.min(geo.x(0),geo.end)-16} y="0" width={Math.abs(geo.end-geo.x(0))+32} height={geo.height} /></clipPath>
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
            {state.stringNames && <text className="string-name" x={geo.labelX} y={geo.y(i + 1) + 4} textAnchor="middle">{i === 0 ? pitchName(midi, state.spelling).toLowerCase() : pitchName(midi, state.spelling)}</text>}
          </g>)}
        </g>
        {state.warp && !state.fourths && <g className="warp-guide" aria-hidden="true">
          <rect className="warp-band" x={Math.min(geo.nut,geo.end)} y={(geo.y(2)+geo.y(3))/2-8} width={Math.abs(geo.end-geo.nut)} height="16" />
          <line x1={geo.nut} x2={geo.end} y1={(geo.y(2) + geo.y(3)) / 2} y2={(geo.y(2) + geo.y(3)) / 2} />
          <path className="warp-arrow" d={`M${geo.x(1)},${geo.y(3)-8} L${geo.x(2)},${geo.y(2)+8}`} markerStart={`url(#${warpArrow})`} markerEnd={`url(#${warpArrow})`} />
        </g>}
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
          const degreeHue = state.degreeColors && p.selected && p.kind !== 'root' && p.tone ? p.tone.semitones * 30 : undefined;
          const chordTone = degreeHue === undefined && state.chordColors && p.selected && (p.tone?.degree === 3 || p.tone?.degree === 5) ? p.tone.degree === 3 ? 'third' : 'fifth' : '';
          const label = state.labels === 'intervals' ? p.interval : p.name;
          return <g key={note.id} ref={node => { if (node) nodes.current.set(note.id, node); else nodes.current.delete(note.id); }}
            role="button" tabIndex={cursor === note.id ? 0 : -1} aria-label={p.aria} aria-pressed={p.marked}
            data-note-id={note.id} data-active={p.active ? 'true' : 'false'} data-triad={p.triad ? 'true' : undefined} data-tone-kind={p.kind} data-shape-member={p.member ? 'true' : undefined} data-visible={p.visible ? 'true' : 'false'}
            className={`note-node ${p.kind} ${chordTone} ${degreeHue === undefined ? '' : 'degree-colored'} ${p.visible ? '' : 'is-hidden'} ${p.background && !p.marked && !p.triad ? 'is-background' : ''} ${p.marked ? 'is-marked' : ''} ${p.triad ? 'is-triad' : ''} ${p.member ? 'is-member' : ''} ${p.ghost ? 'is-ghost' : ''} ${p.degreeDimmed ? 'is-degree-dimmed' : ''} ${p.isolated ? 'is-degree-isolated' : ''} ${state.labels === 'both' ? 'both-labels' : ''}`}
            transform={`translate(${geo.x(fret)},${geo.y(i + 1)})`} style={{ '--note-label-size': label.length > 2 ? '11px' : '13px', ...(degreeHue === undefined ? {} : { '--degree-hue': degreeHue }) } as CSSProperties}
            onFocus={() => { setCursor(note.id); setEmphasized(note.id); onInspect(note.id); }} onPointerEnter={() => { setEmphasized(note.id); onInspect(note.id); }}
            onClick={() => { setCursor(note.id); onInspect(note.id); onMark(note.id); }} onKeyDown={event => navigate(event, note.id)}>
            <title>{p.aria}</title>
            <rect className="note-hit" x={-HIT_SIZE / 2} y={-HIT_SIZE / 2} width={HIT_SIZE} height={HIT_SIZE} rx="7" />
            <rect className="focus-ring" x="-20" y="-20" width="40" height="40" rx="9" />
            <rect className="mark-ring" x="-17" y="-17" width="34" height="34" rx="7" />
            <g className="note-symbol">
              {p.kind === 'context' && !p.marked && !p.triad
                ? <circle className="note-face" r="3" />
                : state.labels === 'none' && !p.triad ? <circle className="note-face" r={shapes.length ? p.kind === 'root' ? 6 : 4 : p.kind === 'root' ? 11 : 10} />
                : <rect className="note-face" x="-15" y="-15" width="30" height="30" rx="5" />}
              {p.triad && <path className="triad-halo" d="M-8,12 H8" />}
              {state.labels !== 'none' && (p.selected || p.marked || p.triad) && <text className="note-label" textAnchor="middle" dominantBaseline="central" y={state.labels === 'both' ? -5 : 0}>{label}</text>}
              {state.labels === 'both' && (p.selected || p.marked || p.triad) && <text className="note-interval" textAnchor="middle" y="10">{p.interval}</text>}
              {state.labels === 'none' && p.kind === 'root' && <circle r="2.7" className="root-center" />}
            </g>
          </g>;
        }))}
        {(() => {
          const tipId = emphasized;
          if (!tipId) return null;
          const [tipString, tipFret] = tipId.split(':').map(Number);
          if (!tipString || isNaN(tipFret)) return null;
          const tipNote = position(tipString, tipFret, tuning);
          const tipP = notePresentation(tipNote, state, shapes, study, ghosts);
          if (!tipP.visible && !tipP.marked && !tipP.triad) return null;
          const tipMembership = shapes.filter(s => insideShape(tipString, tipFret, s));
          const tipMemberLabel = tipMembership.map(s => s.kind === 'rectangle' ? 'Rectangle' : 'Stack').join(' & ');
          const x0 = geo.x(tipFret);
          const y0 = geo.y(tipString);
          const tipY = tipString <= 2 ? y0 + 36 : y0 - 36;
          const tipW = 150;
          const tipH = 46;
          const halfW = tipW / 2;
          const tipX = Math.max(halfW + 8, Math.min(geo.width - halfW - 8, x0));
          const arrowDx = Math.max(-halfW + 12, Math.min(halfW - 12, x0 - tipX));
          const arrowD = tipString <= 2
            ? `M${arrowDx - 5},${-tipH / 2} L${arrowDx},${-tipH / 2 - 6} L${arrowDx + 5},${-tipH / 2} Z`
            : `M${arrowDx - 5},${tipH / 2} L${arrowDx},${tipH / 2 + 6} L${arrowDx + 5},${tipH / 2} Z`;

          return <g className="inline-note-tooltip" transform={`translate(${tipX},${tipY})`} pointerEvents="none" aria-hidden="true">
            <rect x={-halfW} y={-tipH / 2} width={tipW} height={tipH} rx="7" className="tooltip-box" />
            <path d={arrowD} className="tooltip-arrow" />
            <text className="tooltip-line-main" textAnchor="middle" y="-4">
              <tspan className="tooltip-pitch">{tipP.name}</tspan>
              <tspan className="tooltip-octave">{tipP.octave}</tspan>
              <tspan className="tooltip-sep"> · </tspan>
              <tspan className="tooltip-degree">{tipP.kind === 'root' ? 'Root' : `Deg ${tipP.interval}`}</tspan>
            </text>
            <text className="tooltip-line-sub" textAnchor="middle" y="14">
              <tspan>{`S${tipString} · ${tipFret === 0 ? 'Open' : `Fret ${tipFret}`}`}</tspan>
              {tipMemberLabel ? <tspan className="tooltip-member">{` · ${tipMemberLabel}`}</tspan> : null}
            </text>
          </g>;
        })()}
      </svg>
    </div>
    {(scrollEdges.left || scrollEdges.right) && <div className="scroll-cue" aria-hidden="true">{scrollEdges.left ? '← ' : ''}Scroll fretboard{scrollEdges.right ? ' →' : ''}</div>}
  </div>;
}
