<script setup lang="ts">
/**
 * Product shell for specimen / editor / pattern routes: sidebar-only AppLayout,
 * rail sections, group mega-menus (search lives in the submenu, right-aligned),
 * persisted collapse. Mounted by the Default layout route so it stays alive
 * when navigating between those pages.
 */
import { AppLayout, AppNavItem, AppSidebar, AppSidebarBrand, ThemeToggle } from '@ets/ui';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import ShowcaseSubmenu from '../components/ShowcaseSubmenu.vue';
import { activeTopLevel, topLevels } from '../nav';

const SIDEBAR_COLLAPSED_KEY = 'ets-ui-showcase.sidebar-collapsed';

function readCollapsed(fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (raw === '1') return true;
    if (raw === '0') return false;
  } catch {
    // Private mode or storage disabled — keep the session default.
  }
  return fallback;
}

const route = useRoute();
const collapsed = ref(readCollapsed(true));

watch(collapsed, (value) => {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // Best-effort; collapse still works for the session.
  }
});

const currentTop = computed(() => activeTopLevel(route.path));
/** Foundations has no leaves but still needs the strip for Search. */
const showSubmenu = computed(() => currentTop.value.id === 'foundations' || currentTop.value.leaves.length > 0);
const flushView = computed(() => route.meta.flush === true);
const title = computed(() => (route.meta.title as string | undefined) ?? 'ETS UI');
</script>

<template>
  <div class="sb">
    <AppLayout v-model:collapsed="collapsed" chrome="sidebar" nav-title="Showcase">
      <template #sidebar>
        <AppSidebar>
          <template #brand>
            <AppSidebarBrand to="/" label="ETS UI — home" />
          </template>
          <template #nav>
            <AppNavItem
              v-for="entry in topLevels"
              :key="entry.id"
              :to="entry.path"
              :icon="entry.icon"
              :label="entry.title"
              :exact="entry.path === '/'"
              :active="currentTop.id === entry.id"
            />
          </template>
          <template #footer>
            <div class="sb__footer-chrome" :class="{ 'sb__footer-chrome--rail': collapsed }">
              <ThemeToggle :labeled="!collapsed" show-resolved />
            </div>
          </template>
        </AppSidebar>
      </template>

      <template v-if="showSubmenu" #submenu>
        <ShowcaseSubmenu :section="currentTop" />
      </template>

      <!--
        Flex column so pattern pages (blade stack, list, app-layout) can fill
        the remaining viewport; overflow scrolls normal specimen pages.
      -->
      <div class="sb__view" :class="{ 'sb__view--flush': flushView }">
        <header v-if="!flushView" class="sb__page-head">
          <h1>{{ title }}</h1>
        </header>
        <RouterView />
      </div>
    </AppLayout>
  </div>
</template>
