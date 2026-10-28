import { useId } from 'react';
import type { ReactNode } from 'react';

type IconName = 'settings' | 'link' | 'focus' | 'close' | 'help' | 'shift' | 'undo' | 'flame' | 'play' | 'stop' | 'target';
export function Icon({ name }: { name: IconName }) {
  const paths = {
    shift: <path d="M3 17 21 7m-7-1 7 1-3 6" />,
    settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" /><circle cx="15" cy="17" r="3" /></>,
    link: <path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0M13 8l1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" />,
    focus: <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01" /></>,
    undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
    flame: <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1.2-3.6 2.2-4.6.2 1.6 1 2.6 2 3 0-3 .3-5.6.8-8.4Z" />,
    play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
    stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export interface SegmentOption<T extends string> { value: T; label: ReactNode; disabled?: boolean; hint?: string }
export function Segments<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: SegmentOption<T>[]; onChange: (value: T) => void }) {
  return <div className="segmented" role="group" aria-label={label}>
    {options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className={value === option.value ? 'active' : ''} disabled={option.disabled} title={option.hint} onClick={() => onChange(option.value)}>{option.label}</button>)}
  </div>;
}

export function Toggle({ label, checked, disabled, onChange, hint }: { label: string; checked: boolean; disabled?: boolean; onChange: () => void; hint?: string }) {
  const hintId = useId();
  return <label className="toggle" title={hint}>
    <input type="checkbox" aria-label={label} aria-describedby={hint ? hintId : undefined} checked={checked} disabled={disabled} onChange={onChange} />
    <span>{label}</span>
    {hint && <small id={hintId} className="toggle-hint">{hint}</small>}
  </label>;
}

export function RestoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="restore-button" aria-label={`Restore ${label} defaults`} onClick={onClick}><Icon name="undo" />Restore defaults</button>;
}

/** A collapsible settings panel that shows when it differs from its defaults and can restore them. */
export function ControlModule({ title, summary, modified, onRestore, className = '', children }: { title: string; summary: string; modified: boolean; onRestore: () => void; className?: string; children: ReactNode }) {
  return <details className="control-module">
    <summary>{title}<span>{summary}</span>{modified && <em className="modified-badge">Changed</em>}</summary>
    <div className={`control-body ${className}`}>
      {children}
      {modified && <div className="module-footer"><RestoreButton label={title} onClick={onRestore} /></div>}
    </div>
  </details>;
}
