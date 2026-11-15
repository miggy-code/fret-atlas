import { useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import { TRIAD_INTERVALS } from '../core/music';
import type { TriadQuality } from '../core/music';
import { shownTriad } from '../core/state';
import type { Action, State } from '../core/state';
import { pluck } from './audio';

export type ChordChange = { kind?: TriadQuality; root?: number };
// The chord sounds in the octave of C3, whatever its root.
const CHORD_OCTAVE = 48;

/**
 * The Chord row's triad. While its tones are shown the saved triad is the chord;
 * while they are hidden, the next choice waits here so it never changes the saved view.
 */
export function useChord(state: State, dispatch: Dispatch<Action>) {
  const [pending, setPending] = useState<{ kind: TriadQuality; root: number | null }>(
    () => ({ kind: state.triad === 'major' ? 'major' : 'minor', root: state.triadRoot }),
  );
  const sounds = useRef<(() => void)[]>([]);
  const triad = shownTriad(state);
  const shown = !!triad;
  const kind = triad?.quality ?? pending.kind;
  const root = triad?.root ?? pending.root ?? state.root;

  function stop() {
    sounds.current.forEach(stopSound => stopSound());
    sounds.current = [];
  }
  useEffect(() => stop, []);

  function change(next: ChordChange) {
    if (!shown) { setPending(chord => ({ ...chord, ...next })); return; }
    if (next.kind) dispatch({ type: 'triad', value: next.kind });
    if (next.root !== undefined) dispatch({ type: 'triad-root', value: next.root });
  }
  function toggle() {
    if (shown) {
      setPending({ kind, root: state.triadRoot });
      dispatch({ type: 'triad', value: 'off' });
      return;
    }
    dispatch({ type: 'triad', value: pending.kind });
    dispatch({ type: 'triad-root', value: pending.root });
  }
  function play() {
    sounds.current = TRIAD_INTERVALS[kind].map(interval => pluck(CHORD_OCTAVE + root + interval));
  }
  return { kind, root, shown, change, toggle, play, stop };
}
