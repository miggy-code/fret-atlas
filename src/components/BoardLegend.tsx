import { pitchName } from '../core/music';
import type { Scale } from '../core/music';
import { shownTriad } from '../core/state';
import type { State } from '../core/state';
import type { Shape } from '../core/shapes';

const shapeName = (kind: string) => kind === 'rectangle' ? 'Rectangle' : 'Stack';

/** Names only the layers that are on the board right now. */
export function BoardLegend({ state, shapes, scale, song }: { state: State; shapes: Shape[]; scale: Scale; song?: { chord?: string } }) {
  const warp = state.warp && !state.fourths;
  const triad = shownTriad(state);
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
    {triad && <span className="triad-legend">
      <i className="legend-triad" />{pitchName(triad.root, state.spelling)} {triad.quality} triad
    </span>}
    {/* A song draws its melody in rings and numbers, and shades the chord sounding: the chord is a reference, not a grip. */}
    {song && <>
      <span><i className="legend-song now" />Now</span>
      <span><i className="legend-song step">1</i>Next, in order</span>
      <span><i className="legend-note song" />Melody in this form</span>
      {song.chord && <span className="song-chord-legend"><i className="legend-song shade" />{song.chord} chord tones, not fingered</span>}
    </>}
    {state.isolatedTones.length > 0 && <span>Degree isolated</span>}
    {state.marks.length > 0 && <span><i className="legend-note marked" />Marked</span>}
  </div></div>;
}
