/**
 * Whether the browser already holds a Clerk session, read from cookies without loading Clerk.
 *
 * clerk-js writes `__client_uat` ("updated at": the time of the last sign-in change, or 0 when signed out) and a copy
 * suffixed with `_` and the first 8 characters of the URL-safe base64 SHA-1 of the publishable key. Production instances
 * get the unsuffixed one from Clerk's Frontend API instead. Both are readable from script. The suffix would need an
 * asynchronous hash, and a hint that is wrong in either direction is cheap (a stale one loads Clerk for nothing; a
 * missing one leaves the Sign in button, which loads Clerk, finds the session and signs in), so any cookie of that
 * family with a positive value counts.
 */
export function hasClerkSession(cookies: string): boolean {
  return cookies.split(';').some(entry => {
    const [name, ...value] = entry.trim().split('=');
    return (name === '__client_uat' || name.startsWith('__client_uat_')) && Number.parseInt(value.join('='), 10) > 0;
  });
}
