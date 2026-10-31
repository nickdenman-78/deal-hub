import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts';

/*
 * Keycloak sign-in (ADR-0006): authorization code + PKCE against the public
 * "ets-web" client. The SPA only ever holds the access token to call the API;
 * it never decodes it for authorization — permissions come from GET /api/me.
 *
 * sessionStorage rather than localStorage: a closed tab should not leave a
 * usable token behind on a shared trading-floor machine.
 */
const origin = window.location.origin;

export const userManager = new UserManager({
  authority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'https://localhost:8080/realms/ets',
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'ets-web',
  scope: import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  redirect_uri: `${origin}/auth/callback`,
  post_logout_redirect_uri: `${origin}/`,
  response_type: 'code',
  // Keycloak issues refresh tokens to public clients, so renewal uses the
  // refresh-token grant rather than a hidden iframe.
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
});

/** The signed-in user, or null when absent or expired. */
export async function currentUser(): Promise<User | null> {
  const user = await userManager.getUser();
  return user && !user.expired ? user : null;
}

/** Starts the Keycloak redirect. `returnTo` is restored after the callback. */
export function signIn(returnTo: string = window.location.pathname + window.location.search): Promise<void> {
  return userManager.signinRedirect({ state: { returnTo } });
}

/** Completes the redirect and returns the in-app path to land on. */
export async function completeSignIn(): Promise<string> {
  const user = await userManager.signinRedirectCallback();
  const state = user.state as { returnTo?: string } | undefined;
  const returnTo = state?.returnTo;
  // Only ever an in-app path — never an absolute URL from the query string.
  return returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';
}

export function signOut(): Promise<void> {
  return userManager.signoutRedirect();
}

export async function accessToken(): Promise<string | null> {
  return (await currentUser())?.access_token ?? null;
}
