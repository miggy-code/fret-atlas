import { gbShift, mod, position, scaleById, selectedPitches, STRING_COUNT, STRINGS, tuningFor } from './music';
import type { ScaleId, Tuning } from './music';
import { findShapes } from './shapes';
import type { Shape, ShapeKind, ShapeRow } from './shapes';

export const STUDY_MODES = ['position', 'shape', 'diagonal', 'all', 'string', 'nps'] as const;
export type StudyMode = typeof STUDY_MODES[number];
/**
 * What the studies are built from: the key and notes, the instrument and the chosen view. The saved view has all of
 * these fields, so callers pass it as it is; this layer never depends on how the view is stored.
 */
export type StudyInput = {
  root: number; scaleId: ScaleId; customPitches: number[];
  lowest: number; fourths: boolean; frets: number;
  studyMode: StudyMode; shapeKind: ShapeKind; form: number; studyFret: number | null; ghostForms: boolean;
};
type Notes = Pick<StudyInput, 'root' | 'scaleId' | 'customPitches'>;
/**
 * One thing to study on the neck: `rows` is where its notes lie, `shapes` the outlines that belong to it and `anchor`
 * its lowest fret, which orders the stepper. `form` numbers the choice within its view, so it means something
 * different in each: the pentatonic form 1–5 (Position, Shape), the diagonal's place along the neck, the string
 * (One string) or the scale degree the lowest string starts on (3 notes/string).
 */
export type Study = { id: string; form: number; anchor: number; label: string; rows: ShapeRow[]; shapes: Shape[] };

// Five two-note-per-string positions, relative to the minor tonic on low E.
// High e first. Major-family scales share the relative minor's geometry.
const FORM_ROWS = [
  [[0,3],[0,3],[0,2],[0,2],[0,2],[0,3]],
  [[3,5],[3,5],[2,4],[2,5],[2,5],[3,5]],
  [[5,7],[5,8],[4,7],[5,7],[5,7],[5,7]],
  [[7,10],[8,10],[7,9],[7,9],[7,10],[7,10]],
  [[10,12],[10,12],[9,12],[9,12],[10,12],[10,12]],
] as const;

export const tuningOf = (s: Pick<StudyInput, 'lowest' | 'fourths'>): Tuning => tuningFor(s.lowest, s.fourths);

// Keep added tones close to the form's overall hand position, without changing its outlines.
function scaleRows(rows: ShapeRow[], s: StudyInput, tuning: Tuning): ShapeRow[] {
  const added = scaleById(s.scaleId).tones.filter(t => !t.skeleton).map(t => mod(s.root + t.semitones));
  const left = Math.max(0, Math.min(...rows.map(row => row.left)) - 1);
  const right = Math.min(s.frets, Math.max(...rows.map(row => row.right)) + 1);
  return rows.map(row => {
    const from = Math.max(left, row.left - 2), to = Math.min(right, row.right + 2);
    const nearby = Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i)
      .filter(fret => added.includes(position(row.string, fret, tuning).pitch));
    return { ...row, left: Math.max(0, Math.min(row.left, ...nearby)), right: Math.min(s.frets, Math.max(row.right, ...nearby)) };
  }).filter(row => row.left <= row.right);
}

// The forms are the minor pentatonic's; a major-family scale wears those of its relative minor, nine semitones above its root.
const RELATIVE_MINOR = 9;
// The lowest fret where the forms' minor tonic falls on the lowest string: lowering the guitar moves it up the neck.
const lowStringTonic = (s: StudyInput, tuning: Tuning) => mod(s.root + (scaleById(s.scaleId).family === 'major' ? RELATIVE_MINOR : 0) - tuning.midi.at(-1)!);

/**
 * Whether a study view makes sense for the scale or custom notes; the view picker disables the rest.
 * `studyChoices` builds nothing for a view that fails its rule here, so the generators below can rely on it.
 */
export function studyModeAvailable(s: Notes, mode: StudyMode): boolean {
  switch (mode) {
    // Position needs a named scale: forms for a pentatonic family, fret windows for the rest.
    case 'position': return s.scaleId !== 'custom';
    // Shape and Diagonal walk the pentatonic outlines.
    case 'shape': case 'diagonal': return !!scaleById(s.scaleId).family;
    case 'string': return selectedPitches(s).length > 0;
    // Three notes per string climbs a seven-note scale.
    case 'nps': return new Set(selectedPitches(s)).size === 7;
    case 'all': return true;
  }
}

// One string: the whole scale along a single string. Pick the string with the arrows.
function stringChoices(s: StudyInput): Study[] {
  return STRINGS.map(string => ({ id: `string:${string}`, form: string, anchor: 0, label: `String ${string}`, rows: [{ string, left: 0, right: s.frets }], shapes: [] }));
}

// Three notes per string: seven scale notes ascending through all six strings, three on each.
// Each position starts on a different scale degree of the lowest string and repeats an octave higher.
function npsChoices(s: StudyInput, tuning: Tuning): Study[] {
  const degrees = [...new Set(selectedPitches(s))].sort((a, b) => mod(a - s.root) - mod(b - s.root));
  const choices: Study[] = [];
  const low = tuning.midi.at(-1)!;
  degrees.forEach((pitch, k) => {
    for (let octave = 0; octave < 3; octave++) {
      let midi = low + mod(pitch - low) + 12 * octave;
      const byString = new Map<number, number[]>();
      for (let j = 0; j < 3 * STRING_COUNT; j++) {
        if (j) midi += mod(degrees[(k + j) % 7] - degrees[(k + j - 1) % 7]) || 12;
        const string = STRING_COUNT - Math.floor(j / 3);
        byString.set(string, [...(byString.get(string) ?? []), midi - tuning.midi[string - 1]]);
      }
      const rows = [...byString].map(([string, frets]) => ({ string, left: Math.min(...frets), right: Math.max(...frets) })).sort((a, b) => a.string - b.string);
      if (rows.some(row => row.left < 0 || row.right > s.frets)) continue;
      choices.push({ id: `nps:${k}:${octave}`, form: k + 1, anchor: Math.min(...rows.map(row => row.left)), label: `3 per string · ${k + 1}`, rows, shapes: [] });
    }
  });
  return choices.sort((a, b) => a.anchor - b.anchor);
}

/**
 * Where the five forms lie for this key and tuning, before any outline is matched to them: each form at every octave
 * that reaches the neck. `base` is the fret of the forms' minor tonic on the lowest string for that octave.
 */
export function formPlacements(s: StudyInput, tuning = tuningOf(s)): { form: number; base: number; rows: ShapeRow[] }[] {
  const tonic = lowStringTonic(s, tuning);
  // The forms are written for standard tuning; all fourths raises the two highest strings by one fret's pitch.
  const standard = tuningFor(s.lowest, false);
  const offsets = standard.midi.map((midi, i) => midi - tuning.midi[i]);
  return FORM_ROWS.flatMap((form, i) => [-2, -1, 0, 1, 2].map(octave => {
    const base = tonic + 12 * octave;
    return { form: i + 1, base, rows: form.map(([left,right],index)=>({string:index+1,left:base+left+offsets[index],right:base+right+offsets[index]})) };
  })).filter(({ rows }) => !rows.some(row=>row.right<0) && !rows.every(row=>row.left>s.frets));
}

export function studyChoices(s: StudyInput): Study[] {
  if (!studyModeAvailable(s, s.studyMode)) return [];
  const tuning = tuningOf(s);
  if (s.studyMode === 'string') return stringChoices(s);
  if (s.studyMode === 'nps') return npsChoices(s, tuning);
  const scale = scaleById(s.scaleId);
  if (!scale.family && s.studyMode === 'position') {
    return Array.from({ length: Math.ceil((s.frets + 1) / 3) }, (_, i) => {
      const left = i * 3, right = Math.min(s.frets, left + 4);
      return { id: `position:${left}`, form: 1, anchor: left, label: `Position ${left}–${right}`, rows: STRINGS.map(string => ({ string, left, right })), shapes: [] };
    });
  }
  if (!scale.family) return [];
  const allShapes = (['rectangle', 'stack'] as const).flatMap(kind => findShapes({root:s.root,scaleId:s.scaleId,kind,frets:s.frets,includeFretEdges:true,tuning}));
  if (s.studyMode === 'all') return [{id:'all',form:1,anchor:0,label:'Whole neck',rows:STRINGS.map(string=>({string,left:0,right:s.frets})),shapes:allShapes}];
  if (s.studyMode === 'diagonal') {
    const family = allShapes.filter(shape => shape.kind === s.shapeKind);
    // A diagonal advances two strings and two frets, plus the G–B correction (none in all fourths).
    const chains = family.filter(shape => shape.rows.some(row=>row.string===STRING_COUNT)).map(start => {
      const chain = [start];
      let { bottom, base } = start;
      while (bottom > 2) {
        const nextBottom = bottom - 2;
        const nextBase = base + 2 + (bottom >= 3 && nextBottom <= 2 ? gbShift(tuning) : 0);
        const next = family.find(shape => shape.bottom === nextBottom && shape.base === nextBase);
        if (!next) break;
        chain.push(next); bottom = nextBottom; base = nextBase;
      }
      return chain;
    }).filter(chain=>chain.length>=2);
    const completeChains = chains.filter(chain=>!chains.some(other=>other!==chain && other.slice(1).some(shape=>shape.id===chain[0].id)));
    return completeChains.sort((a,b)=>a[0].from-b[0].from).map((shapes,i)=>({
      id:`diagonal:${shapes[0].id}`,form:i+1,anchor:Math.max(0,shapes[0].from),label:`Diagonal ${i+1}`,
      // The upper row of each rectangle adds the next tone for the diagonal run.
      rows:scaleRows(shapes.flatMap(shape=>shape.rows.map(row=>({...row,right:row.right+(s.shapeKind==='rectangle' && row.string===shape.bottom-1?2:0)}))),s,tuning),shapes,
    }));
  }
  const choices: Study[] = [];
  for (const { form, base, rows } of formPlacements(s, tuning)) {
    const positionShapes = allShapes.filter(shape=>shape.rows.every(row=>rows.some(r=>r.string===row.string && r.left===row.left && r.right===row.right)));
    const shape = positionShapes.filter(shape=>shape.kind===s.shapeKind).sort((a,b)=>b.rows.length-a.rows.length || a.rows[0].string-b.rows[0].string)[0];
    const shapes = s.studyMode === 'shape' ? shape ? [shape] : [] : positionShapes;
    if (!shapes.length) continue;
    choices.push({id:`${form}:${base}`,form,anchor:Math.max(0,rows[STRING_COUNT - 1].left),label:`Form ${form}`,rows:scaleRows(s.studyMode==='shape'?shapes.flatMap(shape=>shape.rows):rows,s,tuning),shapes});
  }
  return choices.sort((a,b)=>a.anchor-b.anchor);
}

export function activeStudyFromChoices(s: StudyInput, choices: Study[]): Study | undefined {
  const sameForm = choices.filter(choice=>choice.form===s.form);
  const candidates = sameForm.length ? sameForm : choices;
  const preferred = s.studyFret ?? (scaleById(s.scaleId).family ? lowStringTonic(s, tuningOf(s)) : 0);
  return [...candidates].sort((a,b)=>Math.abs(a.anchor-preferred)-Math.abs(b.anchor-preferred) || b.anchor-a.anchor)[0];
}

export function activeStudy(s: StudyInput): Study | undefined {
  return activeStudyFromChoices(s, studyChoices(s));
}

export const inStudy = (string: number, fret: number, study?: Study) => !study || study.rows.some(row=>row.string===string && fret>=row.left && fret<=row.right);

export function ghostStudiesFromChoices(s: StudyInput, choices: Study[], current = activeStudyFromChoices(s, choices)): Study[] {
  if (s.studyMode !== 'position' || !s.ghostForms) return [];
  if (!current || choices.length < 2) return [];
  const index = choices.findIndex(choice => choice.id === current.id);
  if (index === -1) return [];
  const neighbors: Study[] = [];
  if (index > 0) neighbors.push(choices[index - 1]);
  if (index < choices.length - 1) neighbors.push(choices[index + 1]);
  return neighbors;
}

export function ghostStudies(s: StudyInput): Study[] {
  const choices = studyChoices(s);
  return ghostStudiesFromChoices(s, choices);
}

export function deriveStudy(s: StudyInput) {
  const choices = studyChoices(s);
  const study = activeStudyFromChoices(s, choices);
  return { choices, study, ghosts: ghostStudiesFromChoices(s, choices, study) };
}

// Join neighboring root locations along the neck: the octave/unison skeleton.
export function rootConnections(s: StudyInput) {
  const tuning = tuningOf(s);
  const roots = STRINGS.flatMap(string=>Array.from({length:s.frets+1},(_,fret)=>position(string,fret,tuning))).filter(note=>note.pitch===s.root);
  const frets = [...new Set(roots.map(note=>note.fret))].sort((a,b)=>a-b);
  return frets.slice(1).flatMap((fret,i)=>roots.filter(n=>n.fret===frets[i]).flatMap(a=>roots.filter(b=>b.fret===fret && [2,3].includes(Math.abs(b.string-a.string))).map(b=>({a,b}))));
}
