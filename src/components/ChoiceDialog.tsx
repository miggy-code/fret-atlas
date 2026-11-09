import { useEffect, useId, useRef } from 'react';

export interface Choice { label: string; detail: string; onChoose: () => void }

/**
 * A question with one button per outcome, each naming what it does. Closing it (Escape) answers nothing, so a
 * question that guards data must treat `onClose` as "no change". Focus goes to the heading, not a button, so a stray
 * Enter or Space while it appears cannot answer for the person; the browser returns focus to the opener on close.
 */
export function ChoiceDialog({ open, title, body, choices, note, onClose }: {
  open: boolean;
  title: string;
  body: string;
  choices: Choice[];
  note?: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) { if (element.open) element.close(); return; }
    if (element.open) return;
    element.showModal();
    heading.current?.focus();
  }, [open]);

  return <dialog ref={dialog} className="guide-dialog choice-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} onClose={onClose}>
    <div className="guide-content">
      <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>{title}</h2>
      <p id={`${id}-body`}>{body}</p>
      <div className="choice-options">
        {choices.map(choice => <button key={choice.label} type="button" className="choice-option" onClick={choice.onChoose}><strong>{choice.label}</strong><span>{choice.detail}</span></button>)}
      </div>
      {note && <p className="choice-note">{note}</p>}
    </div>
  </dialog>;
}
