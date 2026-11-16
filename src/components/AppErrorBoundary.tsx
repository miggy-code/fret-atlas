import { Component } from 'react';
import type { ReactNode } from 'react';
import { defaultState, shareUrl } from '../core/state';

/**
 * The last line of defence: one bad value must not leave a blank page. Recovery does not go through the broken view:
 * it reloads with the default view's link. That replaces the saved view once the app starts, so the message says so
 * and nothing is replaced until the person chooses it.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="app-error" role="alert">
      <h1>Something went wrong showing the board</h1>
      <p>Try again, or start from the default view. Opening the default view replaces the view saved on this device; practice progress, theme and sound are kept.</p>
      <div className="app-error-actions">
        <button className="text-button primary" onClick={() => window.location.assign(shareUrl(window.location.href, defaultState()))}>Open the default view</button>
        <button className="text-button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    </main>;
  }
}
