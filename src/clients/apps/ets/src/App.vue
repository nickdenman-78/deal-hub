<script setup lang="ts">
import {
  AppLayout,
  AppNavItem,
  AppSidebar,
  AppSidebarBrand,
  AppTopbar,
  Button,
  ConfirmHost,
  ThemeToggle,
  ToastHost,
} from '@ets/ui';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { signOut } from '@/auth/oidc';
import { useSessionStore } from '@/stores/session';

const SIDEBAR_COLLAPSED_KEY = 'ets.sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

const collapsed = ref(readCollapsed());
watch(collapsed, (value) => {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // Best-effort; collapse still works for the session.
  }
});

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const { me } = storeToRefs(session);

// Public routes (callback, errors) render without the shell chrome.
const bare = computed(() => route.meta.public === true);

const navItems = computed(() =>
  router
    .getRoutes()
    .filter((r) => r.meta.nav && (!r.meta.permission || session.can(r.meta.permission)))
    .map((r) => ({ path: r.path, ...r.meta.nav! })),
);

function isActive(path: string): boolean {
  return path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`);
}
</script>

<template>
  <RouterView v-if="bare" />
  <div v-else class="ets-shell">
    <AppLayout v-model:collapsed="collapsed" chrome="both" nav-title="ETS">
      <template #sidebar>
        <AppSidebar>
          <template #brand>
            <AppSidebarBrand to="/" label="ETS — home" />
          </template>
          <template #nav>
            <AppNavItem
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              :icon="item.icon"
              :label="item.label"
              :active="isActive(item.path)"
            />
          </template>
          <template #footer>
            <ThemeToggle />
          </template>
        </AppSidebar>
      </template>

      <template #topbar>
        <AppTopbar>
          <template #end>
            <span v-if="me" class="ets-user">{{ me.name }}</span>
            <Button variant="text" icon="log-out" @click="signOut()">Sign out</Button>
          </template>
        </AppTopbar>
      </template>

      <RouterView />
    </AppLayout>

    <ToastHost />
    <ConfirmHost />
  </div>
</template>

<style scoped>
/* AppLayout is height: 100%, which needs a parent with a definite height. */
.ets-shell {
  height: 100dvh;
}

.ets-user {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.ets-shell :deep(.r-app-layout__main) {
  padding: var(--sp-4);
}
</style>
