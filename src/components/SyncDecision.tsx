import { useEffect, useRef, useState } from 'react';
import type { SyncConflict } from '../core/sync';

/** `import` is the first sign-in on a device that already holds data; the rest are conflicts found while syncing. */
export type Decision = 'import' | SyncConflict;
export interface Question { decision: Decision; resolve: (keepDevice: boolean) => void }

interface Copy { title: string; body: string; keep: { label: string; detail: string }; use: { label: string; detail: string }; waiting: string }
const COPY: Record<Decision, Copy> = {
  import: {
    title: 'Set up your account',
    body: 'This device already holds a view, settings and progress. Choose where your account starts. Either way, the copy on this device stays on this device.',
    keep: { label: 'Import this device’s data', detail: 'Your account starts from this device’s view, settings and progress.' },
    use: { label: 'Use the account without importing', detail: 'Your account starts from its own saved data, or from the defaults if it has none.' },
    waiting: 'Choose how to set up your account',
  },
  settings: {
    title: 'Your settings differ',
    body: 'Settings on this device changed while your account’s settings changed somewhere else. Choose which version to keep.',
    keep: { label: 'Keep this device’s settings', detail: 'Replaces the account’s settings, on every device.' },
    use: { label: 'Use account settings', detail: 'Drops this device’s unsynced settings changes.' },
    waiting: 'Sync is paused until you choose which settings to keep',
  },
  'progress-reset': {
    title: 'Progress was cleared elsewhere',
    body: 'Your account’s progress was cleared on another device, but this device has progress that has not synced.',
    keep: { label: 'Keep this device’s progress', detail: 'Adds this device’s progress back to your account.' },
    use: { label: 'Use account progress', detail: 'Drops this device’s unsynced progress and follows the clear.' },
    waiting: 'Sync is paused until you choose which progress to keep',
  },
};

/**
 * Asks which copy to keep. Closing the dialog (Escape) answers nothing: sync stays paused and the
 * reminder below reopens the question, so no data is ever discarded by dismissing it.
 */
export function SyncDecision({ question, onAnswer }: { question: Question; onAnswer: (keepDevice: boolean) => void }) {
  const copy = COPY[question.decision];
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reminder = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const element = dialog.current;
    if (!open || !element || element.open) return;
    opener.current ??= document.activeElement;
    element.showModal();
    // The heading, not a button, takes focus: a stray Enter or Space while this appears must not answer for the person.
    heading.current?.focus();
  }, [open]);
  // Answering removes the dialog, so focus goes back to where the person was before it appeared.
  useEffect(() => () => { if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus(); }, []);

  return <>
    <dialog ref={dialog} className="guide-dialog sync-decision" aria-labelledby="sync-decision-title" aria-describedby="sync-decision-body" onClose={() => { setOpen(false); reminder.current?.focus(); }}>
      <div className="guide-content">
        <h2 id="sync-decision-title" ref={heading} tabIndex={-1}>{copy.title}</h2>
        <p id="sync-decision-body">{copy.body}</p>
        <div className="decision-options">
          <button type="button" className="decision-option" onClick={() => onAnswer(true)}><strong>{copy.keep.label}</strong><span>{copy.keep.detail}</span></button>
          <button type="button" className="decision-option" onClick={() => onAnswer(false)}><strong>{copy.use.label}</strong><span>{copy.use.detail}</span></button>
        </div>
        <p className="decision-note">You can close this and decide later. Nothing is sent or discarded until you choose.</p>
      </div>
    </dialog>
    <div className="decision-reminder" role="status">
      <span>{copy.waiting}</span>
      <button ref={reminder} type="button" className="text-button" onClick={() => setOpen(true)}>Choose</button>
    </div>
  </>;
}
