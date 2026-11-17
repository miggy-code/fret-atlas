// Reads the part of ABC notation that a single-line traditional melody uses, so songs are stored exactly as published.
// Chord symbols, decorations, grace notes, slurs and lyrics are skipped; they carry no melody pitch or time.
import { mod } from './music';

export type Mode = 'major' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'minor' | 'locrian';
/** `start` and `beats` are in quarter notes. `midi` is the written pitch: ABC `C` is middle C (60). */
export type AbcNote = { midi: number; start: number; beats: number };
export type AbcTune = { title: string; meter: [number, number]; tempo: number; key: { tonic: number; mode: Mode }; notes: AbcNote[]; length: number };

const LETTER_SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_FIFTHS: Record<string, number> = { F: -1, C: 0, G: 1, D: 2, A: 3, E: 4, B: 5 };
const MODES: [string, Mode, number][] = [
  // [abbreviation, mode, fifths relative to the major key on the same tonic]
  ['maj', 'major', 0], ['ion', 'major', 0], ['min', 'minor', -3], ['aeo', 'minor', -3], ['m', 'minor', -3],
  ['dor', 'dorian', -2], ['phr', 'phrygian', -4], ['lyd', 'lydian', 1], ['mix', 'mixolydian', -1], ['loc', 'locrian', -5],
];

type Signature = Record<string, number>;
type Key = { tonic: number; mode: Mode; signature: Signature };

export function parseKey(text: string): Key {
  const match = /^\s*([A-Ga-g])([#b♯♭]?)\s*([A-Za-z]*)/.exec(text);
  if (!match) return { tonic: 0, mode: 'major', signature: {} };
  const letter = match[1].toUpperCase();
  const shift = match[2] === '#' || match[2] === '♯' ? 1 : match[2] === 'b' || match[2] === '♭' ? -1 : 0;
  const word = match[3].toLowerCase();
  const [, mode, offset] = MODES.find(([abbr]) => abbr === 'm' ? word === 'm' : word.startsWith(abbr)) ?? ['', 'major', 0];
  const fifths = LETTER_FIFTHS[letter] + 7 * shift + offset;
  const signature: Signature = {};
  'FCGDAEB'.slice(0, Math.max(0, fifths)).split('').forEach(l => { signature[l] = 1; });
  'BEADGCF'.slice(0, Math.max(0, -fifths)).split('').forEach(l => { signature[l] = -1; });
  return { tonic: mod(LETTER_SEMITONES[letter] + shift), mode, signature };
}

const fraction = (text: string) => {
  const [num, den] = text.split('/').map(Number);
  return den ? num / den : num;
};

type Bar = { start?: boolean; end?: boolean; ending?: number; close?: boolean };
type Item = { kind: 'note'; midi: number; beats: number; tie: boolean } | { kind: 'rest'; beats: number } | { kind: 'bar'; bar: Bar };

export function parseAbc(abc: string): AbcTune {
  const header: Record<string, string> = {};
  const body: string[] = [];
  let inBody = false;
  for (const raw of abc.split(/\r?\n/)) {
    const line = raw.replace(/%.*$/, '').trimEnd();
    const field = /^([A-Za-z]):\s*(.*)$/.exec(line);
    if (field) {
      const [, name, value] = field;
      if (name === 'K' && inBody) body.push(`[K:${value}]`);
      else if (!inBody && !(name in header)) header[name] = value;
      if (name === 'K') inBody = true;
      continue;
    }
    if (inBody && line.trim()) body.push(line.replace(/\\$/, ''));
  }

  const meterText = (header.M ?? '4/4').trim();
  const meter: [number, number] = meterText === 'C' ? [4, 4] : meterText === 'C|' ? [2, 2] : meterText.split('/').map(Number) as [number, number];
  const unit = header.L ? fraction(header.L.trim()) : meter[0] / meter[1] < .75 ? 1 / 16 : 1 / 8;
  // Tempo is stored in quarter notes per minute, whatever note value the tune counts in.
  const tempoMatch = /(?:(\d+\/\d+)\s*=\s*)?(\d+)/.exec(header.Q ?? '');
  const tempo = tempoMatch ? fraction(tempoMatch[1] ?? String(unit)) * 4 * Number(tempoMatch[2]) : 100;
  let key = parseKey(header.K ?? 'C');
  const firstKey = key;

  const items: Item[] = [];
  const text = body.join(' ');
  let accidentals: Record<string, number> = {};
  let tuplet: { left: number; factor: number } | undefined;
  let broken = 1;
  let i = 0;
  const lengthAt = () => {
    const match = /^(\d*)(\/*)(\d*)/.exec(text.slice(i))!;
    i += match[0].length;
    const num = match[1] ? Number(match[1]) : 1;
    const den = match[3] ? Number(match[3]) : 2 ** match[2].length;
    return num / den;
  };
  // Returns the pitch of a note starting at `i`, or undefined if there is none there.
  const pitchAt = (): number | undefined => {
    const match = /^(\^\^|\^|__|_|=)?([A-Ga-g])([',]*)/.exec(text.slice(i));
    if (!match) return undefined;
    i += match[0].length;
    const [, acc, letterRaw, marks] = match;
    const letter = letterRaw.toUpperCase();
    const octave = (letterRaw === letter ? 0 : 1) + (marks.match(/'/g)?.length ?? 0) - (marks.match(/,/g)?.length ?? 0);
    const slot = `${letter}${octave}`;
    if (acc) accidentals[slot] = { '^^': 2, '^': 1, '=': 0, '_': -1, '__': -2 }[acc]!;
    const alteration = accidentals[slot] ?? key.signature[letter] ?? 0;
    return 60 + 12 * octave + LETTER_SEMITONES[letter] + alteration;
  };
  const timed = (beats: number) => {
    let length = beats * broken;
    broken = 1;
    if (tuplet) { length *= tuplet.factor; if (--tuplet.left === 0) tuplet = undefined; }
    return length;
  };
  const bar = (b: Bar) => { accidentals = {}; items.push({ kind: 'bar', bar: b }); };

  while (i < text.length) {
    const rest = text.slice(i);
    const ch = text[i];
    // Bar lines, repeats (`|:`, `:|`, `::`) and first/second endings (`|1`, `:|2`, `[1`).
    const barMatch = /^(:*)(\[\||\|\]|\|\||\|)(:*)(\d)?/.exec(rest) ?? /^(::)()()(\d)?/.exec(rest);
    if (barMatch) {
      const [all, before, symbol, after, ending] = barMatch;
      const both = all.startsWith('::') && !symbol;
      i += all.length;
      bar({ end: !!before || both, start: !!after || both, close: symbol === '|]' || symbol === '||' || symbol === '[|', ending: ending ? Number(ending) : undefined });
      continue;
    }
    const endingMatch = /^\[(\d)/.exec(rest);
    if (endingMatch) { i += endingMatch[0].length; bar({ ending: Number(endingMatch[1]) }); continue; }
    if (ch === '"') { i = text.indexOf('"', i + 1) + 1 || text.length; continue; }
    if (ch === '!' || ch === '+') { const close = text.indexOf(ch, i + 1); i = close === -1 ? i + 1 : close + 1; continue; }
    if (ch === '{') { i = text.indexOf('}', i) + 1 || text.length; continue; }
    if (rest.startsWith('[K:')) { const close = text.indexOf(']', i); key = parseKey(text.slice(i + 3, close)); i = close + 1; continue; }
    if (/^\[[A-Za-z]:/.test(rest)) { i = text.indexOf(']', i) + 1 || text.length; continue; }
    if (ch === '(' && /\d/.test(text[i + 1] ?? '')) {
      const match = /^\((\d)(?::(\d*))?(?::(\d*))?/.exec(rest)!;
      i += match[0].length;
      const p = Number(match[1]);
      const compound = meter[0] % 3 === 0 && meter[0] > 3;
      const q = match[2] ? Number(match[2]) : [3, 6].includes(p) ? 2 : [2, 4, 8].includes(p) ? 3 : compound ? 3 : 2;
      tuplet = { left: match[3] ? Number(match[3]) : p, factor: q / p };
      continue;
    }
    // Broken rhythm: `a>b` dots the first note and halves the second; `a<b` the reverse; `>>` double-dots.
    if (ch === '>' || ch === '<') {
      const run = /^(>+|<+)/.exec(rest)![0];
      const long = 2 - 1 / 2 ** run.length, short = 1 / 2 ** run.length;
      const last = items[items.length - 1];
      if (last && last.kind !== 'bar') last.beats *= ch === '>' ? long : short;
      broken = ch === '>' ? short : long;
      i += run.length;
      continue;
    }
    if (ch === 'z' || ch === 'x') { i++; items.push({ kind: 'rest', beats: timed(lengthAt() * unit * 4) }); continue; }
    if (ch === 'Z') { i++; const bars = Number(/^\d*/.exec(text.slice(i))![0] || 1); i += /^\d*/.exec(text.slice(i))![0].length; items.push({ kind: 'rest', beats: bars * meter[0] / meter[1] * 4 }); continue; }
    if (ch === '[') {
      // A chord: the melody is its highest note.
      i++;
      let top: number | undefined;
      let inner = 1;
      while (i < text.length && text[i] !== ']') {
        const pitch = pitchAt();
        if (pitch === undefined) { i++; continue; }
        inner = lengthAt();
        top = Math.max(top ?? pitch, pitch);
      }
      i++;
      const outer = lengthAt();
      if (top !== undefined) items.push({ kind: 'note', midi: top, beats: timed(inner * outer * unit * 4), tie: tieAt() });
      continue;
    }
    const pitch = pitchAt();
    if (pitch !== undefined) { items.push({ kind: 'note', midi: pitch, beats: timed(lengthAt() * unit * 4), tie: tieAt() }); continue; }
    i++;
  }

  function tieAt() {
    if (text[i] !== '-') return false;
    i++;
    return true;
  }

  // Play repeats through: a `:|` jumps back once to the last `|:`, and the second time round first endings are skipped.
  const played: Item[] = [];
  let from = 0, pass = 1, skipping = false, inEnding = false;
  for (let k = 0; k < items.length; k++) {
    const item = items[k];
    if (item.kind !== 'bar') { if (!skipping) played.push(item); continue; }
    const b = item.bar;
    if (inEnding && (b.close || b.start) && !b.end) { inEnding = false; skipping = false; pass = 1; }
    if (b.end && !skipping) {
      if (pass === 1) { pass = 2; k = from - 1; continue; }
      pass = 1; inEnding = false;
    }
    if (b.ending !== undefined) { inEnding = true; skipping = b.ending !== pass; }
    if (b.start) { from = k + 1; if (!inEnding) pass = 1; }
  }

  const notes: AbcNote[] = [];
  let time = 0, tied = false;
  for (const item of played) {
    if (item.kind === 'rest') { time += item.beats; tied = false; continue; }
    if (item.kind !== 'note') continue;
    const last = notes[notes.length - 1];
    if (tied && last && last.midi === item.midi) last.beats += item.beats;
    else notes.push({ midi: item.midi, start: time, beats: item.beats });
    time += item.beats;
    tied = item.tie;
  }
  return { title: header.T?.trim() ?? 'Untitled', meter, tempo, key: { tonic: firstKey.tonic, mode: firstKey.mode }, notes, length: time };
}
