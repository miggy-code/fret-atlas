import { degreeLabel, mod, pitchName, position, scaleById, spellTone } from './music';
import { inFocus, selectedPitches } from './state';
import type { State } from './state';
import { inStudy, tuningOf } from './study';
import type { Study } from './study';
import type { ShapeRow } from './shapes';

// A drill names one pitch and asks for every place it occurs, either along one string or inside the current form.
export type DrillKind = 'string' | 'form' | 'view';
export interface DrillRequest { pitches: number[]; label: string }
export interface Drill { key: string; kind: DrillKind; pitch: number; name: string; degree: string; where: string; targets: string[]; zone: ShapeRow[]; group?: string }
export type TapResult = 'hit' | 'repeat' | 'miss';

// Forms are the point of the app, so form drills only appear in the views that show one.
export const formDrillAvailable = (s: State, study?: Study) => !!study && !!scaleById(s.scaleId).family && ['position', 'shape', 'diagonal'].includes(s.studyMode);

function candidates(s: State, study?: Study, request?: DrillRequest) {
  const scale = scaleById(s.scaleId);
  const tuning = tuningOf(s);
  const custom = s.scaleId === 'custom';
  const pitches = [...new Set(request ? request.pitches : selectedPitches(s))];
  // Same names as the board's string gutter: high e is lowercase.
  const stringName = (string: number) => string === 1 ? pitchName(tuning.midi[0], s.spelling).toLowerCase() : pitchName(tuning.midi[string - 1], s.spelling);
  const label = (pitch: number) => {
    const tone = custom ? undefined : scale.tones.find(t => mod(s.root + t.semitones) === pitch);
    return { name: tone ? spellTone(s.root, s.spelling, tone).name : pitchName(pitch, s.spelling), degree: tone ? degreeLabel(tone) : '' };
  };
  const notesWhere = (pitch: number, keep: (string: number, fret: number) => boolean) => {
    const ids: string[] = [];
    for (let string = 1; string <= 6; string++) for (let fret = 0; fret <= s.frets; fret++) {
      if (position(string, fret, tuning).pitch === pitch && inFocus(s, string, fret) && keep(string, fret)) ids.push(`${string}:${fret}`);
    }
    return ids;
  };
  const drills: Drill[] = [];
  for (const pitch of pitches) {
    const { name, degree } = label(pitch);
    if (request) {
      const targets = notesWhere(pitch, (string, fret) => inStudy(string, fret, study));
      const zone = (study?.rows ?? s.strings.map(string => ({ string, left: 0, right: s.frets })))
        .filter(row => s.strings.includes(row.string))
        .map(row => ({ ...row, left: Math.max(row.left, s.focus ? s.from : 0), right: Math.min(row.right, s.focus ? s.to : s.frets) }))
        .filter(row => row.left <= row.right);
      if (targets.length) drills.push({ key: `view:${study?.id ?? 'neck'}:${pitch}`, kind: formDrillAvailable(s, study) ? 'form' : 'view', pitch, name, degree, where: study ? `in ${study.label}` : 'across the visible neck', targets, zone, group: request.label });
      continue;
    }
    for (const string of s.strings) {
      const targets = notesWhere(pitch, str => str === string);
      if (targets.length) drills.push({ key: `string:${string}:${pitch}`, kind: 'string', pitch, name, degree, where: `on the ${stringName(string)} string`, targets, zone: [{ string, left: 0, right: s.frets }] });
    }
    if (formDrillAvailable(s, study)) {
      const targets = notesWhere(pitch, (string, fret) => inStudy(string, fret, study));
      if (targets.length) drills.push({ key: `form:${study!.id}:${pitch}`, kind: 'form', pitch, name, degree, where: `in ${study!.label}`, targets, zone: study!.rows.filter(row => s.strings.includes(row.string)).map(row => ({ string: row.string, left: Math.max(0, row.left), right: Math.min(s.frets, row.right) })) });
    }
  }
  return drills;
}

/** Picks a new drill for the current view. Prefers form drills half the time when the view has a form, and never repeats the previous prompt. */
export function nextDrill(s: State, study: Study | undefined, previous?: string, random = Math.random, request?: DrillRequest): Drill | undefined {
  const all = candidates(s, study, request);
  const fresh = all.filter(drill => drill.key !== previous);
  const pool = fresh.length ? fresh : all;
  if (request) return pool[Math.floor(random() * pool.length)];
  const forms = pool.filter(drill => drill.kind === 'form');
  const strings = pool.filter(drill => drill.kind === 'string');
  const family = forms.length && (!strings.length || random() < .5) ? forms : strings;
  return family[Math.floor(random() * family.length)];
}

export const tapResult = (drill: Drill, found: readonly string[], id: string): TapResult =>
  found.includes(id) ? 'repeat' : drill.targets.includes(id) ? 'hit' : 'miss';
