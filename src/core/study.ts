import { mod, position, scaleById, tuningFor } from './music';
import type { Tuning } from './music';
import { findShapes } from './shapes';
import type { Shape, ShapeRow } from './shapes';
import { selectedPitches } from './selection';
import type { State } from './state';

export type StudyMode = 'position' | 'shape' | 'diagonal' | 'all' | 'string' | 'nps';
export type Study = { id: string; form: number; anchor: number; label: string; rows: ShapeRow[]; shapes: Shape[] };

// Five two-note-per-string positions, relative to the minor tonic on low E.
// High e first. Major-family scales share the relative minor's geometry.
const FORMS = [
  [[0,3],[0,3],[0,2],[0,2],[0,2],[0,3]],
  [[3,5],[3,5],[2,4],[2,5],[2,5],[3,5]],
  [[5,7],[5,8],[4,7],[5,7],[5,7],[5,7]],
  [[7,10],[8,10],[7,9],[7,9],[7,10],[7,10]],
  [[10,12],[10,12],[9,12],[9,12],[10,12],[10,12]],
] as const;

export const tuningOf = (s: Pick<State, 'lowest' | 'fourths'>): Tuning => tuningFor(s.lowest, s.fourths);

// Where the minor tonic sits on the lowest string: lowering the guitar moves it up the neck.
const lowStringTonic = (s: State) => mod(s.root + (scaleById(s.scaleId).family === 'major' ? 9 : 0) - 4 + s.lowest);

// One string: the whole scale along a single string. Pick the string with the arrows.
function stringChoices(s: State): Study[] {
  if (!selectedPitches(s).length) return [];
  return [1, 2, 3, 4, 5, 6].map(string => ({ id: `string:${string}`, form: string, anchor: 0, label: `String ${string}`, rows: [{ string, left: 0, right: s.frets }], shapes: [] }));
}

// Three notes per string: seven scale notes ascending through all six strings, three on each.
// Each position starts on a different scale degree of the lowest string and repeats an octave higher.
function npsChoices(s: State, tuning: Tuning): Study[] {
  const degrees = [...new Set(selectedPitches(s))].sort((a, b) => mod(a - s.root) - mod(b - s.root));
  if (degrees.length !== 7) return [];
  const choices: Study[] = [];
  const low = tuning.midi[5];
  degrees.forEach((pitch, k) => {
    for (let octave = 0; octave < 3; octave++) {
      let midi = low + mod(pitch - low) + 12 * octave;
      const byString = new Map<number, number[]>();
      for (let j = 0; j < 18; j++) {
        if (j) midi += mod(degrees[(k + j) % 7] - degrees[(k + j - 1) % 7]) || 12;
        const string = 6 - Math.floor(j / 3);
        byString.set(string, [...(byString.get(string) ?? []), midi - tuning.midi[string - 1]]);
      }
      const rows = [...byString].map(([string, frets]) => ({ string, left: Math.min(...frets), right: Math.max(...frets) })).sort((a, b) => a.string - b.string);
      if (rows.some(row => row.left < 0 || row.right > s.frets)) continue;
      choices.push({ id: `nps:${k}:${octave}`, form: k + 1, anchor: Math.min(...rows.map(row => row.left)), label: `3NPS ${k + 1}`, rows, shapes: [] });
    }
  });
  return choices.sort((a, b) => a.anchor - b.anchor);
}

export function studyChoices(s: State): Study[] {
  const tuning = tuningOf(s);
  if (s.studyMode === 'string') return stringChoices(s);
  if (s.studyMode === 'nps') return npsChoices(s, tuning);
  const scale = scaleById(s.scaleId);
  if (!scale.family) return [];
  const tonic = lowStringTonic(s);
  const allShapes = (['rectangle', 'stack'] as const).flatMap(kind => findShapes({root:s.root,scaleId:s.scaleId,kind,frets:s.frets,includeFretEdges:s.studyMode==='diagonal',tuning}));
  if (s.studyMode === 'all') return [{id:'all',form:1,anchor:0,label:'Whole neck',rows:Array.from({length:6},(_,i)=>({string:i+1,left:0,right:s.frets})),shapes:allShapes}];
  if (s.studyMode === 'diagonal') {
    const family = allShapes.filter(shape => shape.kind === s.shapeKind);
    // A diagonal advances two strings and two frets, plus the G–B correction (none in all fourths).
    const chains = family.filter(shape => shape.rows.some(row=>row.string===6)).map(start => {
      const chain = [start];
      let bottom = Number(start.id.split(':')[1]);
      let base = Number(start.id.split(':')[2]);
      while (bottom > 2) {
        const nextBottom = bottom - 2;
        const nextBase = base + 2 + (bottom >= 3 && nextBottom <= 2 ? tuning.shift : 0);
        const next = family.find(shape => shape.id === `${s.shapeKind}:${nextBottom}:${nextBase}`);
        if (!next) break;
        chain.push(next); bottom = nextBottom; base = nextBase;
      }
      return chain;
    }).filter(chain=>chain.length>=2);
    const completeChains = chains.filter(chain=>!chains.some(other=>other!==chain && other.slice(1).some(shape=>shape.id===chain[0].id)));
    return completeChains.sort((a,b)=>a[0].from-b[0].from).map((shapes,i)=>({
      id:`diagonal:${shapes[0].id}`,form:i+1,anchor:Math.max(0,shapes[0].from),label:`Diagonal ${i+1}`,
      // The upper row of each rectangle adds the next tone for the diagonal run.
      rows:shapes.flatMap(shape=>shape.rows.map(row=>({...row,right:row.right+(s.shapeKind==='rectangle' && row.string===Number(shape.id.split(':')[1])-1?2:0)}))),shapes,
    }));
  }
  // The forms are written for standard tuning; all fourths raises the two highest strings by one fret's pitch.
  const standard = tuningFor(s.lowest, false);
  const offsets = standard.midi.map((midi, i) => midi - tuning.midi[i]);
  const choices: Study[] = [];
  FORMS.forEach((form, i) => {
    for (let octave = -2; octave <= 2; octave++) {
      const base = tonic + 12 * octave;
      const rows = form.map(([left,right],index)=>({string:index+1,left:base+left+offsets[index],right:base+right+offsets[index]}));
      if (rows.some(row=>row.left<0) || rows.every(row=>row.right>s.frets)) continue;
      const positionShapes = allShapes.filter(shape=>shape.rows.every(row=>rows.some(r=>r.string===row.string && r.left===row.left && r.right===row.right)));
      const shape = positionShapes.filter(shape=>shape.kind===s.shapeKind).sort((a,b)=>b.rows.length-a.rows.length || a.rows[0].string-b.rows[0].string)[0];
      const shapes = s.studyMode === 'shape' ? shape ? [shape] : [] : positionShapes;
      if (!shapes.length) continue;
      choices.push({id:`${i+1}:${base}`,form:i+1,anchor:rows[5].left,label:`Form ${i+1}`,rows:s.studyMode==='shape'?shapes.flatMap(shape=>shape.rows):rows,shapes});
    }
  });
  return choices.sort((a,b)=>a.anchor-b.anchor);
}

export function activeStudyFromChoices(s: State, choices: Study[]): Study | undefined {
  const sameForm = choices.filter(choice=>choice.form===s.form);
  const candidates = sameForm.length ? sameForm : choices;
  const preferred = s.studyFret ?? lowStringTonic(s);
  return [...candidates].sort((a,b)=>Math.abs(a.anchor-preferred)-Math.abs(b.anchor-preferred))[0];
}

export function activeStudy(s: State): Study | undefined {
  return activeStudyFromChoices(s, studyChoices(s));
}

export const inStudy = (string: number, fret: number, study?: Study) => !study || study.rows.some(row=>row.string===string && fret>=row.left && fret<=row.right);

export function ghostStudiesFromChoices(s: State, choices: Study[], current = activeStudyFromChoices(s, choices)): Study[] {
  if (s.studyMode !== 'position' || !s.ghostForms) return [];
  if (!current || choices.length < 2) return [];
  const index = choices.findIndex(choice => choice.id === current.id);
  if (index === -1) return [];
  const neighbors: Study[] = [];
  if (index > 0) neighbors.push(choices[index - 1]);
  if (index < choices.length - 1) neighbors.push(choices[index + 1]);
  return neighbors;
}

export function ghostStudies(s: State): Study[] {
  const choices = studyChoices(s);
  return ghostStudiesFromChoices(s, choices);
}

export function deriveStudy(s: State) {
  const choices = studyChoices(s);
  const study = activeStudyFromChoices(s, choices);
  return { choices, study, ghosts: ghostStudiesFromChoices(s, choices, study) };
}

// Join neighboring root locations along the neck: the octave/unison skeleton.
export function rootConnections(s: State) {
  const tuning = tuningOf(s);
  const roots = Array.from({length:6},(_,i)=>Array.from({length:s.frets+1},(_,fret)=>position(i+1,fret,tuning))).flat().filter(note=>note.pitch===s.root);
  const frets = [...new Set(roots.map(note=>note.fret))].sort((a,b)=>a-b);
  return frets.slice(1).flatMap((fret,i)=>roots.filter(n=>n.fret===frets[i]).flatMap(a=>roots.filter(b=>b.fret===fret && [2,3].includes(Math.abs(b.string-a.string))).map(b=>({a,b}))));
}
