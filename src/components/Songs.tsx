import { useEffect, useMemo, useState } from 'react';
import { describeNote, pitchName, position, scaleById } from '../core/music';
import { pathForSong, songView } from '../core/song';
import type { SongPath, Transition } from '../core/song';
import { SONGS } from '../core/songs';
import type { State } from '../core/state';
import { tuningOf } from '../core/study';
import { pluck } from './audio';
import { Icon, Segments } from './controls';
import { usePlayback } from './usePlayback';

/** What the board draws for a song: the current form's melody notes, the next few notes ahead (drawn too), and where the hand is. */
export type SongBoard = { notes: string[]; ahead: string[]; current: string; next: string | null; stretch: string[] };
type Register = 'low' | 'high';

const AHEAD = 4;
const SPEEDS = [.5, .75, 1] as const;
const CHANGES: Record<Transition, { label: string; hint: string }> = {
  pivot: { label: 'Pivot', hint: 'Change form on a note both forms share' },
  slide: { label: 'Slide', hint: 'Slide along the string into the next form' },
  shift: { label: 'Shift', hint: 'Move the hand to the next form' },
};

/**
 * The Songs tab's state: which melody, how it is fingered, and where in it the player is. The song takes over the board
 * (its key, its scale, the form under the current note) without touching the saved view.
 */
export function useSongs(state: State, sound: boolean, active: boolean) {
  const [songId, setSongId] = useState(SONGS[0].id);
  const [homeForm, setHomeForm] = useState<number | null>(null);
  const [register, setRegister] = useState<Register>('low');
  const [speed, setSpeed] = useState<number>(1);
  const [cursor, setCursor] = useState(0);
  const playback = usePlayback(sound);
  const song = SONGS.find(s => s.id === songId) ?? SONGS[0];
  const tuning = tuningOf(state);
  // Guitar music sounds an octave below the page; High plays it as written. A route can fail to fit a short or retuned neck.
  const paths = useMemo(() => {
    const neck = { frets: state.frets, lowest: state.lowest, fourths: state.fourths };
    const route = (octave: number) => { try { return pathForSong(song, neck, { octave, homeForm: homeForm ?? undefined }); } catch { return undefined; } };
    return { low: route(song.octave ?? -12), high: route((song.octave ?? -12) + 12) };
  }, [song, homeForm, state.frets, state.lowest, state.fourths]);
  const path: SongPath | undefined = paths[register] ?? paths.low;
  const at = path ? Math.min(cursor, path.notes.length - 1) : 0;
  const note = path?.notes[at];
  const segment = path && note ? path.segments[note.segment] : undefined;

  useEffect(() => { if (!active) playback.stop(); }, [active]);

  const view = useMemo(() => path && segment ? songView(state, path, segment.study) : undefined, [state, path, segment]);
  const board = useMemo<SongBoard | undefined>(() => {
    if (!path || !note || !segment) return undefined;
    const ids = path.notes.slice(segment.from, segment.to + 1);
    return {
      notes: [...new Set(ids.map(n => n.id))],
      ahead: path.notes.slice(at, at + AHEAD + 1).map(n => n.id).filter((id, k, all) => id !== all[k - 1]),
      current: note.id,
      next: path.notes[at + 1]?.id ?? null,
      stretch: [...new Set(ids.filter(n => n.stretch).map(n => n.id))],
    };
  }, [path, note, segment, at]);

  const hear = (midi: number) => { if (sound) pluck(midi); };
  function go(index: number) {
    if (!path) return;
    playback.stop();
    const next = Math.max(0, Math.min(path.notes.length - 1, index));
    setCursor(next);
    hear(path.notes[next].midi);
  }
  function restart(change: () => void) { playback.stop(); change(); setCursor(0); }
  function listen() {
    if (!path) return;
    if (playback.running) { playback.stop(); return; }
    const from = at >= path.notes.length - 1 ? 0 : at;
    const first = path.notes[from];
    const beat = 60 / (path.tempo * speed);
    const notes = path.notes.slice(from);
    playback.schedule(notes.map(n => ({ id: n.id, midi: n.midi, at: (n.start - first.start) * beat })), notes[notes.length - 1].beats * beat, undefined, k => setCursor(from + k));
  }
  // Tapping the next note on the board steps forward; any other note just sounds.
  function tap(id: string) {
    if (!path) return;
    if (id === path.notes[at + 1]?.id) { go(at + 1); return; }
    hear(position(...(id.split(':').map(Number) as [number, number]), tuning).midi);
  }

  return {
    song, path, cursor: at, note, segment, view, board, register, highFits: !!paths.high, homeForm, speed, running: playback.running,
    chooseSong: (id: string) => restart(() => setSongId(id)),
    chooseHome: (form: number | null) => restart(() => setHomeForm(form)),
    chooseRegister: (value: Register) => restart(() => setRegister(value)),
    chooseSpeed: setSpeed,
    listen, tap, go, stop: playback.stop,
  };
}

export type Songs = ReturnType<typeof useSongs>;

export function SongDeck({ songs, state }: { songs: Songs; state: State }) {
  const { song, path, note, segment, cursor } = songs;
  const tuning = tuningOf(state);
  const scale = path && scaleById(path.scaleId);
  const said = path && note && scale ? describeNote(position(note.string, note.fret, tuning), path.root, scale, state.spelling) : undefined;
  const changes = path ? path.segments.filter(s => s.change).map(s => CHANGES[s.change!].label.toLowerCase()) : [];

  return <section className="song-deck" aria-label="Songs">
    <div className="song-head">
      <label className="song-pick"><span>Song</span>
        <select value={song.id} onChange={e => songs.chooseSong(e.target.value)}>{SONGS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
      </label>
      <p className="song-source">{song.provenance} <a href={song.source} target="_blank" rel="noreferrer">Source</a></p>
    </div>
    <div className="song-options">
      <div className="song-option"><span>Play in</span>
        <Segments label="Play in" value={songs.homeForm === null ? 'best' : String(songs.homeForm)} onChange={value => songs.chooseHome(value === 'best' ? null : Number(value))}
          options={[{ value: 'best', label: 'Fewest moves' }, ...[1, 2, 3, 4, 5].map(form => ({ value: String(form), label: `Form ${form}` }))]} />
      </div>
      <div className="song-option"><span>Octave</span>
        <Segments label="Octave" value={songs.register} onChange={songs.chooseRegister}
          options={[{ value: 'low', label: 'As read' }, { value: 'high', label: 'Up an octave', disabled: !songs.highFits, hint: songs.highFits ? undefined : 'Needs a longer neck' }]} />
      </div>
    </div>
    {!path || !note || !segment || !said ? <p className="song-empty" role="status">This song does not fit the current neck and tuning. Try a longer neck in Settings.</p> : <>
      <div className="song-transport">
        <button type="button" className="start-button" aria-pressed={songs.running} onClick={songs.listen}><Icon name={songs.running ? 'stop' : 'play'} />{songs.running ? 'Stop' : 'Listen'}</button>
        <button type="button" className="text-button" aria-label="Previous note" disabled={cursor === 0} onClick={() => songs.go(cursor - 1)}><Icon name="previous" /></button>
        <button type="button" className="text-button" aria-label="Next note" disabled={cursor === path.notes.length - 1} onClick={() => songs.go(cursor + 1)}><Icon name="next" /></button>
        <label className="song-speed"><span>Speed</span>
          <select value={songs.speed} onChange={e => songs.chooseSpeed(Number(e.target.value))}>{SPEEDS.map(s => <option key={s} value={s}>{s * 100}%</option>)}</select>
        </label>
        <p className="song-now" role="status" aria-live={songs.running ? 'off' : 'polite'}>
          <span>Note {cursor + 1} of {path.notes.length}</span>
          <strong>{said.name}</strong>
          <em>{said.interval === '1' ? 'Root' : said.interval}</em>
          <span>String {note.string} · {note.fret === 0 ? 'open' : `fret ${note.fret}`}</span>
          <span>{segment.study.label}{note.stretch ? ' · stretch' : ''}</span>
        </p>
      </div>
      <div className="song-route-wrap">
        <h3>Route <span>{path.segments.length === 1 ? `Stays in ${segment.study.label} the whole way` : `${path.segments.length} stretches, ${changes.length} ${changes.length === 1 ? 'move' : 'moves'}: ${changes.join(', ')}`}</span></h3>
        <ol className="song-route" aria-label="Route through the forms">{path.segments.map(s => <li key={s.index} style={{ flexGrow: Math.max(s.beats, 1) }}>
          {s.change && <span className={`route-change is-${s.change}`} title={CHANGES[s.change].hint}>{CHANGES[s.change].label}</span>}
          <button type="button" className={s.index === segment.index ? 'is-current' : ''} aria-current={s.index === segment.index ? 'step' : undefined}
            title={`Notes ${s.from + 1}–${s.to + 1}, from fret ${s.study.anchor}`} onClick={() => songs.go(s.from)}>
            <strong>{s.study.label}</strong><small>fret {s.study.anchor}</small>
          </button>
        </li>)}</ol>
      </div>
      <p className="song-key">Played in {pitchName(path.root, state.spelling)} {scale!.name}. The board follows the form under each note; the line runs to the next few notes, across into the next form when the melody moves.</p>
    </>}
  </section>;
}
