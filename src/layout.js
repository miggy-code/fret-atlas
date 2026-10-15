import { STRINGS, SHARPS, INTERVALS, INTERVAL_NAMES, noteName, intervalFrom, position, isInFocus } from './music.js';
import { SCALES, scaleById, shapesFor, activeShape, insideShape, displayNote, displayOctave } from './scales.js';

export function layout(state, { icon, renderBoard, countMatches, focusOpen, viewOpen }) {
  const name = p => displayNote(state, p);
  const pressed = v => `aria-pressed="${Boolean(v)}"`;
  const checked = v => v ? 'checked' : '';
  const narrowed = state.focus || state.strings.length !== 6;
  const labels = [['none', 'Dots'], ['notes', 'Notes'], ['intervals', 'Intervals'], ['both', 'Both']];
  const scale = scaleById(state.scale);
  const shape = activeShape(state);
  const shapes = shapesFor(state);
  const added = scale.skeleton ? scale.intervals.length - scale.skeleton.length : 0;
  return `
    <header class="site-header">
      <a class="brand" href="./" aria-label="Fret Atlas home"><span class="brand-symbol">${icon('grid')}</span>fret<span class="brand-light">atlas</span></a>
      <span class="header-caption">Guitar study space</span>
      <button class="text-button help-button" data-action="help" data-key="help">${icon('info')}<span>Guide</span></button>
    </header>
    <main class="workspace">
      <div class="workspace-heading">
        <div class="page-title"><h1>Fretboard studio<span class="title-dot">.</span></h1><span class="tuning-label">Standard tuning <span>${state.stringNames ? 'E A D G B E' : 'Six strings. One connected map.'}</span></span></div>
        <div class="board-toolbar">
          <div class="segmented" aria-label="Note label display">${labels.map(([value, label]) => `<button data-action="labels" data-value="${value}" data-key="labels-${value}" class="${state.labels === value ? 'active' : ''}" ${pressed(state.labels === value)}>${label}</button>`).join('')}</div>
          <span class="toolbar-divider"></span>
          <button class="tool-button ${narrowed || focusOpen ? 'active' : ''}" data-action="toggle-focus" data-key="toggle-focus" aria-expanded="${focusOpen}" aria-controls="focus-panel">${icon('focus')}<span>Focus</span>${narrowed ? '<i class="active-dot"></i>' : ''}</button>
          <div class="view-menu">
            <button class="tool-button ${viewOpen ? 'active' : ''}" data-action="toggle-view" data-key="toggle-view" aria-expanded="${viewOpen}" aria-controls="view-panel">${icon('settings')}<span>Display</span></button>
            <div class="view-panel" id="view-panel" ${viewOpen ? '' : 'hidden'}>
              <div class="panel-title">Display</div>
              <div class="setting-row"><label for="frets">Frets</label><select id="frets" data-key="frets">${[12, 15, 24].map(n => `<option value="${n}" ${state.frets === n ? 'selected' : ''}>${n} frets</option>`).join('')}</select></div>
              <div class="setting-row"><label for="spelling">Accidentals</label><select id="spelling" data-key="spelling"><option value="sharps" ${state.spelling === 'sharps' ? 'selected' : ''}>Sharps ♯</option><option value="flats" ${state.spelling === 'flats' ? 'selected' : ''}>Flats ♭</option></select></div>
              <label class="switch-row" for="context"><span>Show other notes</span><input type="checkbox" id="context" data-key="context" ${checked(state.context)}><span class="switch" aria-hidden="true"></span></label>
              <label class="switch-row" for="stringNames"><span>String names & numbers</span><input type="checkbox" id="stringNames" data-key="stringNames" ${checked(state.stringNames)}><span class="switch" aria-hidden="true"></span></label>
              <label class="switch-row" for="leftHanded"><span>Left-handed view</span><input type="checkbox" id="leftHanded" data-key="leftHanded" ${checked(state.leftHanded)}><span class="switch" aria-hidden="true"></span></label>
              <button class="reset-button" data-action="reset" data-key="reset">${icon('reset')}Reset view</button>
            </div>
          </div>
        </div>
      </div>
      <section class="study-strip" aria-label="Scale and shape selection">
        <div class="tonality-controls"><div class="key-field"><label for="root">${state.scale === 'custom' ? 'Reference' : 'Key'}</label><select id="root" data-key="root">${SHARPS.map((_, pitch) => `<option value="${pitch}" ${state.root === pitch ? 'selected' : ''}>${noteName(pitch, state.spelling)}</option>`).join('')}</select></div><div class="scale-field"><label for="scale">Study</label><select id="scale" data-key="scale">${SCALES.map(s => `<option value="${s.id}" ${state.scale === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div></div>
        <div class="shape-controls"><span class="control-label">Shape overlay</span><div class="shape-options" aria-label="Pentatonic shape overlay">${[['none', 'Full map'], ['rectangle', 'Rectangle'], ['stack', 'Stack']].map(([value, label]) => `<button data-action="overlay" data-value="${value}" data-key="overlay-${value}" class="${state.overlay === value ? 'active' : ''} ${value}" ${pressed(state.overlay === value)} ${value !== 'none' && !scale.skeleton ? 'disabled title="Choose a scale with a pentatonic skeleton to use shape overlays"' : ''}>${value === 'none' ? '<i class="map-symbol" aria-hidden="true">···</i>' : `<i class="shape-symbol ${value}" aria-hidden="true"></i>`}${label}</button>`).join('')}</div></div>
      </section>
      <section class="focus-panel" id="focus-panel" aria-label="Focus controls" ${focusOpen ? '' : 'hidden'}>
        <div class="range-controls"><label class="switch-row" for="focus"><input type="checkbox" id="focus" data-key="focus" ${checked(state.focus)}><span class="switch" aria-hidden="true"></span><span>Fret range</span></label><div class="region-inputs"><label class="sr-only" for="from">From fret</label><input type="number" id="from" data-key="from" value="${state.from}" min="0" max="${state.to}" ${state.focus ? '' : 'disabled'}><span>to</span><label class="sr-only" for="to">To fret</label><input type="number" id="to" data-key="to" value="${state.to}" min="${state.from}" max="${state.frets}" ${state.focus ? '' : 'disabled'}></div></div>
        <div class="string-controls"><span>Strings</span><div class="string-palette" aria-label="Strings to include">${[...STRINGS].reverse().map(s => `<button class="string-button ${state.strings.includes(s.number) ? 'selected' : ''}" data-action="string" data-string="${s.number}" data-key="string-${s.number}" ${pressed(state.strings.includes(s.number))} aria-label="Include string ${s.number}, ${s.name}${s.octave}">${s.name}<small>${s.number}</small></button>`).join('')}</div><button class="small-link" data-action="strings-all" data-key="strings-all">All</button></div>
        <button class="small-link focus-clear" data-action="focus-clear" data-key="focus-clear">Reset focus</button>
      </section>
      <section class="explorer" aria-label="Interactive guitar fretboard">
        <div class="board-caption"><div class="map-title"><span class="map-title-key">${name(state.root)}</span><span>${scale.name}<small>${state.leftHanded ? 'Nut right' : 'Nut left'} · High strings above · ${state.frets} frets</small></span></div><span class="scope-label">${state.focus ? `Frets ${state.from}–${state.to}` : 'Whole neck'}${state.strings.length < 6 ? ` · ${state.strings.length} strings` : ''}${state.focus ? `<button class="icon-button previous" data-action="shift" data-direction="-1" data-key="shift-left" aria-label="Move focus one fret lower" ${state.from === 0 ? 'disabled' : ''}>${icon('arrow')}</button><button class="icon-button" data-action="shift" data-direction="1" data-key="shift-right" aria-label="Move focus one fret higher" ${state.to === state.frets ? 'disabled' : ''}>${icon('arrow')}</button>` : ''}</span></div>
        <div class="board-scroll" tabindex="0" role="region" aria-label="Scrollable fretboard; use arrow keys to navigate once a note is focused">${renderBoard()}</div>
        ${state.overlay !== 'none' ? `<div class="shape-navigation ${state.overlay}"><div class="shape-summary"><i class="shape-symbol ${state.overlay}" aria-hidden="true"></i><strong>${state.overlay === 'rectangle' ? 'Rectangle' : 'Stack'}</strong><span>${shape ? `Strings ${shape.rows.at(-1).string}–${shape.rows[0].string} · Frets ${shape.from}–${shape.to}${shape.warped ? ' · G–B offset' : ''}` : 'No complete shape in this focus. Widen the fret range or include more strings.'}</span></div><div class="shape-stepper"><button class="icon-button previous" data-action="shape-step" data-direction="-1" data-key="shape-prev" aria-label="Previous shape" ${state.shapeIndex <= 0 || !shape ? 'disabled' : ''}>${icon('arrow')}</button><span aria-live="polite">${shape ? state.shapeIndex + 1 : 0} / ${shapes.length}</span><button class="icon-button" data-action="shape-step" data-direction="1" data-key="shape-next" aria-label="Next shape" ${state.shapeIndex >= shapes.length - 1 || !shape ? 'disabled' : ''}>${icon('arrow')}</button></div></div>` : ''}
        <div class="board-footer"><div class="legend"><span><i class="legend-dot root"></i>Root</span><span><i class="legend-dot highlighted"></i>${scale.skeleton ? 'Pentatonic tone' : 'Selected tone'}</span>${added ? '<span><i class="legend-dot extension"></i>Added scale tone</span>' : ''}${state.marks.length ? '<span><i class="legend-dot marked"></i>Marked</span>' : ''}</div><div class="position-inspector" aria-live="polite">${inspector(state, name)}</div></div>
      </section>
      <section class="note-controls" aria-label="Note selection">
        <div class="palette-section">
          <div class="palette-heading"><span>${state.scale === 'custom' ? 'Custom notes' : 'Scale tones'} <small class="match-count" aria-live="polite">${countMatches()} matches</small></span><div class="quick-actions"><span class="custom-hint">Click to customize</span><button data-action="all" data-key="all">All</button><button data-action="naturals" data-key="naturals">Naturals</button><button data-action="none" data-key="none">Clear</button></div></div>
          <div class="note-palette" aria-label="Notes to highlight">${SHARPS.map((_, pitch) => `<button class="pitch-button ${state.notes.includes(pitch) ? 'selected' : ''}" data-action="pitch" data-pitch="${pitch}" data-key="pitch-${pitch}" ${pressed(state.notes.includes(pitch))} aria-label="Highlight ${name(pitch)}, ${INTERVAL_NAMES[intervalFrom(pitch, state.root)]} from ${name(state.root)}"><span>${name(pitch)}</span><small>${INTERVALS[intervalFrom(pitch, state.root)]}</small></button>`).join('')}</div>
        </div>
      </section>
      ${marks(state, name, icon)}
      <footer class="page-footer"><span><kbd>↑ ↓ ← →</kbd> navigate <span class="footer-divider">·</span> <kbd>enter</kbd> mark a note</span><span>Saved on this device</span></footer>
    </main>
    <dialog id="help-dialog"><div class="dialog-header"><h2>Read the relationships.</h2><button class="icon-button" data-action="close-help" aria-label="Close guide">${icon('close')}</button></div><ol><li><strong>Choose a key and scale.</strong> Changing the key transposes a named scale. Clicking the note palette switches to Custom notes; changing its reference root only updates intervals.</li><li><strong>Add a shape.</strong> Rectangles connect two minor-third pairs; stacks connect three whole-tone pairs. Both use the scale's pentatonic skeleton. The outline steps one fret across the G–B tuning break. Arrows move between complete shapes on this neck.</li><li><strong>Read without labels.</strong> Dots hides note text. Roots have a center dot, pentatonic tones are solid, and added scale tones are hollow. The outline identifies shape membership; selected scale tones outside it stay quieter. Toggle string indicators in Display.</li><li><strong>Focus or mark.</strong> Focus limits strings and frets; only complete shapes appear. Click any position to mark it. Marks are independent and survive root changes and Reset view.</li></ol><p><strong>Keyboard:</strong> Tab into the board, arrows navigate, Enter or Space marks. Every position keeps an accessible pitch label and a hover tooltip, even in Dots mode.</p><p class="help-footnote">High strings are above, open notes outside the nut. Equal fret spacing is a diagram, not a physical scale drawing. TT means tritone. This independent study tool draws its own geometry; it is not affiliated with Fret Science.</p><button class="button primary" data-action="close-help">Got it</button></dialog>
  `;
}

function inspector(state, name) {
  if (!state.inspected) return '<span class="inspector-hint">Click a note to mark a position</span>';
  const [s, f] = state.inspected.split(':').map(Number);
  const n = position(s, f);
  const int = intervalFrom(n.pitch, state.root);
  const shape = activeShape(state);
  return `<strong>${name(n.pitch)}<small>${displayOctave(state, n)}</small></strong><span>String ${s}</span><span>${f === 0 ? 'Open' : `Fret ${f}`}</span><span title="${INTERVAL_NAMES[int]}">${INTERVALS[int]} from ${name(state.root)}</span>${insideShape(n, shape) && state.notes.includes(n.pitch) ? `<span class="inspector-membership ${shape.type}">In ${shape.type}</span>` : ''}`;
}

function marks(state, name, icon) {
  if (!state.marks.length) return '';
  return `<section class="marks-section" aria-label="Marked positions"><div class="marks-heading"><span>${icon('pin')} ${state.marks.length} marked</span><button class="small-link" data-action="clear-marks" data-key="clear-marks">Clear marks</button></div><div class="marks-list">${state.marks.map(id => {
    const [s, f] = id.split(':').map(Number);
    const n = position(s, f);
    return `<button class="mark-chip" data-action="remove-mark" data-id="${id}" data-key="mark-${id}" aria-label="Remove ${name(n.pitch)}${displayOctave(state, n)}, string ${s}, fret ${f}"><strong>${name(n.pitch)}<small>${displayOctave(state, n)}</small></strong><span>S${s} · ${f === 0 ? 'open' : `F${f}`}${f > state.frets ? ' · off-screen' : !isInFocus(n, state) ? ' · outside focus' : ''}</span>${icon('close')}</button>`;
  }).join('')}</div></section>`;
}
