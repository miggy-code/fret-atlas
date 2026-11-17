// A melody's path through the forms. A song stores only pitches and lengths; where each note is played is worked out
// here, by choosing the route through the five form placements that changes form least often.
import { parseAbc, parseKey } from './abc';
import type { AbcTune, Mode } from './abc';
import { parseChord } from './harmony';
import type { Chord, ChordTone } from './harmony';
import { mod, noteId, scaleById, STRINGS, tuningFor } from './music';
import { defaultState } from './state';
import type { State } from './state';
import { inStudy, studyChoices } from './study';
import type { Study } from './study';

export type Transition = 'pivot' | 'slide' | 'shift';
/** `chord` indexes the path's chords: the one sounding as the note starts, or null before the first. */
export type SongNote = { index: number; midi: number; start: number; beats: number; id: string; string: number; fret: number; segment: number; stretch: boolean; chord: number | null };
/** A run of notes played in one form placement. `change` says how the hand got here from the previous segment. */
export type Segment = { index: number; study: Study; from: number; to: number; start: number; beats: number; change?: Transition };
/** A chord from the song's page and how long it lasts; one written again bar after bar is a single span. */
export type SongChord = { index: number; chord: Chord; start: number; beats: number };
export type SongPath = { root: number; scaleId: string; tempo: number; meter: [number, number]; length: number; bars: number[]; notes: SongNote[]; segments: Segment[]; chords: SongChord[] };
export type Neck = Pick<State, 'frets' | 'lowest' | 'fourths'>;

/** How a song names its notes: by degree of the key (colored), by letter, or from the root of the chord sounding. */
export type SongLabels = 'degrees' | 'names' | 'chord';
/**
 * The board view a song plays in: its key and scale in Position view, the given placement selected and its neighbours
 * ghosted. The song picks the note view too; the saved one returns with the saved view.
 */
export const songView = (state: State, path: Pick<SongPath, 'root' | 'scaleId'>, study?: Study, labels: SongLabels = 'degrees'): State => ({
  ...state, studyMode: 'position', root: path.root, scaleId: path.scaleId, form: study?.form ?? 1, studyFret: study?.anchor ?? null,
  focus: false, strings: [...STRINGS], marks: [], triad: 'off', isolatedTones: [], wholeMap: false, hideAdded: false, ghostForms: true,
  labels: labels === 'names' ? 'notes' : 'intervals', luckyCharms: false, degreeColors: labels === 'degrees', chordColors: false,
});

// Each ABC mode is a scale in the catalog under its own name, except Ionian and Aeolian.
const SCALE_FOR_MODE: Record<Mode, string> = { major: 'major', dorian: 'dorian', phrygian: 'phrygian', lydian: 'lydian', mixolydian: 'mixolydian', minor: 'minor', locrian: 'locrian' };

const CHANGE = 10;       // Changing form costs more than any stretch, so the path changes form as rarely as it can.
const STRETCH = [0, 2];   // Reaching one fret past the form's row; any further is a move to another form.
const MOVE = .1;         // Per fret of hand travel, to break ties between equally few changes.
const AWAY = 3;          // Per note played outside the chosen form: more than a one-fret stretch, so the path stays home when it can.

/** How far a note lies outside a placement's row on its string: 0 inside, Infinity when the string has no row. */
function reach(study: Study, string: number, fret: number) {
  const row = study.rows.find(r => r.string === string);
  return row ? Math.max(0, row.left - fret, fret - row.right) : Infinity;
}

export type PathOptions = {
  /** Semitones from written to sounding pitch. Guitar music sounds an octave below the page, hence -12. */
  octave?: number;
  scaleId?: string;
  /** The key, as ABC writes one (`G`, `Ador`), for a page whose own key field names the wrong tonic. */
  key?: string;
  /** Play in this form wherever it reaches the melody, leaving it only where it must and coming back when it can. */
  homeForm?: number;
};

/**
 * Fingers a melody (written pitches, as ABC gives them) for the given neck. The melody moves up an octave if it
 * would fall below the lowest string, and is refused if it runs off the top of the neck.
 */
export function songPath(tune: AbcTune, neck: Neck, { octave = -12, key: keyText, scaleId: scaleChoice, homeForm }: PathOptions = {}): SongPath {
  const key = keyText ? parseKey(keyText) : tune.key;
  const root = key.tonic, scaleId = scaleChoice ?? SCALE_FOR_MODE[key.mode];
  const tuning = tuningFor(neck.lowest, neck.fourths);
  const lowest = Math.min(...tuning.midi), highest = Math.max(...tuning.midi) + neck.frets;
  const written = tune.notes.map(n => n.midi);
  let shift = octave;
  while (Math.min(...written) + shift < lowest) shift += 12;
  if (Math.max(...written) + shift > highest) throw new RangeError(`${tune.title} does not fit a ${neck.frets}-fret neck`);

  const studies = studyChoices({ ...defaultState(), ...neck, studyMode: 'position', root, scaleId });
  if (!studies.length) throw new RangeError(`${scaleId} has no positions to play in`);
  type Option = { string: number; fret: number; study: number; reach: number };
  const options = tune.notes.map(note => {
    const places = STRINGS.map(string => ({ string, fret: note.midi + shift - tuning.midi[string - 1] })).filter(p => p.fret >= 0 && p.fret <= neck.frets);
    const fitting = places.flatMap(p => studies.map((s, study) => ({ ...p, study, reach: reach(s, p.string, p.fret) }))).filter(o => o.reach < STRETCH.length);
    // A note no form reaches is played from the nearest placement, at a cost that keeps it a last resort.
    if (fitting.length) return fitting;
    return places.flatMap(p => studies.map((s, study) => ({ ...p, study, reach: Math.min(reach(s, p.string, p.fret), 24) })));
  });
  const away = (o: Option) => homeForm !== undefined && studies[o.study].form !== homeForm ? AWAY : 0;
  const fit = (o: Option) => (STRETCH[o.reach] ?? 3 * CHANGE + o.reach) + away(o);

  // Viterbi over (position, placement): the cheapest way to have played every note so far.
  let cost = options[0].map(o => fit(o) + o.fret * .01);
  const back: number[][] = [[]];
  for (let k = 1; k < options.length; k++) {
    const prev = options[k - 1];
    const step = options[k].map(o => {
      let best = Infinity, from = 0;
      prev.forEach((p, j) => {
        const move = p.study === o.study ? 0 : CHANGE + MOVE * Math.abs(studies[p.study].anchor - studies[o.study].anchor);
        const total = cost[j] + move + MOVE * Math.abs(p.fret - o.fret) + fit(o);
        if (total < best) { best = total; from = j; }
      });
      return { best, from };
    });
    cost = step.map(s => s.best);
    back.push(step.map(s => s.from));
  }
  const chosen: Option[] = [];
  let at = cost.indexOf(Math.min(...cost));
  for (let k = options.length - 1; k >= 0; k--) { chosen.unshift(options[k][at]); at = back[k][at]; }

  const chords: SongChord[] = [];
  for (const { symbol, start } of tune.chords) {
    const chord = parseChord(symbol), last = chords[chords.length - 1];
    if (!chord || last?.chord.symbol === chord.symbol) continue;
    if (last) last.beats = start - last.start;
    chords.push({ index: chords.length, chord, start, beats: tune.length - start });
  }
  const chordAt = (beat: number) => chords.filter(c => c.start <= beat).at(-1)?.index ?? null;

  const notes: SongNote[] = [];
  const segments: Segment[] = [];
  chosen.forEach((o, k) => {
    const note = tune.notes[k];
    const last = segments[segments.length - 1];
    if (!last || last.study !== studies[o.study]) {
      const prev = chosen[k - 1];
      const change: Transition | undefined = !prev ? undefined
        : inStudy(prev.string, prev.fret, studies[o.study]) || inStudy(o.string, o.fret, studies[prev.study]) ? 'pivot'
        : prev.string === o.string ? 'slide' : 'shift';
      segments.push({ index: segments.length, study: studies[o.study], from: k, to: k, start: note.start, beats: 0, change });
    }
    const segment = segments[segments.length - 1];
    segment.to = k;
    segment.beats = note.start + note.beats - segment.start;
    notes.push({ index: k, midi: note.midi + shift, start: note.start, beats: note.beats, id: noteId(o.string, o.fret), string: o.string, fret: o.fret, segment: segment.index, stretch: o.reach > 0, chord: chordAt(note.start) });
  });
  return { root, scaleId, tempo: tune.tempo, meter: tune.meter, length: tune.length, bars: tune.bars, notes, segments, chords };
}

/**
 * Where a chord's tones lie under the hand in a form: inside its rows, and one fret past them for a tone the scale
 * lacks, since that is where a borrowed note (the C♯ of A7 in D minor) is reached from the form.
 */
export function chordInForm(chord: Chord, study: Study, neck: Neck, key: Pick<SongPath, 'root' | 'scaleId'>): { id: string; tone: ChordTone }[] {
  const tuning = tuningFor(neck.lowest, neck.fourths);
  const scale = scaleById(key.scaleId).tones.map(t => mod(key.root + t.semitones));
  return study.rows.flatMap(row => {
    const placed: { id: string; tone: ChordTone }[] = [];
    for (let fret = Math.max(0, row.left - 1); fret <= Math.min(neck.frets, row.right + 1); fret++) {
      const tone = chord.tones.find(t => t.pitch === mod(tuning.midi[row.string - 1] + fret));
      const inside = fret >= row.left && fret <= row.right;
      if (tone && (inside || !scale.includes(tone.pitch))) placed.push({ id: noteId(row.string, fret), tone });
    }
    return placed;
  });
}

/** `key` overrides the ABC's key field where the page names the wrong tonic; the ABC itself stays as published. */
export type Song = { id: string; title: string; abc: string; source: string; provenance: string; octave?: number; scaleId?: string; key?: string };
export const pathForSong = (song: Song, neck: Neck, options: PathOptions = {}) =>
  songPath(parseAbc(song.abc), neck, { octave: song.octave, scaleId: song.scaleId, key: song.key, ...options });
