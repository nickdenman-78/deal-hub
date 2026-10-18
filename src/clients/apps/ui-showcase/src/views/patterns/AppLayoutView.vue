<script setup lang="ts">
/*
 * App chrome pattern: AppLayout + AppSidebar + AppTopbar + AppNavItem.
 * Chrome modes: both / topbar-only / sidebar-only. Optional #submenu for
 * context-specific secondary nav above the main scrollport. Profile / theme
 * placement is slot-owned. Narrow viewports open the sidebar in a Drawer.
 */
import {
  AppLayout,
  AppNavItem,
  AppSidebar,
  AppSidebarBrand,
  AppTopbar,
  Avatar,
  Menu,
  ThemeToggle,
  type AppLayoutChrome,
  type MenuItem,
} from '@ets/ui';
import { computed, ref, watch } from 'vue';
import CodeExample from '../../components/CodeExample.vue';
import PropsTable from '../../components/PropsTable.vue';
import { appLayoutExample } from '../../apiExamples';
import { appLayoutProps, appNavItemProps, appSidebarBrandProps, appSidebarSlots, appTopbarSlots } from '../../apiDocs';

type ChromePlacement = 'sidebar' | 'topbar';

const collapsed = ref(false);
const chrome = ref<AppLayoutChrome>('both');
const showSubmenu = ref(true);
const placement = ref<ChromePlacement>('sidebar');
const active = ref('inbox');
const section = ref('overview');

watch(chrome, (mode) => {
  if (mode === 'topbar') placement.value = 'topbar';
  if (mode === 'sidebar') placement.value = 'sidebar';
});

const menuItems: MenuItem[] = [
  { label: 'Profile', icon: 'user', action: () => undefined },
  { label: 'Sign out', icon: 'log-out', action: () => undefined, destructive: true },
];

const note = computed(() => {
  const bits = [
    `chrome=${chrome.value}`,
    chrome.value !== 'topbar' ? (collapsed.value ? 'rail' : 'expanded') : null,
    showSubmenu.value ? 'submenu' : null,
    `chrome in ${placement.value}`,
  ].filter(Boolean);
  return bits.join(' · ');
});

const canCollapse = computed(() => chrome.value !== 'topbar');
const canPlaceInSidebar = computed(() => chrome.value !== 'topbar');
const canPlaceInTopbar = computed(() => chrome.value !== 'sidebar');
</script>

<template>
  <div class="app-layout-demo">
    <header class="app-layout-demo__intro">
      <div>
        <h2 class="app-layout-demo__title">App layout</h2>
        <p class="app-layout-demo__note">
          Outer product chrome from <code>@ets/ui</code>: choose topbar + sidebar, topbar only, or sidebar only.
          Optional <code>#submenu</code> holds context-specific secondary nav above the scrollable main. Profile, theme
          and settings are composed into slots. Narrow screens move the sidebar into a start Drawer.
        </p>
      </div>

      <div class="app-layout-demo__controls" role="group" aria-label="Demo options">
        <label class="app-layout-demo__check">
          <input v-model="chrome" type="radio" value="both" />
          Topbar + sidebar
        </label>
        <label class="app-layout-demo__check">
          <input v-model="chrome" type="radio" value="topbar" />
          Topbar only
        </label>
        <label class="app-layout-demo__check">
          <input v-model="chrome" type="radio" value="sidebar" />
          Sidebar only
        </label>
        <label v-if="canCollapse" class="app-layout-demo__check">
          <input v-model="collapsed" type="checkbox" />
          Collapsed rail
        </label>
        <label class="app-layout-demo__check">
          <input v-model="showSubmenu" type="checkbox" />
          Submenu
        </label>
        <label v-if="canPlaceInSidebar" class="app-layout-demo__check">
          <input v-model="placement" type="radio" value="sidebar" />
          Chrome in sidebar footer
        </label>
        <label v-if="canPlaceInTopbar" class="app-layout-demo__check">
          <input v-model="placement" type="radio" value="topbar" />
          Chrome in topbar end
        </label>
      </div>
    </header>

    <div class="app-layout-demo__frame" :data-note="note">
      <AppLayout v-model:collapsed="collapsed" :chrome="chrome" nav-title="Demo navigation">
        <template v-if="chrome !== 'topbar'" #sidebar>
          <AppSidebar>
            <template #brand>
              <AppSidebarBrand to="/" />
            </template>
            <template #nav>
              <AppNavItem icon="inbox" label="Inbox" :active="active === 'inbox'" @click="active = 'inbox'" />
              <AppNavItem icon="folder" label="Projects" :active="active === 'projects'" @click="active = 'projects'" />
              <AppNavItem
                icon="settings"
                label="Settings"
                :active="active === 'settings'"
                @click="active = 'settings'"
              />
            </template>
            <template v-if="placement === 'sidebar'" #footer>
              <div class="app-layout-demo__chrome" :class="{ 'app-layout-demo__chrome--rail': collapsed }">
                <ThemeToggle />
                <Menu :items="menuItems" trigger-label="Account menu" trigger-class="app-layout-demo__avatar-trigger">
                  <Avatar name="Alex Operator" size="sm" />
                </Menu>
              </div>
            </template>
          </AppSidebar>
        </template>

        <template v-if="chrome !== 'sidebar'" #topbar>
          <AppTopbar>
            <template #start>
              <strong class="app-layout-demo__page">{{ active }}</strong>
            </template>
            <template v-if="placement === 'topbar'" #end>
              <ThemeToggle />
              <Menu :items="menuItems" trigger-label="Account menu" trigger-class="app-layout-demo__avatar-trigger">
                <Avatar name="Alex Operator" size="sm" />
              </Menu>
            </template>
          </AppTopbar>
        </template>

        <template v-if="showSubmenu" #submenu>
          <nav class="app-layout-demo__submenu" aria-label="Section">
            <button
              type="button"
              class="app-layout-demo__sublink"
              :class="{ 'is-active': section === 'overview' }"
              @click="section = 'overview'"
            >
              Overview
            </button>
            <button
              type="button"
              class="app-layout-demo__sublink"
              :class="{ 'is-active': section === 'members' }"
              @click="section = 'members'"
            >
              Members
            </button>
            <button
              type="button"
              class="app-layout-demo__sublink"
              :class="{ 'is-active': section === 'activity' }"
              @click="section = 'activity'"
            >
              Activity
            </button>
          </nav>
        </template>

        <div class="app-layout-demo__main">
          <h3>Main · {{ active }}{{ showSubmenu ? ` / ${section}` : '' }}</h3>
          <p>
            Only this region scrolls. Topbar, sidebar and submenu stay put. Toggle the chrome mode above, or shrink the
            viewport below 768px when a sidebar is present.
          </p>
          <p v-for="n in 24" :key="n" class="app-layout-demo__line">Scroll filler line {{ n }}.</p>
        </div>
      </AppLayout>
    </div>

    <div class="app-layout-demo__docs">
      <CodeExample :code="appLayoutExample" />
      <PropsTable :rows="appLayoutProps" title="AppLayout" />
      <PropsTable :rows="appSidebarSlots" title="AppSidebar" note="Region slots; collapse control is built in." />
      <PropsTable :rows="appSidebarBrandProps" title="AppSidebarBrand" />
      <PropsTable :rows="appTopbarSlots" title="AppTopbar" />
      <PropsTable :rows="appNavItemProps" title="AppNavItem" />
    </div>
  </div>
</template>

<style scoped>
.app-layout-demo {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--sp-4);
  height: 100%;
  min-height: 0;
  padding: var(--sp-4);
  overflow: auto;
}

.app-layout-demo__intro {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: var(--sp-4);
  justify-content: space-between;
}

.app-layout-demo__title {
  margin: 0 0 var(--sp-1);
}

.app-layout-demo__note {
  max-width: 62ch;
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.app-layout-demo__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  align-content: flex-start;
}

.app-layout-demo__check {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-sm);
  white-space: nowrap;
}

.app-layout-demo__frame {
  flex: none;
  height: min(32rem, 70vh);
  min-height: 22rem;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-canvas);
}

.app-layout-demo__chrome {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.app-layout-demo__chrome--rail {
  flex-direction: column;
}

.app-layout-demo__page {
  font-size: var(--fs-sm);
  text-transform: capitalize;
}

.app-layout-demo__submenu {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.app-layout-demo__sublink {
  padding: var(--sp-1) var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-muted);
  font: inherit;
  font-size: var(--fs-sm);
  cursor: pointer;
}

.app-layout-demo__sublink:hover {
  background: var(--bg-surface-2);
  color: var(--fg-default);
}

.app-layout-demo__sublink.is-active {
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.app-layout-demo__main {
  padding: var(--sp-5);
}

.app-layout-demo__main h3 {
  margin: 0 0 var(--sp-2);
}

.app-layout-demo__main p {
  max-width: 56ch;
  margin: 0 0 var(--sp-3);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.app-layout-demo__line {
  margin: 0 0 var(--sp-2) !important;
}

.app-layout-demo__docs {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: var(--sp-4);
}

:deep(.app-layout-demo__avatar-trigger) {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
</style>
