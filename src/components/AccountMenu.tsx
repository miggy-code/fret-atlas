/**
 * The top bar's account control. It holds no Clerk code, so the page never loads Clerk just to draw it:
 * a signed-out visitor gets a plain button, and a signed-in one gets an empty slot that Clerk's user menu is placed into.
 */
export function AccountMenu({ state, busy, failed, onSignIn, slot }: {
  state: 'signed-out' | 'loading' | 'signed-in';
  /** Sign-in is loading after a click. */
  busy: boolean;
  failed: boolean;
  onSignIn: () => void;
  slot: (element: HTMLDivElement | null) => void;
}) {
  if (state === 'signed-out') {
    return <button className="text-button" aria-busy={busy} title={failed ? 'Sign-in could not be loaded. Check your connection and try again.' : undefined} onClick={onSignIn}>{failed ? 'Retry sign in' : 'Sign in'}</button>;
  }
  // While Clerk is checking an existing session the slot stays empty, rather than offering Sign in to someone who is signed in.
  return <div className="account-button" ref={slot} />;
}
