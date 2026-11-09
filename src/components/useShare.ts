import { useState } from 'react';
import { shareUrl } from '../core/state';
import type { State } from '../core/state';

/** Copies a link to the current view, or shows it for manual copying when the clipboard is unavailable. */
export function useShare(state: State, notify: (message: string) => void) {
  const [manualLink, setManualLink] = useState('');
  async function share() {
    const link = shareUrl(window.location.href, state);
    try {
      await navigator.clipboard.writeText(link);
      notify('View link copied');
      setManualLink('');
    } catch {
      setManualLink(link);
      notify('Select and copy your view link');
    }
  }
  return { share, manualLink };
}
