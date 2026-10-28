import { useEffect, useRef, useState } from 'react';
import { pluck } from './audio';

const STEP = .2;

/** Plays a run of notes up and back down, reporting which one is sounding so the board can light it. `onDone` runs only if the run finishes. */
export function usePlayback(sound: boolean) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const pending = useRef<(() => void)[]>([]);
  const stop = () => { pending.current.forEach(cancel => cancel()); pending.current = []; setPlaying(null); setRunning(false); };
  useEffect(() => stop, []);

  function play(notes: { id: string; midi: number }[], onDone?: () => void) {
    stop();
    if (!notes.length) return;
    const run = [...notes, ...notes.slice(0, -1).reverse()];
    setRunning(true);
    run.forEach((note, i) => {
      if (sound) pending.current.push(pluck(note.midi, i * STEP, .85));
      const timer = setTimeout(() => setPlaying(note.id), i * STEP * 1000);
      pending.current.push(() => clearTimeout(timer));
    });
    const done = setTimeout(() => { setPlaying(null); setRunning(false); pending.current = []; onDone?.(); }, run.length * STEP * 1000 + 150);
    pending.current.push(() => clearTimeout(done));
  }
  return { playing, running, play, stop };
}
