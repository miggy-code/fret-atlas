import { STRINGS, SHARPS, NATURALS, INTERVALS, INTERVAL_NAMES, noteName, intervalFrom, position, isInFocus, moveRegion, defaultState, restoreState } from './music.js';

import { layout } from './layout.js';
import { scaleById, scalePitches, shapesFor, activeShape, insideShape, preferredShapeIndex, shapePolygon, displayNote, displayOctave } from './scales.js';

const icons = {
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--surface)"/><circle cx="15" cy="17" r="3" fill="var(--surface)"/>',
  grid: '<path d="M5 3v18M12 3v18M19 3v18M3 7h18M3 17h18"/><circle cx="12" cy="12" r="2.4"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  pin: '<path d="m16 3 5 5-4 2-3 6-2-2-7 7 7-7-2-2 6-3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  focus: '<path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const app = document.querySelector('#app');
const storageKey = 'fret-atlas-v1';
let state;
try { state = restoreState(JSON.parse(localStorage.getItem(storageKey))); } catch { state = defaultState(); }
state.shapeIndex = Math.min(state.shapeIndex, Math.max(0, shapesFor(state).length - 1));
let helpOpen = false;
let focusOpen = false;
let viewOpen = false;
let lastFocusedPosition = '1:0';
const name = pitch => displayNote(state, pitch);
const pressed = value => `aria-pressed="${Boolean(value)}"`;

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* The explorer works without browser storage. */ }
}

function centerCurrentShape() {
  const scroll = document.querySelector('.board-scroll');
  const polygon = document.querySelector('.shape-overlay polygon');
  if (!scroll || !polygon) return;
  const bounds = polygon.getBoundingClientRect();
  const center = (bounds.left + bounds.right) / 2;
  // Reserve the sticky string gutter, even when its labels are hidden.
  scroll.scrollLeft += center - (scroll.getBoundingClientRect().left + (scroll.clientWidth + 30) / 2);
}
window.addEventListener('resize', () => requestAnimationFrame(centerCurrentShape));

function render({ scrollToNut = false, scrollToShape = false } = {}) {
  const active = document.activeElement;
  const focusKey = active?.dataset.key;
  const scroll = document.querySelector('.board-scroll')?.scrollLeft || 0;
  app.innerHTML = layout(state, { icon, renderBoard, countMatches, focusOpen, viewOpen });
  const boardScroll = document.querySelector('.board-scroll');
  boardScroll.scrollLeft = scrollToNut ? (state.leftHanded ? boardScroll.scrollWidth : 0) : scroll;
  if (scrollToShape) centerCurrentShape();
  if (focusKey) document.querySelector(`[data-key="${focusKey}"]`)?.focus({ preventScroll: true });
  const dialog = document.querySelector('#help-dialog');
  if (helpOpen) dialog.showModal();
  dialog.addEventListener('close', () => { helpOpen = false; document.querySelector('.help-button')?.focus(); });
}

function renderBoard() {
  const shape = activeShape(state);
  const skeleton = scaleById(state.scale).skeleton?.map(i => (state.root + i) % 12);
  const frets = Array.from({ length: state.frets + 1 }, (_, i) => i);
  if (state.leftHanded) frets.reverse();
  const fretLabels = frets.map(f => `<div class="fret-number ${f === 0 ? 'open-label' : ''} ${state.focus && f >= state.from && f <= state.to ? 'focused-fret' : ''}">${f === 0 ? 'OPEN' : f}</div>`).join('');
  const inlays = frets.map(f => `<div class="inlay-cell">${[3, 5, 7, 9, 15, 17, 19, 21].includes(f) ? '<i></i>' : [12, 24].includes(f) ? '<i></i><i></i>' : ''}</div>`).join('');
  return `<div class="fretboard ${state.leftHanded ? 'left-handed' : ''} ${state.labels === 'none' ? 'dots-only' : ''} ${!state.stringNames ? 'no-string-names' : ''}" style="--fret-count:${state.frets};--board-min:${(state.frets + 1) * 62 + 36}px"><div class="fret-number-row"><div></div>${fretLabels}</div><div class="neck"><div class="inlay-row"><div></div>${inlays}</div>${shape ? `<svg class="shape-overlay ${shape.type}" viewBox="0 0 ${state.frets + 1} 6" preserveAspectRatio="none" aria-hidden="true"><polygon points="${shapePolygon(shape, state.frets, state.leftHanded)}" vector-effect="non-scaling-stroke"/></svg>` : ''}${STRINGS.map(s => `<div class="string-row" style="--string-width:${0.5 + s.number * 0.28}px"><div class="string-label" title="String ${s.number}: ${s.name}${s.octave}"><span>${s.number === 1 ? 'e' : s.name}</span><small>${s.number}</small></div>${frets.map(f => {
    const n = position(s.number, f);
    const highlighted = state.notes.includes(n.pitch);
    const inFocus = isInFocus(n, state);
    const marked = state.marks.includes(n.id);
    const root = n.pitch === state.root;
    const interval = INTERVALS[intervalFrom(n.pitch, state.root)];
    const member = highlighted && insideShape(n, shape);
    const extension = highlighted && skeleton && !skeleton.includes(n.pitch);
    const label = state.labels === 'none' ? '' : state.labels === 'intervals' ? interval : name(n.pitch);
    const desc = `${name(n.pitch)}${displayOctave(state, n)}, string ${s.number}, ${f === 0 ? 'open' : `fret ${f}`}, ${INTERVAL_NAMES[intervalFrom(n.pitch, state.root)]}${highlighted ? ', selected tone' : ', outside selected notes'}${member ? `, inside ${shape.type}` : ''}${extension ? ', added scale tone' : ''}${!inFocus ? ', outside focus' : ''}`;
    return `<div class="position-cell ${f === 0 ? 'open-cell' : ''} ${inFocus && state.focus ? 'region-cell' : ''}"><button class="note ${highlighted ? 'highlighted' : 'context-note'} ${highlighted && root ? 'root-note' : ''} ${member ? 'shape-member' : shape && highlighted ? 'outside-shape' : ''} ${extension ? 'extension-note' : ''} ${!inFocus ? 'outside-focus' : ''} ${marked ? 'marked-note' : ''} ${!highlighted && !state.context && !marked ? 'concealed-note' : ''} ${state.labels === 'both' ? 'both-labels' : ''}" data-action="position" data-id="${n.id}" data-key="position-${n.id}" tabindex="${n.id === lastFocusedPosition ? '0' : '-1'}" aria-label="${desc}" ${pressed(marked)} title="${desc}"><span>${label}</span>${state.labels === 'both' ? `<small>${interval}</small>` : ''}</button></div>`;
  }).join('')}</div>`).join('')}</div></div>`;
}

function countMatches() {
  return STRINGS.reduce((count, s) => count + Array.from({ length: state.frets + 1 }, (_, f) => position(s.number, f)).filter(n => state.notes.includes(n.pitch) && isInFocus(n, state)).length, 0);
}
function toggle(list, item) { return list.includes(item) ? list.filter(i => i !== item) : [...list, item]; }

app.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'toggle-view') { viewOpen = !viewOpen; render(); return; }
  if (action === 'toggle-focus') { focusOpen = !focusOpen; viewOpen = false; render(); return; }
  if (action === 'focus-clear') { state.focus = false; state.strings = [1, 2, 3, 4, 5, 6]; }
  if (action === 'overlay') { state.overlay = button.dataset.value; state.shapeIndex = preferredShapeIndex(state); }
  if (action === 'shape-step') state.shapeIndex = Math.max(0, Math.min(shapesFor(state).length - 1, state.shapeIndex + Number(button.dataset.direction)));
  if (action === 'help') { helpOpen = true; document.querySelector('#help-dialog').showModal(); return; }
  if (action === 'close-help') { helpOpen = false; document.querySelector('#help-dialog').close(); return; }
  if (action === 'pitch') state.notes = toggle(state.notes, Number(button.dataset.pitch)).sort((a, b) => a - b);
  if (action === 'all') state.notes = SHARPS.map((_, i) => i);
  if (action === 'naturals') state.notes = [...NATURALS];
  if (action === 'none') state.notes = [];
  if (['pitch', 'all', 'naturals', 'none'].includes(action)) { state.scale = 'custom'; state.overlay = 'none'; state.shapeIndex = 0; }
  if (action === 'string') state.strings = toggle(state.strings, Number(button.dataset.string));
  if (action === 'strings-all') state.strings = [1, 2, 3, 4, 5, 6];
  if (action === 'labels') state.labels = button.dataset.value;
  if (action === 'position') {
    state.inspected = button.dataset.id;
    lastFocusedPosition = button.dataset.id;
    state.marks = toggle(state.marks, button.dataset.id);
  }
  if (action === 'remove-mark') state.marks = state.marks.filter(id => id !== button.dataset.id);
  if (action === 'clear-marks') state.marks = [];
  if (action === 'shift') Object.assign(state, moveRegion(state.from, state.to, Number(button.dataset.direction), state.frets));
  state.shapeIndex = Math.min(state.shapeIndex, Math.max(0, shapesFor(state).length - 1));
  // Reset the view leaves deliberately marked fingerings intact.
  if (action === 'reset') { viewOpen = false; focusOpen = false; const marks = state.marks; state = { ...defaultState(), marks }; lastFocusedPosition = '1:0'; }
  save(); render({ scrollToNut: action === 'reset', scrollToShape: ['reset', 'overlay', 'shape-step'].includes(action) });
});

app.addEventListener('change', event => {
  const el = event.target;
  if (el.id === 'scale') {
    state.scale = scaleById(el.value).id;
    if (state.scale !== 'custom') state.notes = scalePitches(state.scale, state.root);
    if (!scaleById(state.scale).skeleton) state.overlay = 'none';
    state.shapeIndex = preferredShapeIndex(state);
  } else if (['root', 'frets', 'from', 'to'].includes(el.id)) {
    if (el.value === '' || !Number.isFinite(Number(el.value))) { render(); return; }
    const value = Math.trunc(Number(el.value));
    if (el.id === 'from') state.from = Math.max(0, Math.min(state.to, value));
    else if (el.id === 'to') state.to = Math.max(state.from, Math.min(state.frets, value));
    else state[el.id] = value;
    if (el.id === 'root' && state.scale !== 'custom') { state.notes = scalePitches(state.scale, state.root); state.shapeIndex = preferredShapeIndex(state); }
    if (el.id === 'frets') {
      state.from = Math.min(state.from, state.frets);
      state.to = Math.min(state.to, state.frets);
      const [s, f] = lastFocusedPosition.split(':').map(Number);
      lastFocusedPosition = `${s}:${Math.min(f, state.frets)}`;
    }
  } else if (['focus', 'context', 'leftHanded', 'stringNames'].includes(el.id)) state[el.id] = el.checked;
  else if (el.id === 'spelling') state.spelling = el.value;
  else return;
  state.shapeIndex = Math.min(state.shapeIndex, Math.max(0, shapesFor(state).length - 1));
  save(); render({ scrollToNut: el.id === 'leftHanded', scrollToShape: ['root', 'scale', 'leftHanded', 'frets'].includes(el.id) });
});

document.addEventListener('click', event => {
  if (viewOpen && !event.target.closest('.view-menu')) { viewOpen = false; render(); }
});

app.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (viewOpen || focusOpen) && !helpOpen) {
    const key = viewOpen ? 'toggle-view' : 'toggle-focus';
    viewOpen = false; focusOpen = false; render();
    document.querySelector(`[data-key="${key}"]`)?.focus();
    return;
  }
  const target = event.target.closest('[data-action="position"]');
  if (!target || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  let [s, f] = target.dataset.id.split(':').map(Number);
  if (event.key === 'ArrowUp') s = Math.max(1, s - 1);
  if (event.key === 'ArrowDown') s = Math.min(6, s + 1);
  if (event.key === 'ArrowLeft') f += state.leftHanded ? 1 : -1;
  if (event.key === 'ArrowRight') f += state.leftHanded ? -1 : 1;
  if (event.key === 'Home') f = state.leftHanded ? state.frets : 0;
  if (event.key === 'End') f = state.leftHanded ? 0 : state.frets;
  f = Math.max(0, Math.min(state.frets, f));
  lastFocusedPosition = `${s}:${f}`;
  target.tabIndex = -1;
  const next = document.querySelector(`[data-id="${lastFocusedPosition}"][data-action="position"]`);
  next.tabIndex = 0;
  next.focus({ preventScroll: true });
  next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
render({ scrollToNut: true, scrollToShape: true });
