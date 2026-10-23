<script setup lang="ts">
/**
 * Sidebar chrome regions for AppLayout: brand, primary nav, footer.
 *
 * The collapse control lives here (not on the layout) so it sits with the
 * rail it resizes. On narrow viewports the layout hosts this inside a Drawer
 * and collapse is irrelevant — labels stay visible.
 */
import { computed, inject } from 'vue';
import Button from '../components/Button.vue';
import { appLayoutKey } from './context';

const layout = inject(appLayoutKey, null);

const collapsed = computed(() => Boolean(layout?.collapsed.value && !layout?.isNarrow.value));
const showCollapse = computed(() => Boolean(layout && !layout.isNarrow.value));

function toggle() {
  layout?.toggleCollapsed();
}
</script>

<template>
  <div class="r-app-sidebar" :class="{ 'r-app-sidebar--collapsed': collapsed }">
    <div v-if="$slots.brand" class="r-app-sidebar__brand">
      <slot name="brand" />
    </div>

    <nav class="r-app-sidebar__nav" aria-label="Primary">
      <slot name="nav" />
    </nav>

    <div v-if="$slots.footer || showCollapse" class="r-app-sidebar__footer">
      <slot name="footer" />
      <Button
        v-if="showCollapse"
        class="r-app-sidebar__collapse"
        variant="text"
        size="sm"
        :icon="collapsed ? 'chevrons-right' : 'chevrons-left'"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        @click="toggle"
      />
    </div>
  </div>
</template>
