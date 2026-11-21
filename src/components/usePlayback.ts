import { useEffect, useRef, useState } from 'react';
import { pluck } from './audio';

const STEP = .2;
export type Cue = { id: string; midi: number; at: number };
/** A note sounded under the run without lighting the board: an accompanying chord tone. */
/** `strike`, on a strum's first note, is the beat it marks: the board is told as it sounds. */
export type Backing = { midi: number; at: number; strike?: number };
const BACKING_LEVEL = .3;

/** Plays notes at given times, reporting which one is sounding so the board can light it. `onDone` runs only if the run finishes. */
export function usePlayback(sound: boolean) {
  const [playback, setPlayback] = useState<{ kind: 'idle' } | { kind: 'running'; playing: string | null }>({ kind: 'idle' });
  const pending = useRef<(() => void)[]>([]);
  const stop = () => { pending.current.forEach(cancel => cancel()); pending.current = []; setPlayback({ kind: 'idle' }); };
  useEffect(() => stop, []);

  /** `at` is seconds from now; the run ends `tail` seconds after the last note starts. `onCue` runs as each note sounds, `onStrike` as each backing chord leading note does. */
  function schedule(cues: Cue[], tail: number, onDone?: () => void, onCue?: (index: number) => void, backing: Backing[] = [], onStrike?: (beat: number) => void) {
    stop();
    if (!cues.length) return;
    setPlayback({ kind: 'running', playing: null });
    if (sound) backing.forEach(note => {
      pending.current.push(pluck(note.midi, note.at, BACKING_LEVEL));
      if (note.strike !== undefined && onStrike) { const timer = setTimeout(() => onStrike(note.strike!), note.at * 1000); pending.current.push(() => clearTimeout(timer)); }
    });
    cues.forEach((cue, i) => {
      if (sound) pending.current.push(pluck(cue.midi, cue.at, .85));
      const timer = setTimeout(() => { setPlayback({ kind: 'running', playing: cue.id }); onCue?.(i); }, cue.at * 1000);
      pending.current.push(() => clearTimeout(timer));
    });
    const done = setTimeout(() => { setPlayback({ kind: 'idle' }); pending.current = []; onDone?.(); }, (cues[cues.length - 1].at + tail) * 1000);
    pending.current.push(() => clearTimeout(done));
  }

  /** A run of notes up and back down at a steady pace. */
  function play(notes: { id: string; midi: number }[], onDone?: () => void) {
    const run = [...notes, ...notes.slice(0, -1).reverse()];
    schedule(run.map((note, i) => ({ ...note, at: i * STEP })), STEP + .15, onDone);
  }
  return { playing: playback.kind === 'running' ? playback.playing : null, running: playback.kind === 'running', play, schedule, stop };
}
