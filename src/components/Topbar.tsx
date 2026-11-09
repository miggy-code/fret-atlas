import type { RefObject } from 'react';
import logo from '../../favicon.svg';
import { AccountMenu } from './AccountMenu';
import { Icon } from './controls';

interface TopbarProps {
  accountsEnabled: boolean;
  onShare: () => void;
  onGuide: () => void;
  onSettings: () => void;
  // Dialogs return focus to the button that opened them.
  guideButton: RefObject<HTMLButtonElement | null>;
  settingsButton: RefObject<HTMLButtonElement | null>;
}

export function Topbar({ accountsEnabled, onShare, onGuide, onSettings, guideButton, settingsButton }: TopbarProps) {
  return <div className="topbar">
    <div className="wordmark"><img src={logo} alt="" />Fretory</div>
    <div className="header-actions">
      {accountsEnabled && <AccountMenu />}
      <button className="text-button" aria-label="Share view" onClick={onShare}><Icon name="link" /><span>Share</span></button>
      <button ref={guideButton} className="text-button" onClick={onGuide}><Icon name="help" /><span>Guide</span></button>
      <button ref={settingsButton} className="text-button" onClick={onSettings}><Icon name="settings" /><span>Settings</span></button>
    </div>
  </div>;
}
