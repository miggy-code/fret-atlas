import { useEffect, useState } from 'react';
import { pitchName, SHARPS } from '../core/music';
import type { Spelling } from '../core/music';
import { FORMS, levelOf, practicedForms, practicedTotal, record, restoreProgress } from '../core/progress';
import type { Family, Level, Progress } from '../core/progress';

const PROGRESS_KEY = 'fret-atlas-progress';

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => { try { return restoreProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')); } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch { /* Progress is optional. */ } }, [progress]);
  return {
    progress,
    mark: (family: Family, root: number, form: number, level: Level) => setProgress(p => record(p, family, root, form, level)),
    clear: () => setProgress({}),
  };
}

/** Five segments, one per form: hollow when untouched, light when seen, full when practiced. */
export function FormRing({ progress, family, root }: { progress: Progress; family: Family; root: number }) {
  return <svg className="form-ring" viewBox="-18 -18 36 36" aria-hidden="true">
    {FORMS.map((form, i) => <circle key={form} r="14" pathLength="5" strokeDasharray=".84 4.16" strokeDashoffset={-i - .08} transform="rotate(-90)"
      className={`ring-segment level-${levelOf(progress, family, root, form)}`} />)}
  </svg>;
}

export function ProgressPanel({ progress, family, root, spelling, onKey, onClear }: { progress: Progress; family: Family; root: number; spelling: Spelling; onKey: (root: number) => void; onClear: () => void }) {
  const total = practicedTotal(progress, family);
  return <div className="progress-panel">
    <p className="progress-intro">A form counts as practiced when you play it through or finish a drill in it, in Position view. Pick a key to study it.</p>
    <div className="key-grid" role="group" aria-label={`${family === 'minor' ? 'Minor' : 'Major'} keys`}>
      {SHARPS.map((_, key) => {
        const done = practicedForms(progress, family, key);
        return <button key={key} type="button" className={`key-cell ${done === 5 ? 'is-complete' : ''}`} aria-pressed={key === root} aria-label={`${pitchName(key, spelling)} ${family}: ${done} of 5 forms practiced`} onClick={() => onKey(key)}>
          <FormRing progress={progress} family={family} root={key} />
          <strong>{pitchName(key, spelling)}</strong>
          <span>{done}/5</span>
        </button>;
      })}
    </div>
    <div className="progress-footer">
      <span>{total} of 60 {family} forms practiced</span>
      {Object.keys(progress).length > 0 && <button type="button" className="text-button" onClick={() => { if (window.confirm('Clear all progress on this device?')) onClear(); }}>Clear progress</button>}
    </div>
  </div>;
}
