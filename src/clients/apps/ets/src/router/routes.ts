import type { RouteRecordRaw } from 'vue-router';
import { DealsPermissions } from '@/lib/permissions';

declare module 'vue-router' {
  interface RouteMeta {
    /** Reachable without signing in (the OIDC callback, error pages). */
    public?: boolean;
    /** Hides the route from callers without it. UX only — the API enforces. */
    permission?: string;
    /** Sidebar entry. Routes without one are reachable but not listed. */
    nav?: { label: string; icon: string };
  }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { nav: { label: 'Home', icon: 'house' } },
  },
  {
    path: '/deals',
    name: 'deals',
    component: () => import('@/modules/deals/DealsView.vue'),
    meta: { permission: DealsPermissions.Read, nav: { label: 'Deals', icon: 'file-text' } },
  },
  {
    // Ungated until the Settlement module publishes its permission catalogue.
    path: '/settlement',
    name: 'settlement',
    component: () => import('@/modules/settlement/SettlementView.vue'),
    meta: { nav: { label: 'Settlement', icon: 'receipt' } },
  },
  {
    // Ungated until the Risk module publishes its permission catalogue.
    path: '/risk',
    name: 'risk',
    component: () => import('@/modules/risk/RiskView.vue'),
    meta: { nav: { label: 'Risk', icon: 'trending-up' } },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/views/AuthCallbackView.vue'),
    meta: { public: true },
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { public: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { public: true },
  },
];
