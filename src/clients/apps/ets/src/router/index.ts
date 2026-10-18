import { bladeScrollBehavior } from '@ets/ui';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import { authGuard } from '@/auth/authGuard';
import { routes } from './routes';

export function createEtsRouter(): Router {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: bladeScrollBehavior(),
  });
  router.beforeEach(authGuard);
  return router;
}
