import type { RefObject } from 'react';
import { Icon } from './controls';

export function GuideDialog({ dialog, onClose }: { dialog: RefObject<HTMLDialogElement | null>; onClose: () => void }) {
  const close = () => dialog.current?.close();
  return <dialog ref={dialog} className="guide-dialog" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="guide-content">
      <div className="dialog-heading"><h2>Read the relationships.</h2><button className="icon-button" aria-label="Close guide" onClick={close}><Icon name="close" /></button></div>
      <dl>
        <dt>Study one form at a time.</dt>
        <dd>Rectangles connect two rows of notes three frets apart. Stacks connect three rows of notes two frets apart. Use Position for a complete playing position, Shape for a single rectangle or stack, Diagonal for a chain of the same shape, and Whole neck to see every pattern at once. The arrows and the 1–5 picker step through the forms on this neck.</dd>
        <dt>Read the whole neck.</dt>
        <dd>Whole neck includes the partial shapes cut off by the nut and the last fret. In Position and Whole neck, show only rectangles or only stacks with the switch above the board. Hover or focus a note to highlight the shapes it belongs to. Shared red and blue edges show both colors.</dd>
        <dt>Follow a diagonal.</dt>
        <dd>A diagonal repeats one shape across the strings. Hollow notes are continuation tones: the next scale note beyond each block, where the run leads.</dd>
        <dt>Choose how much of the neck to see.</dt>
        <dd>Whole map adds the other scale notes quietly behind your current form. Connect positions, in the form bar, outlines the neighboring positions in violet. Skeleton connects root notes across the neck. Pentatonic only hides added scale tones. The Focus panel limits strings and frets. Pattern strings hides whole patterns that touch an excluded string.</dd>
        <dt>Warp across the G–B boundary.</dt>
        <dd>The thin line between G and B, marked +1, is the tuning break: shapes shift one fret toward the bridge when they cross it. Diagonal joins already account for the shift; turning Warp off hides the guide without changing notes.</dd>
        <dt>Highlight a triad independently.</dt>
        <dd>Pick a root and quality in the Chord row below the board, then Show tones. Green rings show the chord tones across the neck, including tones outside the current scale. Hide tones returns to the underlying note map.</dd>
        <dt>Return to defaults.</dt>
        <dd>A panel marked Changed has settings that differ from the defaults; Restore defaults inside it resets only that panel. Reset view in Settings restores every panel at once. Key, scale and marked notes always stay.</dd>
        <dt>Mark and navigate.</dt>
        <dd>Click or press Enter to mark a note. Tab into the board; arrow keys move across strings and frets, Home goes to the nut and End to the final fret.</dd>
      </dl>
      <p className="guide-footnote">At the outer strings, short extensions show where a pattern continues. Your view and marked positions are saved on this device. Use Share to copy a link to the current setup.</p>
    </div>
  </dialog>;
}
