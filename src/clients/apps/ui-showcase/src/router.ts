import { bladeScrollBehavior } from '@ets/ui';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { allLeaves } from './nav';

/*
 * Nested layout routes: BlankLayout for the hub/landing, DefaultLayout for the
 * product shell. App.vue only mounts hosts + a root RouterView — which chrome
 * wraps a page is decided here (ATS ADR-0014).
 *
 * Leaf routes come from nav.ts. Blade children stay hand-declared: the registry
 * only knows the pattern shell.
 */
function toChildPath(absolutePath: string): string {
  return absolutePath.replace(/^\//, '');
}

const leafRoutes: RouteRecordRaw[] = allLeaves()
  // Blade stack path is replaced by the nested tree below.
  .filter((item) => item.path !== '/patterns/blade-stack')
  .map((item) => ({
    path: toChildPath(item.path),
    name: item.path,
    component: item.load,
    meta: { title: item.title, flush: item.flush === true },
  }));

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('./layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        name: 'hub',
        component: () => import('./views/HubView.vue'),
        meta: { title: 'ETS UI' },
      },
    ],
  },
  {
    path: '/',
    component: () => import('./layouts/DefaultLayout.vue'),
    children: [
      ...leafRoutes,
      {
        path: 'patterns/blade-stack',
        component: () => import('./views/BladesView.vue'),
        meta: { title: 'Blade stack', flush: true },
        children: [
          {
            path: '',
            component: () => import('./views/blades/DealsBlade.vue'),
            meta: { blade: true },
            children: [
              {
                // Static path before `:id` so “api” is not captured as a deal id.
                path: 'api',
                component: () => import('./views/blades/BladeApiBlade.vue'),
                meta: { blade: true },
              },
              {
                path: ':id',
                component: () => import('./views/blades/DealBlade.vue'),
                meta: { blade: true },
                children: [
                  {
                    path: 'terms',
                    component: () => import('./views/blades/LeafBlade.vue'),
                    props: { title: 'Terms' },
                    meta: { blade: true },
                  },
                  {
                    // Depth 2 — the third panel — and it fails on purpose. The two
                    // blades to its left must keep working.
                    path: 'settlement',
                    component: () => import('./views/blades/FailingBlade.vue'),
                    meta: { blade: true },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  // Moving between blades must not scroll the page back to the top: the strip
  // has not gone anywhere and only one panel in it changed.
  scrollBehavior: bladeScrollBehavior(),
});
