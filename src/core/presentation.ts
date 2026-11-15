import { chordRole, describeNote, pitchName, scaleById, selectedPitches } from './music';
import type { ChordRole, Note, Scale, Tone } from './music';
import { insideShape } from './shapes';
import type { Shape } from './shapes';
import { inFocus, noteColorsOf, noteViewOf, shownTriad, triadPitches } from './state';
import type { State } from './state';
import { activeStudy, ghostStudies, inStudy } from './study';
import type { Study } from './study';

export type ToneKind = 'root' | 'skeleton' | 'added' | 'context';

// Degree identity stays consistent between major and minor scales.
// The colors are the --degree-N tokens, so the board, the legend and the button previews share one source.
export const degreeColor = (degree: number) => degree >= 1 && degree <= 7 ? `var(--degree-${degree})` : '#e8edf2';

export type ToneAppearance = { charm: number | undefined; degreeColored: boolean; chordRole: ChordRole | undefined; color: string | undefined };
const PLAIN: ToneAppearance = { charm: undefined, degreeColored: false, chordRole: undefined, color: undefined };
/**
 * How a scale tone is drawn under the chosen note view and colors. The board's notes and the legend's chips both ask here,
 * so they cannot disagree: Lucky Charms gives each degree a silhouette, Scale degrees colors every tone but the root,
 * and Chord tones colors the scale's own third and fifth.
 */
export function toneAppearance(s: State, scale: Scale, t: Tone): ToneAppearance {
  const charms = noteViewOf(s) === 'charms', colors = noteColorsOf(s);
  return {
    charm: charms ? t.degree : undefined,
    degreeColored: !charms && colors === 'degrees' && t.semitones !== 0,
    chordRole: !charms && colors === 'chord' ? chordRole(scale, t) : undefined,
    color: degreeColor(t.degree),
  };
}

export function notePresentation(note: Note, s: State, shapes: Shape[] = [], study: Study | undefined = activeStudy(s), ghosts: Study[] = ghostStudies(s)) {
  const scale = scaleById(s.scaleId);
  const description = describeNote(note, s.root, scale, s.spelling);
  const triadShown = shownTriad(s);
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
  // Diagonal runs add the next scale tone beyond each block; keep those visibly secondary.
  const run = s.studyMode === 'diagonal' && active && shapes.length > 0 && !member;
  const background = selected && !active && (s.wholeMap || inGhost || (s.skeleton && kind==='root'));
  const allowedBySkeleton = !s.hideAdded || kind !== 'added';
  const isIsolated = description.tone ? s.isolatedTones.includes(description.tone.semitones) : false;
  const degreeDimmed = selected && s.isolatedTones.length > 0 && !isIsolated;
  const visible = marked || (focused && (active || background) && allowedBySkeleton) || (focused && (!selected && s.context || triad));
  const role = kind === 'context' ? 'outside scale' : kind === 'root' ? 'root' : kind === 'added' ? 'added scale tone' : 'core scale tone';
  const appearance = description.tone ? toneAppearance(s, scale, description.tone) : PLAIN;
  return { ...description, ...appearance, kind, selected, triad, marked, member, run, focused, visible, active, background, ghost, degreeDimmed, isolated: isIsolated, aria: `${description.name}${description.octave}, string ${note.string}, ${note.fret === 0 ? 'open' : `fret ${note.fret}`}, degree ${description.interval}, ${role}${member ? `, inside ${[...new Set(membership.map(shape => shape.kind))].join(' and ')}` : ''}${triad && triadShown ? `, ${pitchName(triadShown.root, s.spelling)} ${triadShown.quality} triad` : ''}${isIsolated ? ', isolated degree' : ''}${!focused ? ', outside focus' : ''}${marked ? ', marked' : ''}` };
}
