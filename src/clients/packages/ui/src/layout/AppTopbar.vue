<script setup lang="ts">
/**
 * Optional top chrome for AppLayout: start / center / end regions.
 *
 * Three columns keep `#center` optically centred in the topbar regardless of
 * how wide start / end grow (equal `1fr` side tracks). On narrow viewports a
 * menu control is prepended in `#start` so the Drawer-hosted sidebar can open.
 * Callers still own title, tools, and profile placement.
 */
import { inject } from 'vue';
import Button from '../components/Button.vue';
import { appLayoutKey } from './context';

const layout = inject(appLayoutKey, null);
</script>

<template>
  <header class="r-app-topbar">
    <div class="r-app-topbar__start">
      <Button
        v-if="layout?.sidebar.value && layout.isNarrow.value"
        class="r-app-topbar__menu"
        variant="text"
        size="sm"
        icon="menu"
        aria-label="Open navigation"
        @click="layout?.openNav()"
      />
      <slot name="start" />
    </div>
    <div v-if="$slots.center" class="r-app-topbar__center">
      <slot name="center" />
    </div>
    <div v-if="$slots.end" class="r-app-topbar__end">
      <slot name="end" />
    </div>
  </header>
</template>
