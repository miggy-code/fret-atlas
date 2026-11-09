import { Show, SignInButton, UserButton } from '@clerk/react';

/** Clerk's sign-in and account controls. They sit apart so accounts can be loaded on their own. */
export function AccountMenu() {
  return <>
    <Show when="signed-out">
      <SignInButton mode="modal"><button className="text-button">Sign in</button></SignInButton>
    </Show>
    <Show when="signed-in"><div className="account-button"><UserButton /></div></Show>
  </>;
}
