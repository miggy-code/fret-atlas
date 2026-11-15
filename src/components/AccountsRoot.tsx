import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { App } from './App';
import { AccountApp } from './AccountApp';
import { AccountMenu } from './AccountMenu';
import type { Auth, BridgeProps } from './ClerkBridge';
import { hasClerkSession } from '../core/clerk-session';
import { deviceEdits, readDevice } from '../core/device-copy';
import type { DeviceCopy } from '../core/device-copy';
import type { Edit } from '../core/sync-edit';

/**
 * Chooses between the device-only app and the account app. Clerk is not loaded here: it comes in only when the
 * browser already has a Clerk session, or when the visitor presses Sign in.
 *
 * The board is usable from the first paint. If a signed-in visitor starts using it before Clerk has answered,
 * what they changed on the device is carried over to the account when it loads (see `deviceEdits`) rather than
 * leaving that visitor in a tab that never syncs.
 */
export function AccountsRoot({ publishableKey }: { publishableKey: string }) {
  const [sessionHint] = useState(() => hasClerkSession(document.cookie));
  const [wanted, setWanted] = useState(sessionHint);
  const [Bridge, setBridge] = useState<ComponentType<BridgeProps> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [signIns, setSignIns] = useState(0);
  const [userSlot, setUserSlot] = useState<HTMLElement | null>(null);
  const [carried, setCarried] = useState<Edit>();
  const before = useRef<DeviceCopy | null>(null);
  const signedIn = useRef(false);

  // Read after the app's first effects have normalised what it saved, so only later changes count as edits.
  useEffect(() => { before.current = readDevice(localStorage); }, []);
  useEffect(() => {
    if (!wanted || Bridge) return;
    let active = true;
    import('./ClerkBridge').then(module => { if (active) setBridge(() => module.ClerkBridge); }, () => { if (active) { setWanted(false); setLoadFailed(true); } });
    return () => { active = false; };
  }, [wanted, Bridge]);

  const onAuth = useCallback((next: Auth) => {
    if (next.userId && !signedIn.current) setCarried(before.current ? deviceEdits(before.current, readDevice(localStorage)) : undefined);
    if (!next.userId && signedIn.current) before.current = readDevice(localStorage);
    signedIn.current = !!next.userId;
    setAuth(next);
  }, []);
  const signIn = () => { setLoadFailed(false); setWanted(true); setSignIns(count => count + 1); };

  const state = auth?.userId ? 'signed-in' : sessionHint && !auth?.isLoaded ? 'loading' : 'signed-out';
  const menu = <AccountMenu state={state} busy={wanted && !auth?.isLoaded} failed={loadFailed} onSignIn={signIn} slot={setUserSlot} />;
  return <>
    {auth?.userId
      ? <AccountApp key={auth.userId} userId={auth.userId} getToken={auth.getToken} accountMenu={menu} deviceEdits={carried} />
      : <App accountMenu={menu} />}
    {Bridge && <Bridge publishableKey={publishableKey} onAuth={onAuth} slot={state === 'signed-in' ? userSlot : null} signIns={signIns} />}
  </>;
}
