import type { ComputedRef, InjectionKey, Ref } from 'vue';

/** Which outer chrome bands AppLayout renders. */
export type AppLayoutChrome = 'both' | 'topbar' | 'sidebar';

/**
 * What AppSidebar / AppTopbar / AppNavItem need from AppLayout.
 *
 * Collapse, narrow breakpoint and the mobile nav drawer are package-owned
 * facts — left in each app they fork silently. Profile, brand copy and IA stay
 * in slots on the caller.
 */
export interface AppLayoutContext {
  collapsed: ComputedRef<boolean>;
  setCollapsed: (value: boolean) => void;
  toggleCollapsed: () => void;
  isNarrow: ComputedRef<boolean>;
  /** Whether AppLayout is rendering a topbar row. */
  topbar: ComputedRef<boolean>;
  /** Whether AppLayout is rendering a sidebar (aside or narrow Drawer). */
  sidebar: ComputedRef<boolean>;
  chrome: ComputedRef<AppLayoutChrome>;
  navOpen: Ref<boolean>;
  openNav: () => void;
  closeNav: () => void;
}

export const appLayoutKey = Symbol('ets.appLayout') as InjectionKey<AppLayoutContext>;
