import { useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { Action, State } from '../core/state';
import { pluck } from './audio';

export type ChordKind = 'major' | 'minor';
export type ChordChange = { kind?: ChordKind; root?: number };

/**
 * The Chord row's triad. While its tones are shown the saved triad is the chord;
 * while they are hidden, the next choice waits here so it never changes the saved view.
 */
export function useChord(state: State, dispatch: Dispatch<Action>) {
  const [pending, setPending] = useState<{ kind: ChordKind; root: number | null }>(
    () => ({ kind: state.triad === 'major' ? 'major' : 'minor', root: state.triadRoot }),
  );
  const sounds = useRef<(() => void)[]>([]);
  const shown = state.triad !== 'off';
  const kind = shown ? state.triad as ChordKind : pending.kind;
  const root = (shown ? state.triadRoot : pending.root) ?? state.root;

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
    sounds.current = [0, kind === 'major' ? 4 : 3, 7].map(interval => pluck(48 + root + interval));
  }
  return { kind, root, shown, change, toggle, play, stop };
}
