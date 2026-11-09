import { pitchName } from '../core/music';
import type { Scale } from '../core/music';
import type { State } from '../core/state';
import type { Shape } from '../core/shapes';

export const shapeName = (kind: string) => kind === 'rectangle' ? 'Rectangle' : 'Stack';

/** Names only the layers that are on the board right now. */
export function BoardLegend({ state, shapes, scale }: { state: State; shapes: Shape[]; scale: Scale }) {
  const warp = state.warp && !state.fourths;
  const kinds = (['rectangle', 'stack'] as const).filter(kind => shapes.some(shape => shape.kind === kind));
  return <div className="board-legend"><div className="legend-items">
    {kinds.map(kind => <span key={kind}><i className={`legend-outline ${kind}`} />{shapeName(kind)}</span>)}
    {state.studyMode === 'diagonal' && shapes.length > 0 && <span><i className="legend-note run" />Continuation tone</span>}
    {scale.tones.some(t => !t.skeleton) && !state.hideAdded
      && <span><i className="legend-note added" />{scale.family ? 'Added to the pentatonic' : 'Added tone'}</span>}
    {state.ghostForms && state.studyMode === 'position' && <span><i className="legend-outline ghost" />Ghost forms</span>}
    {state.wholeMap && state.studyMode !== 'all' && <span><i className="legend-note background" />Whole map</span>}
    {state.skeleton && <span><i className="legend-line skeleton" />Skeleton</span>}
    {warp && <span><i className="legend-line warp" />Warp · +1 fret on B and e</span>}
    {state.hideAdded && <span>Pentatonic only</span>}
    {state.triad !== 'off' && <span className="triad-legend">
      <i className="legend-triad" />{pitchName(state.triadRoot ?? state.root, state.spelling)} {state.triad} triad
    </span>}
    {state.isolatedTones.length > 0 && <span>Degree isolated</span>}
    {state.marks.length > 0 && <span><i className="legend-note marked" />Marked</span>}
  </div></div>;
}
