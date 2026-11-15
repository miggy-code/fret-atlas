import { useLayoutEffect, useState } from 'react';
import { ChoiceDialog } from './ChoiceDialog';
import { PROGRESS_KEY } from '../core/device-copy';
import { pitchName, SHARPS } from '../core/music';
import type { Spelling } from '../core/music';
import { FORMS, levelOf, practicedForms, practicedTotal, record, restoreProgress } from '../core/progress';
import type { Family, Level, Progress } from '../core/progress';

export function useProgress(account?: { initial: Progress; onChange: (progress: Progress) => void; onClear: () => void }) {
  const [progress, setProgress] = useState<Progress>(() => { if (account) return account.initial; try { return restoreProgress(JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}')); } catch { return {}; } });
  useLayoutEffect(() => { if (account) { account.onChange(progress); return; } try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch { /* Progress is optional. */ } }, [progress]);
  return {
    progress,
    mark: (family: Family, root: number, form: number, level: Level) => setProgress(p => record(p, family, root, form, level)),
    clear: () => { account?.onClear(); setProgress({}); },
    /** Takes progress from the account, which already holds everything this tab recorded. */
    restore: (next: Progress) => setProgress(next),
  };
}

/** Five segments, one per form: hollow when untouched, light when seen, full when practiced. */
export function FormRing({ progress, family, root }: { progress: Progress; family: Family; root: number }) {
  return <svg className="form-ring" viewBox="-18 -18 36 36" aria-hidden="true">
    {FORMS.map((form, i) => <circle key={form} r="14" pathLength="5" strokeDasharray=".84 4.16" strokeDashoffset={-i - .08} transform="rotate(-90)"
      className={`ring-segment level-${levelOf(progress, family, root, form)}`} />)}
  </svg>;
}

export function ProgressPanel({ progress, family, root, spelling, onKey, onClear, synced }: { progress: Progress; family: Family; root: number; spelling: Spelling; onKey: (root: number) => void; onClear: () => void; synced?: boolean }) {
  const total = practicedTotal(progress, family);
  const [asking, setAsking] = useState(false);
  const everywhere = synced ? 'on every device signed in to this account' : 'on this device';
  return <div className="progress-panel">
    <p className="progress-intro">Choose a key below to study it and see its form progress. A form counts as practiced when you play it through or finish an unassisted drill in Position view.</p>
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
      {Object.keys(progress).length > 0 && <button type="button" className="text-button" onClick={() => setAsking(true)}>Clear progress</button>}
    </div>
    <ChoiceDialog open={asking} title="Clear all progress?" body={`This removes every practiced form ${everywhere}. It can’t be undone.`} note="You can close this to keep your progress."
      choices={[
        { label: 'Keep progress', detail: 'Nothing changes.', onChoose: () => setAsking(false) },
        { label: 'Clear progress', detail: `Removes all practice history ${everywhere}.`, onChoose: () => { setAsking(false); onClear(); } },
      ]}
      onClose={() => setAsking(false)} />
  </div>;
}
