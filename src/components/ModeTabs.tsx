import { Icon } from './controls';

export type Tab = 'explore' | 'practice' | 'songs';

/** The tabs share the board; only the deck below it changes. Explore and Practice share the study controls; a song sets its own view. */
export function ModeTabs({ tab, onChoose }: { tab: Tab; onChoose: (tab: Tab) => void }) {
  return <div className="mode-tabs" role="tablist" aria-label="Mode">{(['explore', 'practice', 'songs'] as const).map(value =>
    <button key={value} id={`${value}-tab`} type="button" role="tab" aria-selected={tab === value} aria-controls="deck" onClick={() => onChoose(value)}>
      {value === 'explore' ? 'Explore' : value === 'practice' ? <><Icon name="target" />Practice</> : 'Songs'}
    </button>)}
  </div>;
}
