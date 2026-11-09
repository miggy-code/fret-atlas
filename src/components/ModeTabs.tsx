import { Icon } from './controls';

export type Tab = 'explore' | 'practice';

/** Explore and Practice share the study controls and the board; only the deck below the board changes. */
export function ModeTabs({ tab, onChoose }: { tab: Tab; onChoose: (tab: Tab) => void }) {
  return <div className="mode-tabs" role="tablist" aria-label="Mode">{(['explore', 'practice'] as const).map(value =>
    <button key={value} id={`${value}-tab`} type="button" role="tab" aria-selected={tab === value} aria-controls="deck" onClick={() => onChoose(value)}>
      {value === 'explore' ? 'Explore' : <><Icon name="target" />Practice</>}
    </button>)}
  </div>;
}
