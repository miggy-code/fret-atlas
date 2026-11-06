import { useEffect, useRef, useState } from 'react';
import { pluck } from './audio';

const STEP = .2;

/** Plays a run of notes up and back down, reporting which one is sounding so the board can light it. `onDone` runs only if the run finishes. */
export function usePlayback(sound: boolean) {
  const [playback, setPlayback] = useState<{ kind: 'idle' } | { kind: 'running'; playing: string | null }>({ kind: 'idle' });
  const pending = useRef<(() => void)[]>([]);
  const stop = () => { pending.current.forEach(cancel => cancel()); pending.current = []; setPlayback({ kind: 'idle' }); };
  useEffect(() => stop, []);

  function play(notes: { id: string; midi: number }[], onDone?: () => void) {
    stop();
    if (!notes.length) return;
    const run = [...notes, ...notes.slice(0, -1).reverse()];
    setPlayback({ kind: 'running', playing: null });
    run.forEach((note, i) => {
      if (sound) pending.current.push(pluck(note.midi, i * STEP, .85));
      const timer = setTimeout(() => setPlayback({ kind: 'running', playing: note.id }), i * STEP * 1000);
      pending.current.push(() => clearTimeout(timer));
    });
    const done = setTimeout(() => { setPlayback({ kind: 'idle' }); pending.current = []; onDone?.(); }, run.length * STEP * 1000 + 150);
    pending.current.push(() => clearTimeout(done));
  }
  return { playing: playback.kind === 'running' ? playback.playing : null, running: playback.kind === 'running', play, stop };
}
