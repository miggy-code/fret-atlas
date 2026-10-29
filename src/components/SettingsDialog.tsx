import type { ReactNode, RefObject } from 'react';
import { Icon } from './controls';

/** Device and instrument settings: chosen once, so they live outside the Explore and Practice tabs. */
export function SettingsDialog({ dialog, onClose, children }: { dialog: RefObject<HTMLDialogElement | null>; onClose: () => void; children: ReactNode }) {
  const close = () => dialog.current?.close();
  return <dialog ref={dialog} className="guide-dialog settings-dialog" aria-labelledby="settings-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="guide-content">
      <div className="dialog-heading"><h2 id="settings-title">Settings</h2><button className="icon-button" aria-label="Close settings" onClick={close}><Icon name="close" /></button></div>
      {children}
    </div>
  </dialog>;
}
