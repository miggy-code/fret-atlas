import { useState } from 'react';
import type { State } from '../core/state';

/** Copies a link to the current view, or shows it for manual copying when the clipboard is unavailable. */
export function useShare(state: State, notify: (message: string) => void) {
  const [manualLink, setManualLink] = useState('');
  async function share() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('atlas', JSON.stringify(state));
    try {
      await navigator.clipboard.writeText(url.toString());
      notify('View link copied');
      setManualLink('');
    } catch {
      setManualLink(url.toString());
      notify('Select and copy your view link');
    }
  }
  return { share, manualLink };
}
