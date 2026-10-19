import { describeNote, pitchName, scaleById } from './music';
import type { Note } from './music';
import { insideShape } from './shapes';
import type { Shape } from './shapes';
import { inFocus, selectedPitches, triadPitches } from './state';
import type { State } from './state';
import { activeStudy, ghostStudies, inStudy } from './study';
import type { Study } from './study';

export type ToneKind = 'root' | 'skeleton' | 'added' | 'context';
export function notePresentation(note: Note, s: State, shapes: Shape[] = [], study: Study | undefined = activeStudy(s), ghosts: Study[] = ghostStudies(s)) {
  const description = describeNote(note, s.root, scaleById(s.scaleId), s.spelling);
  const selected = selectedPitches(s).includes(note.pitch);
  const triad = triadPitches(s).includes(note.pitch);
  const marked = s.marks.includes(note.id);
  const membership = selected ? shapes.filter(shape => insideShape(note.string, note.fret, shape)) : [];
  const member = membership.length > 0;
  const focused = inFocus(s, note.string, note.fret);
  const kind: ToneKind = !selected ? 'context' : note.pitch === s.root ? 'root' : description.tone && !description.tone.skeleton ? 'added' : 'skeleton';
  const active = selected && inStudy(note.string,note.fret,study);
  const inGhost = s.ghostForms && ghosts.some(g => inStudy(note.string, note.fret, g));
  const ghost = inGhost && !active;
  const background = selected && !active && (s.wholeMap || inGhost || (s.skeleton && kind==='root'));
  const allowedBySkeleton = !s.hideAdded || kind !== 'added';
  const isIsolated = description.tone ? s.isolatedTones.includes(description.tone.semitones) : false;
  const degreeDimmed = selected && s.isolatedTones.length > 0 && !isIsolated;
  const visible = marked || (focused && (active || background) && allowedBySkeleton) || (focused && (!selected && s.context || triad));
  const role = kind === 'context' ? 'outside scale' : kind === 'root' ? 'root' : kind === 'added' ? 'added scale tone' : 'core scale tone';
  return { ...description, kind, selected, triad, marked, member, focused, visible, active, background, ghost, degreeDimmed, isolated: isIsolated, aria: `${description.name}${description.octave}, string ${note.string}, ${note.fret === 0 ? 'open' : `fret ${note.fret}`}, degree ${description.interval}, ${role}${member ? `, inside ${[...new Set(membership.map(shape => shape.kind))].join(' and ')}` : ''}${triad ? `, ${pitchName(s.triadRoot ?? s.root, s.spelling)} ${s.triad} triad` : ''}${isIsolated ? ', isolated degree' : ''}${!focused ? ', outside focus' : ''}${marked ? ', marked' : ''}` };
}

// Degree identity stays consistent between major and minor scales.
export const degreeColor = (degree: number) => ['#d47b22', '#e3b341', '#a365b5', '#67a7a1', '#58a86c', '#bf7a47', '#8b86c8'][degree - 1] ?? '#e8edf2';
