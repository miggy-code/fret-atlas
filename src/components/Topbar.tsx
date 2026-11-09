import type { ReactNode, RefObject } from 'react';
import logo from '../../favicon.svg';
import { Icon } from './controls';

interface TopbarProps {
  accountMenu?: ReactNode;
  onShare: () => void;
  onGuide: () => void;
  onSettings: () => void;
  // Dialogs return focus to the button that opened them.
  guideButton: RefObject<HTMLButtonElement | null>;
  settingsButton: RefObject<HTMLButtonElement | null>;
}

export function Topbar({ accountMenu, onShare, onGuide, onSettings, guideButton, settingsButton }: TopbarProps) {
  return <div className="topbar">
    <div className="wordmark"><img src={logo} alt="" /><span className="wordmark-name">Fretory</span></div>
    <div className="header-actions">
      {accountMenu}
      {/* On narrow screens only the icons show; the labels stay as the accessible names. */}
      <button className="text-button header-action" aria-label="Share view" onClick={onShare}><Icon name="link" /><span>Share</span></button>
      <button ref={guideButton} className="text-button header-action" aria-label="Guide" onClick={onGuide}><Icon name="help" /><span>Guide</span></button>
      <button ref={settingsButton} className="text-button header-action" aria-label="Settings" onClick={onSettings}><Icon name="settings" /><span>Settings</span></button>
    </div>
  </div>;
}
