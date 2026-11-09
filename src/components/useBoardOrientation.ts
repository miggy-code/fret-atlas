import { useSyncExternalStore } from 'react';
import type { Orientation } from '../core/geometry';

// Portrait phones are tall and narrow, so the neck runs down the screen. Tablets, landscape phones and desktops
// keep it horizontal. This is presentation only: it is not part of the saved or shared view, so one link
// reads correctly on a phone and on a laptop.
const PORTRAIT_PHONE = '(max-width: 600px) and (orientation: portrait)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT_PHONE);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

export function useBoardOrientation(): Orientation {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PORTRAIT_PHONE).matches ? 'vertical' : 'horizontal', () => 'horizontal');
}
