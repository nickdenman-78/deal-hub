import type { NavigationGuard } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import { currentUser, signIn } from './oidc';

/*
 * Every route requires sign-in unless it opts out with `meta.public`. A
 * missing user triggers the Keycloak redirect straight away — ETS has no
 * anonymous landing page to show first.
 *
 * `meta.permission` hides a screen the caller cannot use. That is UX only:
 * the API enforces every permission itself (ADR-0006).
 */
export const authGuard: NavigationGuard = async (to) => {
  if (to.meta.public) return true;

  if (!(await currentUser())) {
    await signIn(to.fullPath);
    return false;
  }

  const session = useSessionStore();
  await session.load();

  if (to.meta.permission && !session.can(to.meta.permission)) {
    return { name: 'forbidden' };
  }
  return true;
};
