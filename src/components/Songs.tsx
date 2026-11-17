import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { chordDegree, romanNumeral } from '../core/harmony';
import type { Chord, ChordRole, ChordTone } from '../core/harmony';
import { describeNote, mod, noteAt, position, scaleById } from '../core/music';
import { degreeColor } from '../core/presentation';
import { chordInForm, pathForSong, songView } from '../core/song';
import type { SongLabels, SongPath } from '../core/song';
import { phrasesOf, songInsight } from '../core/song-insight';
import type { Phrase } from '../core/song-insight';
import { clearMiss, recallClean, recallHint, recallTap, startRecall } from '../core/song-recall';
import type { Recall } from '../core/song-recall';
import { SONGS } from '../core/songs';
import type { State } from '../core/state';
import { tuningOf } from '../core/study';
import { pluck, thud } from './audio';
import { Icon, Segments, Toggle } from './controls';
import { SongInsights } from './SongInsights';
import { SongTimeline } from './SongTimeline';
import { usePlayback } from './usePlayback';
import type { Backing } from './usePlayback';

/**
 * What the board draws for a song. Listening or stepping: the current form's melody notes, the next few notes ahead and
 * the tones of the chord sounding, where the hand can reach them. Recalling: only the notes already played back.
 */
export type SongBoard = {
  notes: string[]; ahead: string[]; current: string | null; next: string | null; stretch: string[]; miss: string | null; recalling: boolean;
  /** `relabel` names every note on the board from this chord's root instead of from the key. */
  chord?: { root: number; tones: Record<string, ChordTone>; relabel: boolean };
};
type Register = 'low' | 'high';

const AHEAD = 4;
const SPEEDS = [.5, .75, 1] as const;
const MISS_SHOWN = 650;
// A strummed chord sits under the melody, its root between A2 and G♯3, each string a moment after the last.
const strum = (chord: Chord, at: number): Backing[] => chord.tones.map((tone, i) => ({ midi: 45 + mod(chord.root - 9) + tone.semitones, at: at + i * .022 }));

/**
 * The Songs tab's state: which melody, how it is fingered, where in it the player is, and a recall round if one is
 * running. The song takes over the board (its key, its scale, the form under the current note) without touching the saved view.
 */
export function useSongs(state: State, sound: boolean, active: boolean) {
  const [songId, setSongId] = useState(SONGS[0].id);
  const [homeForm, setHomeForm] = useState<number | null>(null);
  const [register, setRegister] = useState<Register>('low');
  const [speed, setSpeed] = useState<number>(1);
  const [labels, setLabels] = useState<SongLabels>('degrees');
  const [backing, setBacking] = useState(true);
  const [loop, setLoop] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recall, setRecall] = useState<Recall | null>(null);
  const [feedback, setFeedback] = useState('');
  // Phrases played back without a slip, for this route and this visit only.
  const [clean, setClean] = useState<number[]>([]);
  const playback = usePlayback(sound);
  const looping = useRef(loop);
  looping.current = loop;
  const missTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The button that starts a recall unmounts while it runs; this asks the remounted one to take focus back.
  const refocus = useRef(false);
  const song = SONGS.find(s => s.id === songId) ?? SONGS[0];
  const tuning = tuningOf(state);
  // Guitar music sounds an octave below the page; High plays it as written. A route can fail to fit a short or retuned neck.
  const paths = useMemo(() => {
    const neck = { frets: state.frets, lowest: state.lowest, fourths: state.fourths };
    const route = (octave: number) => { try { return pathForSong(song, neck, { octave, homeForm: homeForm ?? undefined }); } catch { return undefined; } };
    return { low: route(song.octave ?? -12), high: route((song.octave ?? -12) + 12) };
  }, [song, homeForm, state.frets, state.lowest, state.fourths]);
  const path: SongPath | undefined = paths[register] ?? paths.low;
  const phrases = useMemo(() => path ? phrasesOf(path) : [], [path]);
  const insight = useMemo(() => path && songInsight(path), [path]);
  const at = path ? Math.min(cursor, path.notes.length - 1) : 0;
  // While a phrase is played back the board follows the note wanted next, so its form is the one drawn.
  const focus = recall && path ? Math.min(recall.at, recall.to) : at;
  const note = path?.notes[focus];
  const segment = path && note ? path.segments[note.segment] : undefined;
  const phrase = phrases.find(p => focus >= p.from && focus <= p.to);
  const chord = path && note && note.chord !== null ? path.chords[note.chord] : undefined;
  // Naming notes from the chord needs a chord, and would point at the answer while a phrase is played back.
  const shown: SongLabels = labels === 'chord' && (!path?.chords.length || recall) ? 'degrees' : labels;

  useEffect(() => { if (!active) { playback.stop(); setRecall(null); setFeedback(''); } }, [active]);
  useEffect(() => () => clearTimeout(missTimer.current), []);

  const view = useMemo(() => path && segment ? songView(state, path, segment.study, shown) : undefined, [state, path, segment, shown]);
  const board = useMemo<SongBoard | undefined>(() => {
    if (!path || !note || !segment) return undefined;
    if (recall) {
      const played = path.notes.slice(recall.from, recall.at);
      const ringed = recall.hinted && !recall.done ? path.notes[recall.at].id : null;
      return { notes: [...new Set(played.map(n => n.id))], ahead: ringed ? [ringed] : [], current: played.at(-1)?.id ?? null, next: ringed, stretch: [], miss: recall.miss, recalling: true };
    }
    const ids = path.notes.slice(segment.from, segment.to + 1);
    const neck = { frets: state.frets, lowest: state.lowest, fourths: state.fourths };
    return {
      notes: [...new Set(ids.map(n => n.id))],
      ahead: path.notes.slice(at, at + AHEAD + 1).map(n => n.id).filter((id, k, all) => id !== all[k - 1]),
      current: note.id,
      next: path.notes[at + 1]?.id ?? null,
      stretch: [...new Set(ids.filter(n => n.stretch).map(n => n.id))],
      miss: null, recalling: false,
      chord: chord && { root: chord.chord.root, relabel: shown === 'chord', tones: Object.fromEntries(chordInForm(chord.chord, segment.study, neck, path).map(p => [p.id, p.tone])) },
    };
  }, [path, note, segment, at, chord, shown, recall, state.frets, state.lowest, state.fourths]);

  const hear = (midi: number, level = 1) => { if (sound) pluck(midi, 0, level); };
  const named = (id: string) => path ? describeNote(noteAt(id, tuning), path.root, scaleById(path.scaleId), state.spelling) : undefined;

  /** Plays notes `from`..`to` in time. The cursor follows unless the board must stay as it is (hearing a phrase to recall). */
  function play(from: number, to: number, follow: boolean, again = false) {
    if (!path) return;
    const notes = path.notes.slice(from, to + 1);
    const beat = 60 / (path.tempo * speed);
    const start = notes[0].start;
    // A looped phrase runs to where the next one would start, so it comes round in time.
    const looped = again ? phrases.find(p => p.from === from) : undefined;
    const end = looped ? looped.start + looped.beats : notes[notes.length - 1].start + notes[notes.length - 1].beats;
    // The chord is struck where it changes and on each bar line, as a strummed accompaniment would be.
    const strikes = [...new Set([start, ...path.chords.map(c => c.start), ...path.bars])].filter(t => t >= start && t < end).sort((a, b) => a - b);
    const chords = backing ? strikes.flatMap(t => { const sounding = path.chords.filter(c => c.start <= t).at(-1); return sounding ? strum(sounding.chord, (t - start) * beat) : []; }) : [];
    playback.schedule(notes.map(n => ({ id: n.id, midi: n.midi, at: (n.start - start) * beat })), (end - notes[notes.length - 1].start) * beat,
      () => { if (again && looping.current) play(from, to, follow, true); }, follow ? k => setCursor(from + k) : undefined, chords);
  }
  function go(index: number) {
    if (!path || recall) return;
    playback.stop();
    const next = Math.max(0, Math.min(path.notes.length - 1, index));
    setCursor(next);
    hear(path.notes[next].midi);
    // Stepping onto a note sounds its chord under it, quietly, so the ear gets the relation the labels spell out.
    const under = path.notes[next].chord;
    if (sound && backing && under !== null) strum(path.chords[under].chord, 0).forEach(b => pluck(b.midi, b.at, .22));
  }
  function restart(change: () => void) { playback.stop(); change(); setCursor(0); setRecall(null); setFeedback(''); setClean([]); }
  function listen() {
    if (!path) return;
    if (playback.running) { playback.stop(); return; }
    if (loop && phrase) { play(phrase.from, phrase.to, true, true); return; }
    play(at >= path.notes.length - 1 ? 0 : at, path.notes.length - 1, true);
  }

  function beginRecall(target: Phrase | undefined = phrase) {
    if (!target) return;
    playback.stop();
    setRecall(startRecall(target.from, target.to));
    setCursor(target.from);
    setFeedback('');
  }
  function endRecall() {
    playback.stop();
    if (recall) setCursor(Math.min(recall.at, recall.to));
    refocus.current = true;
    setRecall(null);
    setFeedback('');
  }
  function tapRecall(id: string) {
    if (!path || !recall) return;
    const tapped = noteAt(id, tuning);
    const { recall: next, result } = recallTap(recall, path.notes, id, tapped.midi);
    if (result === 'ignored') return;
    const wanted = path.notes[recall.at];
    const said = named(id);
    clearTimeout(missTimer.current);
    setRecall(next);
    if (result === 'hit') {
      hear(tapped.midi);
      setCursor(recall.at);
      const total = recall.to - recall.from + 1;
      if (!next.done) { setFeedback(`${next.at - next.from} of ${total}`); return; }
      const kept = recallClean(next);
      if (kept === total && phrase) setClean(all => all.includes(phrase.index) ? all : [...all, phrase.index]);
      setFeedback(kept === total ? `All ${total} notes from memory, without a slip.` : `Played back. ${kept} of ${total} notes without a slip.`);
    } else if (result === 'elsewhere') {
      hear(tapped.midi, .5);
      setFeedback(`Right note. This route plays that ${said?.name} on string ${wanted.string}.`);
    } else {
      if (sound) thud();
      setFeedback(`That's ${said?.name}, the ${said?.interval}. ${next.hinted ? 'The note to play is ringed.' : 'Try again, or hear the phrase.'}`);
      missTimer.current = setTimeout(() => setRecall(current => current && clearMiss(current)), MISS_SHOWN);
    }
  }
  // Tapping the next note on the board steps forward; any other note just sounds.
  function tap(id: string) {
    if (!path) return;
    if (recall) { tapRecall(id); return; }
    if (id === path.notes[at + 1]?.id) { go(at + 1); return; }
    hear(noteAt(id, tuning).midi);
  }

  return {
    song, path, phrases, insight, cursor: focus, note, segment, phrase, chord, view, board, register, highFits: !!paths.high, homeForm, speed, labels: shown, backing, loop,
    running: playback.running, recall, feedback, clean, refocus,
    chooseSong: (id: string) => restart(() => setSongId(id)),
    chooseHome: (form: number | null) => restart(() => setHomeForm(form)),
    chooseRegister: (value: Register) => restart(() => setRegister(value)),
    chooseSpeed: (value: number) => { playback.stop(); setSpeed(value); },
    chooseLabels: setLabels,
    toggleBacking: () => { playback.stop(); setBacking(on => !on); },
    toggleLoop: () => setLoop(on => !on),
    listen, tap, go, stop: playback.stop,
    beginRecall, endRecall,
    hint: () => { setRecall(current => current && recallHint(current)); setFeedback('The note to play is ringed.'); },
    hearPhrase: () => { if (recall) play(recall.from, recall.to, false); },
    recallAgain: () => { if (recall) { playback.stop(); setRecall(startRecall(recall.from, recall.to)); setCursor(recall.from); setFeedback(''); } },
    recallNext: () => { const next = phrase && phrases[phrase.index + 1]; if (next) beginRecall(next); },
  };
}

export type Songs = ReturnType<typeof useSongs>;

const KEY_PLACE = { root: 'the root', skeleton: 'pentatonic tone', added: 'added to the pentatonic', outside: 'outside the scale' } as const;
const CHORD_PLACE: Record<ChordRole, string> = { root: 'chord root', third: 'chord third', fifth: 'chord fifth', seventh: 'chord seventh', color: 'chord tone' };

/** The current note read three ways: where it is, what it is to the key, and what it is to the chord under it. */
function NowPanel({ songs, state }: { songs: Songs; state: State }) {
  const { path, note, segment, chord, cursor } = songs;
  if (!path || !note || !segment) return null;
  const scale = scaleById(path.scaleId);
  const said = describeNote(position(note.string, note.fret, tuningOf(state)), path.root, scale, state.spelling);
  const kind = !said.tone ? 'outside' : said.tone.semitones === 0 ? 'root' : said.tone.skeleton ? 'skeleton' : 'added';
  const inKey = kind === 'skeleton' || kind === 'added' ? scale.family ? KEY_PLACE[kind] : 'scale tone' : KEY_PLACE[kind];
  const over = chord && chordDegree(chord.chord, note.midi);
  return <dl className="song-now" role="status" aria-live={songs.running ? 'off' : 'polite'}>
    <div><dt>Note {cursor + 1} of {path.notes.length}</dt>
      <dd><strong>{said.name}</strong><span>string {note.string} · {note.fret === 0 ? 'open' : `fret ${note.fret}`}</span></dd></div>
    <div><dt>In the key</dt>
      <dd><em className={`degree-chip is-${kind}`} style={said.tone ? { '--chip': degreeColor(said.tone.degree) } as CSSProperties : undefined}>{said.interval}</em><span>{inKey}</span></dd></div>
    <div data-fact="chord"><dt>{chord ? <>Over <b>{chord.chord.symbol}</b> <i>{romanNumeral(chord.chord, path.root)}</i></> : 'Over the chord'}</dt>
      <dd>{chord && over
        ? <><em className={`degree-chip ${over.role ? `is-chord-tone role-${over.role}` : 'is-passing'}`}>{over.label}</em><span>{over.role ? CHORD_PLACE[over.role] : 'passing tone'}</span></>
        : <span>{path.chords.length ? 'no chord yet' : 'no chords on this page'}</span>}</dd></div>
    <div><dt>Hand</dt>
      <dd><strong>{segment.study.label}</strong><span>fret {segment.study.anchor}{note.stretch ? ' · stretch' : ''}</span></dd></div>
  </dl>;
}

/** Above the board: pick a song, play or step it, and read the note under the cursor. A recall round takes this place while it runs. */
export function SongBar({ songs, state }: { songs: Songs; state: State }) {
  const { song, path, cursor, phrase } = songs;
  const recallButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (songs.refocus.current) { songs.refocus.current = false; recallButton.current?.focus(); } }, []);
  return <section className="song-bar" aria-label="Song player">
    <label className="song-pick"><span className="sr-only">Song</span>
      <select value={song.id} onChange={e => songs.chooseSong(e.target.value)}>{SONGS.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
    </label>
    {!path ? <p className="song-empty" role="status">This song does not fit the current neck and tuning. Try a longer neck in Settings.</p> : <>
      <div className="song-transport">
        <button type="button" className="start-button" aria-pressed={songs.running} onClick={songs.listen}><Icon name={songs.running ? 'stop' : 'play'} />{songs.running ? 'Stop' : songs.loop ? 'Loop phrase' : 'Listen'}</button>
        <button type="button" className="icon-button" aria-label="Previous note" disabled={cursor === 0} onClick={() => songs.go(cursor - 1)}><Icon name="previous" /></button>
        <button type="button" className="icon-button" aria-label="Next note" disabled={cursor === path.notes.length - 1} onClick={() => songs.go(cursor + 1)}><Icon name="next" /></button>
        <button ref={recallButton} type="button" className="text-button song-recall-start" disabled={!phrase} onClick={() => songs.beginRecall()}
          title="Hide the melody and tap this phrase back from memory"><Icon name="target" />Play it back</button>
      </div>
      <NowPanel songs={songs} state={state} />
    </>}
  </section>;
}

/** A recall round: the phrase is hidden, the player taps it back in order. Laid out like the drill bar it is modelled on. */
export function RecallBar({ songs }: { songs: Songs }) {
  const { recall, phrase, phrases } = songs;
  const bar = useRef<HTMLElement>(null);
  useEffect(() => { bar.current?.focus(); }, []);
  if (!recall) return null;
  const total = recall.to - recall.from + 1;
  const last = !phrase || phrase.index === phrases.length - 1;
  return <section ref={bar} tabIndex={-1} className={`drill-bar song-recall ${recall.done ? 'is-complete' : ''}`} aria-label="Play it back">
    <div className="drill-prompt">
      <span className="drill-eyebrow">Play back</span>
      <strong>Phrase {(phrase?.index ?? 0) + 1}</strong>
      <span className="drill-where">of {phrases.length} · {songs.song.title}</span>
    </div>
    <div className="drill-progress" role="img" aria-label={`${Math.min(recall.at, recall.to + 1) - recall.from} of ${total} notes played`}>
      {Array.from({ length: total }, (_, i) => recall.from + i).map(index => <i key={index} className={`${index < recall.at ? 'done' : ''} ${recall.slips.includes(index) ? 'slip' : ''}`} />)}
    </div>
    <div className="drill-actions">
      {recall.done
        ? <><button className="text-button" onClick={songs.recallAgain}>Again</button>
          <button className="text-button" onClick={songs.recallNext} disabled={last}>Next phrase</button></>
        : <><button className="text-button" onClick={songs.hearPhrase}>Hear phrase</button>
          <button className="text-button" onClick={songs.hint} disabled={recall.hinted}>Hint</button>
          <button className="text-button" onClick={songs.recallAgain} disabled={recall.at === recall.from && !recall.slips.length}>Start over</button></>}
      <button className="text-button" onClick={songs.endRecall}>End</button>
    </div>
    <p className="drill-feedback" role="status" aria-live="polite">{songs.feedback || 'The first note is ringed. Tap the rest of the phrase from memory; the form is your map.'}</p>
  </section>;
}

/** Below the board: the song on one time axis, how it is played and shown, and what it is made of. */
export function SongDeck({ songs, state }: { songs: Songs; state: State }) {
  const { song, path, insight } = songs;
  return <section className="song-deck" aria-label="Song study">
    {path && insight && <>
      <SongTimeline songs={songs} />
      <div className="song-options">
        <div className="song-option"><span>Labels</span>
          <Segments label="Labels" value={songs.labels} onChange={songs.chooseLabels} options={[
            { value: 'degrees', label: 'Scale degrees', hint: 'Each note as a degree of the key' },
            { value: 'names', label: 'Note names' },
            { value: 'chord', label: 'From the chord', disabled: !path.chords.length, hint: path.chords.length ? 'Each note named from the root of the chord sounding' : 'This page gives no chords' },
          ]} />
        </div>
        <div className="song-option"><span>Play in</span>
          <Segments label="Play in" value={songs.homeForm === null ? 'best' : String(songs.homeForm)} onChange={value => songs.chooseHome(value === 'best' ? null : Number(value))}
            options={[{ value: 'best', label: 'Fewest moves' }, ...[1, 2, 3, 4, 5].map(form => ({ value: String(form), label: `Form ${form}` }))]} />
        </div>
        <div className="song-option"><span>Octave</span>
          <Segments label="Octave" value={songs.register} onChange={songs.chooseRegister}
            options={[{ value: 'low', label: 'As read' }, { value: 'high', label: 'Up an octave', disabled: !songs.highFits, hint: songs.highFits ? undefined : 'Needs a longer neck' }]} />
        </div>
        <div className="song-option song-sound">
          <label className="song-speed"><span>Speed</span>
            <select value={songs.speed} onChange={e => songs.chooseSpeed(Number(e.target.value))}>{SPEEDS.map(s => <option key={s} value={s}>{s * 100}%</option>)}</select>
          </label>
          <Toggle label="Loop the phrase" checked={songs.loop} onChange={songs.toggleLoop} />
          <Toggle label="Chords under the melody" checked={songs.backing && path.chords.length > 0} disabled={!path.chords.length} onChange={songs.toggleBacking} />
        </div>
      </div>
      <SongInsights insight={insight} path={path} spelling={state.spelling} onSeek={songs.go} />
    </>}
    <p className="song-source">{song.provenance} <a href={song.source} target="_blank" rel="noreferrer">Source</a></p>
  </section>;
}
