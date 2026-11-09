import type { Dispatch } from 'react';
import { describeNote, position } from '../core/music';
import type { Scale, Tuning } from '../core/music';
import type { Action, State } from '../core/state';
import { Icon } from './controls';

type Props = { state: State; dispatch: Dispatch<Action>; scale: Scale; tuning: Tuning };

/** Marked notes as removable chips, including marks beyond the current neck length. */
export function MarksPanel({ state, dispatch, scale, tuning }: Props) {
  if (!state.marks.length) return null;
  const count = state.marks.length;
  return <section className="marks-panel" aria-label="Marked positions">
    <div className="marks-title">
      <h2>{count} marked {count === 1 ? 'position' : 'positions'}</h2>
      <button className="text-button" onClick={() => dispatch({ type: 'clear-marks' })}>Clear marks</button>
    </div>
    <div className="marks-list">{state.marks.map(id => {
      const [s, f] = id.split(':').map(Number);
      const d = describeNote(position(s, f, tuning), state.root, scale, state.spelling);
      return <button key={id} onClick={() => dispatch({ type: 'mark', id })} aria-label={`Remove marked ${d.name}${d.octave}, string ${s}, fret ${f}`}>
        <strong>{d.name}<small>{d.octave}</small></strong>
        <span>S{s} · {f === 0 ? 'Open' : `F${f}`}{f > state.frets ? ' · off screen' : ''}</span>
        <Icon name="close" />
      </button>;
    })}</div>
  </section>;
}
