import { mod, scaleById, SCALES } from './music';
import type { Spelling } from './music';
import type { Shape, ShapeKind } from './shapes';
import { selectedPitches } from './selection';
import { activeStudy, studyChoices } from './study';
import type { StudyMode } from './study';

export type Labels = 'none' | 'notes' | 'intervals' | 'both';
export type NoteView = Labels | 'charms';
export type NoteColors = 'root' | 'degrees' | 'chord';
export type Triad = 'off' | 'major' | 'minor';
export interface State {
  version: 4;
  studyMode: StudyMode;
  shapeKind: ShapeKind;
  form: number;
  studyFret: number | null;
  wholeMap: boolean;
  hideAdded: boolean;
  root: number;
  scaleId: string;
  customPitches: number[];
  spelling: Spelling;
  frets: number;
  leftHanded: boolean;
  stringNames: boolean;
  labels: Labels;
  chordColors: boolean;
  degreeColors: boolean;
  luckyCharms: boolean;
  lowest: number;
  fourths: boolean;
  triad: Triad;
  triadRoot: number | null;
  patterns: ShapeKind[];
  skeleton: boolean;
  warp: boolean;
  ghostForms: boolean;
  isolatedTones: number[];
  overlayRows: number[];
  context: boolean;
  focus: boolean;
  from: number;
  to: number;
  strings: number[];
  marks: string[];
}
export const STORAGE_KEY = 'fret-atlas-v4';
export const inFocus = (s: State, string: number, fret: number) => s.strings.includes(string) && (!s.focus || (fret >= s.from && fret <= s.to));
export const shapeInFocus = (s: State, shape: Shape) => shape.rows.every(r => inFocus(s, r.string, r.left) && inFocus(s, r.string, r.right));
// Shape and Diagonal already study one family, so the family filter only applies to Position and Whole neck.
export const visibleShapes = (s: State, study = activeStudy(s)) => (study?.shapes ?? []).filter(shape => (s.studyMode === 'shape' || s.studyMode === 'diagonal' || s.patterns.includes(shape.kind)) && shapeInFocus(s, shape) && shape.rows.every(row => s.overlayRows.includes(row.string)));
export { selectedPitches };
export const triadPitches = (s: State) => s.triad === 'off' ? [] : [0, s.triad === 'major' ? 4 : 3, 7].map(interval => mod((s.triadRoot ?? s.root) + interval));
// Each control panel restores only the settings it owns. Pattern families, ghost forms and triads
// are set from the form bar and chord row, outside any panel, so no panel owns them.
export type Section = 'note-view' | 'overlays' | 'focus' | 'instrument';
export const SECTION_KEYS: Record<Section, (keyof State)[]> = {
  'note-view': ['labels', 'luckyCharms', 'degreeColors', 'chordColors', 'isolatedTones'],
  overlays: ['wholeMap', 'skeleton', 'warp', 'context', 'hideAdded', 'overlayRows'],
  focus: ['focus', 'from', 'to', 'strings'],
  instrument: ['frets', 'lowest', 'fourths', 'spelling', 'stringNames', 'leftHanded'],
};
export const sectionModified = (s: State, section: Section) => {
  const defaults = defaultState();
  return SECTION_KEYS[section].some(key => JSON.stringify(s[key]) !== JSON.stringify(defaults[key]));
};
export function defaultState(): State {
  return { version: 4, studyMode: 'position', shapeKind: 'rectangle', form: 1, studyFret: null, wholeMap: false, hideAdded: false, root: 9, scaleId: 'minor-pentatonic', customPitches: [0, 2, 4, 7, 9], spelling: 'sharps', frets: 12, leftHanded: false, stringNames: true, labels: 'none', chordColors: false, degreeColors: false, luckyCharms: false, lowest: 0, fourths: false, triad: 'off', triadRoot: null, patterns: ['rectangle', 'stack'], skeleton: false, warp: true, ghostForms: false, isolatedTones: [], overlayRows: [1, 2, 3, 4, 5, 6], context: false, focus: false, from: 3, to: 9, strings: [1, 2, 3, 4, 5, 6], marks: [] };
}
const isRecord = (raw: unknown): raw is Record<string, unknown> => !!raw && typeof raw === 'object' && !Array.isArray(raw);
const integer = (value: unknown, low: number, high: number) => typeof value === 'number' && Number.isInteger(value) && value >= low && value <= high;
const pitchList = (raw: unknown, fallback: number[]) => Array.isArray(raw) ? [...new Set(raw.filter((p): p is number => integer(p, 0, 11)))].sort((a, b) => a - b) : fallback;
export function restoreState(raw: unknown): State {
  const s = defaultState();
  if (!isRecord(raw)) return s;
  if (integer(raw.root, 0, 11)) s.root = raw.root as number;
  const legacy = raw.version !== 2 && raw.version !== 3 && raw.version !== 4;
  const scaleId = legacy ? raw.scale : raw.scaleId;
  if (typeof scaleId === 'string' && SCALES.some(scale => scale.id === scaleId)) s.scaleId = scaleId;
  else if (legacy && Array.isArray(raw.notes)) s.scaleId = 'custom';
  s.customPitches = pitchList(legacy ? raw.notes : raw.customPitches, s.customPitches);
  if (raw.spelling === 'sharps' || raw.spelling === 'flats') s.spelling = raw.spelling;
  if (typeof raw.labels === 'string' && ['none', 'notes', 'intervals', 'both'].includes(raw.labels)) s.labels = raw.labels as Labels;
  if (typeof raw.luckyCharms === 'boolean') s.luckyCharms = raw.luckyCharms;
  if (typeof raw.degreeColors === 'boolean') s.degreeColors = raw.degreeColors;
  if (typeof raw.fourths === 'boolean') s.fourths = raw.fourths;
  if (integer(raw.lowest, -2, 5)) s.lowest = raw.lowest as number;
  if (typeof raw.chordColors === 'boolean') s.chordColors = raw.chordColors;
  else if (raw.colors === 'charms') s.chordColors = true;
  if ([12, 15, 17, 22, 24].includes(raw.frets as number)) s.frets = raw.frets as number;
  for (const key of ['leftHanded', 'stringNames', 'skeleton', 'warp', 'context', 'focus'] as const) if (typeof raw[key] === 'boolean') s[key] = raw[key];
  if (raw.version === 4) {
    if (raw.studyMode === 'position' || raw.studyMode === 'shape' || raw.studyMode === 'diagonal' || raw.studyMode === 'all' || raw.studyMode === 'string' || raw.studyMode === 'nps') s.studyMode = raw.studyMode;
    if (raw.shapeKind === 'rectangle' || raw.shapeKind === 'stack') s.shapeKind = raw.shapeKind;
    if (integer(raw.form,1,20)) s.form = raw.form as number;
    if (integer(raw.studyFret,0,24)) s.studyFret = raw.studyFret as number;
    if (typeof raw.wholeMap === 'boolean') s.wholeMap = raw.wholeMap;
    if (typeof raw.hideAdded === 'boolean') s.hideAdded = raw.hideAdded;
  } else {
    s.hideAdded = s.skeleton;
    s.skeleton = false;
  }
  if (typeof raw.from === 'number' && Number.isFinite(raw.from)) s.from = Math.max(0, Math.min(s.frets, Math.trunc(raw.from)));
  if (typeof raw.to === 'number' && Number.isFinite(raw.to)) s.to = Math.max(s.from, Math.min(s.frets, Math.trunc(raw.to)));
  s.to = Math.max(s.from, Math.min(s.frets, s.to));
  if (Array.isArray(raw.strings)) s.strings = [...new Set(raw.strings.filter((n): n is number => integer(n, 1, 6)))];
  if (Array.isArray(raw.overlayRows)) s.overlayRows = [...new Set(raw.overlayRows.filter((n): n is number => integer(n, 1, 6)))].sort();
  if (Array.isArray(raw.marks)) s.marks = [...new Set(raw.marks.filter((id): id is string => typeof id === 'string' && /^[1-6]:(?:[0-9]|1[0-9]|2[0-4])$/.test(id)))];
  if (Array.isArray(raw.patterns)) s.patterns = [...new Set(raw.patterns.filter((kind): kind is ShapeKind => kind === 'rectangle' || kind === 'stack'))];
  else if (raw.lens === 'map' || raw.overlay === 'none') s.patterns = [];
  // Preserve legacy outline preferences alongside the new form selection.
  else if (raw.kind === 'rectangle' || raw.kind === 'stack') s.patterns = [raw.kind];
  else if (raw.overlay === 'rectangle' || raw.overlay === 'stack') s.patterns = [raw.overlay];
  if (typeof raw.ghostForms === 'boolean') s.ghostForms = raw.ghostForms;
  if (Array.isArray(raw.isolatedTones)) s.isolatedTones = [...new Set(raw.isolatedTones.filter((n): n is number => integer(n, 0, 11)))].sort((a, b) => a - b);
  if (raw.triad === 'off' || raw.triad === 'major' || raw.triad === 'minor') s.triad = raw.triad;
  if (integer(raw.triadRoot, 0, 11)) s.triadRoot = raw.triadRoot as number;
  // Keep the exact note selection from older triad-only studies.
  if (s.scaleId === 'major-triad' || s.scaleId === 'minor-triad') {
    s.triad = s.scaleId === 'major-triad' ? 'major' : 'minor';
    s.triadRoot = s.root;
    s.customPitches = selectedPitches(s);
    s.scaleId = 'custom';
  }
  if (s.luckyCharms) s.labels = 'none';
  if (s.degreeColors) s.chordColors = false;
  return s;
}
type Preference = 'luckyCharms' | 'degreeColors' | 'fourths' | 'leftHanded' | 'stringNames' | 'skeleton' | 'warp' | 'ghostForms' | 'context' | 'focus' | 'chordColors' | 'wholeMap' | 'hideAdded';
export type Action =
  | { type: 'study-mode'; value: StudyMode }
  | { type: 'shape-kind'; value: ShapeKind }
  | { type: 'study-step'; direction: number }
  | { type: 'form'; value: number }
  | { type: 'root'; value: number }
  | { type: 'scale'; value: string }
  | { type: 'isolate-tone'; value: number }
  | { type: 'clear-isolated-tones' }
  | { type: 'pattern'; value: ShapeKind }
  | { type: 'patterns'; value: ShapeKind[] }
  | { type: 'labels'; value: Labels }
  | { type: 'note-view'; value: NoteView }
  | { type: 'note-colors'; value: NoteColors }
  | { type: 'triad'; value: Triad }
  | { type: 'triad-root'; value: number | null }
  | { type: 'spelling'; value: Spelling }
  | { type: 'frets'; value: number }
  | { type: 'toggle'; key: Preference }
  | { type: 'range'; from: number; to: number }
  | { type: 'string'; value: number }
  | { type: 'overlay-row'; value: number }
  | { type: 'focus-reset' }
  | { type: 'pitch'; value: number }
  | { type: 'pitches'; value: number[] }
  | { type: 'mark'; id: string }
  | { type: 'clear-marks' }
  | { type: 'lowest'; value: number }
  | { type: 'reset-view' }
  | { type: 'reset-section'; value: Section };
const toggleItem = <T,>(items: T[], item: T) => items.includes(item) ? items.filter(i => i !== item) : [...items, item];
export function reducer(s: State, action: Action): State {
  switch (action.type) {
    case 'study-mode': {
      const current = activeStudy(s);
      const next = { ...s, studyMode: action.value, studyFret: null };
      if (s.studyMode === 'shape' && action.value === 'diagonal' && current?.shapes[0]) {
        const diagonal = studyChoices(next).find(choice => choice.shapes.some(shape => shape.id === current.shapes[0].id));
        if (diagonal) return { ...next, form: diagonal.form, studyFret: diagonal.anchor };
      }
      return { ...next, form: current?.form ?? s.form };
    }
    case 'shape-kind': return { ...s, shapeKind: action.value, studyFret: null, patterns: [...new Set([...s.patterns,action.value])] };
    case 'form': {
      if (!integer(action.value,1,5)) return s;
      let next = { ...s, form: action.value, studyFret: null };
      // A short neck can omit a complete form. Extend it when that form is requested.
      if (s.studyMode === 'position' || s.studyMode === 'shape') {
        for (const frets of [s.frets, 15, 17, 22, 24].filter(f => f >= s.frets)) {
          next = { ...next, frets };
          if (studyChoices(next).some(choice => choice.form === action.value)) break;
        }
      }
      return next;
    }
    case 'study-step': {
      const choices = studyChoices(s);
      if (!choices.length) return s;
      const index = choices.findIndex(choice=>choice.id===activeStudy(s)?.id);
      const next = choices[mod(index + Math.sign(action.direction),choices.length)];
      return { ...s, form: next.form, studyFret: next.anchor };
    }
    case 'root': return integer(action.value, 0, 11) ? { ...s, root: mod(action.value), studyFret: null } : s;
    case 'scale': return SCALES.some(scale => scale.id === action.value) ? { ...s, scaleId: action.value, isolatedTones: [], customPitches: action.value === 'custom' ? selectedPitches(s) : s.customPitches } : s;
    case 'isolate-tone': return { ...s, isolatedTones: toggleItem(s.isolatedTones, action.value).sort((a, b) => a - b) };
    case 'clear-isolated-tones': return { ...s, isolatedTones: [] };
    case 'pattern': return { ...s, patterns: toggleItem(s.patterns, action.value) };
    case 'patterns': return { ...s, patterns: action.value.filter(kind => kind === 'rectangle' || kind === 'stack') };
    case 'labels': return { ...s, labels: action.value, luckyCharms: false };
    case 'note-view': return { ...s, labels: action.value === 'charms' ? 'none' : action.value, luckyCharms: action.value === 'charms' };
    case 'note-colors': return { ...s, degreeColors: action.value === 'degrees', chordColors: action.value === 'chord' };
    case 'triad': return { ...s, triad: action.value };
    case 'triad-root': return action.value === null || integer(action.value, 0, 11) ? { ...s, triadRoot: action.value } : s;
    case 'spelling': return { ...s, spelling: action.value };
    case 'frets': return [12, 15, 17, 22, 24].includes(action.value) ? { ...s, frets: action.value, from: Math.min(s.from, action.value), to: Math.min(s.to, action.value) } : s;
    case 'toggle': return { ...s, [action.key]: !s[action.key] };
    case 'range': {
      if (!Number.isFinite(action.from) || !Number.isFinite(action.to)) return s;
      const from = Math.max(0, Math.min(s.frets, Math.trunc(action.from)));
      return { ...s, from, to: Math.max(from, Math.min(s.frets, Math.trunc(action.to))) };
    }
    case 'string': return integer(action.value, 1, 6) ? { ...s, strings: toggleItem(s.strings, action.value).sort() } : s;
    case 'overlay-row': return integer(action.value, 1, 6) ? { ...s, overlayRows: toggleItem(s.overlayRows, action.value).sort() } : s;
    case 'focus-reset': return { ...s, focus: false, strings: [1, 2, 3, 4, 5, 6] };
    case 'pitch': return integer(action.value, 0, 11) ? { ...s, customPitches: toggleItem(selectedPitches(s), action.value).sort((a, b) => a - b), scaleId: 'custom' } : s;
    case 'pitches': return { ...s, customPitches: pitchList(action.value, []), scaleId: 'custom' };
    case 'mark': return /^[1-6]:(?:[0-9]|1[0-9]|2[0-4])$/.test(action.id) ? { ...s, marks: toggleItem(s.marks, action.id) } : s;
    case 'clear-marks': return { ...s, marks: [] };
    case 'lowest': return integer(action.value, -2, 5) ? { ...s, lowest: action.value, studyFret: null } : s;
    case 'reset-section': {
      const defaults = defaultState();
      const next = { ...s, studyFret: null } as Record<string, unknown>;
      for (const key of SECTION_KEYS[action.value]) next[key] = defaults[key];
      return next as unknown as State;
    }
    case 'reset-view': return { ...defaultState(), lowest: s.lowest, fourths: s.fourths, root: s.root, scaleId: s.scaleId, customPitches: s.customPitches, marks: s.marks };
  }
}
export function loadState(): State {
  try {
    const query = new URLSearchParams(window.location.search).get('atlas');
    if (query) return restoreState(JSON.parse(query));
  } catch { /* Invalid links fall back to this device's saved view. */ }
  try { return restoreState(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('fret-atlas-v3') ?? localStorage.getItem('fret-atlas-v2') ?? localStorage.getItem('fret-atlas-v1') ?? 'null')); }
  catch { return defaultState(); }
}
