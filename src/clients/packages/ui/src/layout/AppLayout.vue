<script setup lang="ts">
/**
 * Outer product chrome: topbar and/or collapsible sidebar (rail), scrollable main,
 * optional submenu strip above the main scrollport.
 *
 * Owns grid geometry, collapse state, and the narrow → Drawer swap. Does not
 * own nav IA, brand copy, auth, or where profile / theme / settings live —
 * those go in AppSidebar / AppTopbar slots (or existing ThemeToggle / Avatar /
 * Menu dropped into them). Context-specific secondary nav goes in `#submenu`.
 *
 * Requires `@ets/ui/styles/layout.css`.
 */
import { computed, provide, ref, watch } from 'vue';
import Button from '../components/Button.vue';
import Drawer from '../components/Drawer.vue';
import { useIsMobile } from '../internal/useIsMobile';
import { appLayoutKey, type AppLayoutChrome, type AppLayoutContext } from './context';

const props = withDefaults(
  defineProps<{
    /**
     * Which chrome bands to render:
     * - `both` — topbar + sidebar (default)
     * - `topbar` — topbar only
     * - `sidebar` — sidebar only
     */
    chrome?: AppLayoutChrome;
    /** Accessible name for the mobile navigation drawer. */
    navTitle?: string;
  }>(),
  { chrome: 'both', navTitle: 'Navigate' },
);

const collapsed = defineModel<boolean>('collapsed', { default: false });

const isNarrow = useIsMobile();
const navOpen = ref(false);

const showTopbar = computed(() => props.chrome !== 'sidebar');
const showSidebar = computed(() => props.chrome !== 'topbar');

watch(isNarrow, (narrow) => {
  if (!narrow) navOpen.value = false;
});

watch(showSidebar, (sidebar) => {
  if (!sidebar) navOpen.value = false;
});

const ctx: AppLayoutContext = {
  collapsed: computed(() => collapsed.value),
  setCollapsed: (value) => {
    collapsed.value = value;
  },
  toggleCollapsed: () => {
    collapsed.value = !collapsed.value;
  },
  isNarrow,
  topbar: showTopbar,
  sidebar: showSidebar,
  chrome: computed(() => props.chrome),
  navOpen,
  openNav: () => {
    if (showSidebar.value) navOpen.value = true;
  },
  closeNav: () => {
    navOpen.value = false;
  },
};

provide(appLayoutKey, ctx);
</script>

<template>
  <div
    class="r-app-layout"
    :class="{
      'r-app-layout--collapsed': showSidebar && collapsed && !isNarrow,
      'r-app-layout--no-topbar': !showTopbar,
      'r-app-layout--no-sidebar': !showSidebar,
      'r-app-layout--narrow': isNarrow,
      'r-app-layout--has-submenu': Boolean($slots.submenu),
    }"
  >
    <aside v-if="showSidebar && !isNarrow" class="r-app-layout__sidebar">
      <slot name="sidebar" />
    </aside>

    <div class="r-app-layout__body">
      <div v-if="showTopbar" class="r-app-layout__topbar">
        <slot name="topbar" />
      </div>

      <!-- Floating menu when sidebar exists but there is no topbar to host it. -->
      <Button
        v-if="showSidebar && isNarrow && !showTopbar"
        class="r-app-layout__menu-fab"
        variant="outlined"
        size="sm"
        icon="menu"
        aria-label="Open navigation"
        @click="ctx.openNav()"
      />

      <div v-if="$slots.submenu" class="r-app-layout__submenu">
        <slot name="submenu" />
      </div>

      <main class="r-app-layout__main">
        <slot />
      </main>
    </div>

    <Drawer v-if="showSidebar && isNarrow" v-model:open="navOpen" :title="navTitle" side="start" size="sm">
      <slot name="sidebar" />
    </Drawer>
  </div>
</template>
