import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ClerkProvider, useAuth, useClerk, UserButton } from '@clerk/react';

export interface Auth { isLoaded: boolean; userId: string | null; getToken: () => Promise<string | null> }
export interface BridgeProps {
  publishableKey: string;
  onAuth: (auth: Auth) => void;
  /** Where to place Clerk's user menu, once signed in. */
  slot: HTMLElement | null;
  /** Counts clicks on Sign in; each one opens Clerk's sign-in as soon as Clerk is ready. */
  signIns: number;
}

/**
 * Everything that needs Clerk, in one chunk that is fetched only when a visitor has a session or asks to sign in.
 * It renders nothing of its own except the user menu, placed into the top bar by a portal, so the app never remounts.
 */
export function ClerkBridge({ publishableKey, ...props }: BridgeProps) {
  return <ClerkProvider publishableKey={publishableKey}><Bridge {...props} /></ClerkProvider>;
}

function Bridge({ onAuth, slot, signIns }: Omit<BridgeProps, 'publishableKey'>) {
  const { isLoaded, userId, getToken } = useAuth();
  const clerk = useClerk();
  const opened = useRef(0);
  useEffect(() => { onAuth({ isLoaded, userId: userId ?? null, getToken }); }, [isLoaded, userId]);
  useEffect(() => {
    if (!isLoaded || userId || signIns === opened.current) return;
    opened.current = signIns;
    clerk.openSignIn();
  }, [isLoaded, userId, signIns]);
  return userId && slot ? createPortal(<UserButton />, slot) : null;
}
