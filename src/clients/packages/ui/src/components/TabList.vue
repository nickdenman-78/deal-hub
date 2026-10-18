<script setup lang="ts">
import { Tabs } from '@vuetify/v0/components';

defineProps<{
  /** Names the tab strip for assistive tech. Required by ARIA on a tablist. */
  label: string;
}>();
</script>

<template>
  <Tabs.List class="r-tablist" :label="label">
    <slot />
  </Tabs.List>
</template>

<style>
.r-tablist {
  display: flex;
  flex: none;
  gap: var(--sp-1);
  /* The rule the active tab's underline sits on, so the strip reads as a
       single edge rather than a row of loose buttons. */
  border-bottom: 1px solid var(--border-default);
}

.r-tabs--vertical .r-tablist {
  flex-direction: column;
  border-right: 1px solid var(--border-default);
  border-bottom: 0;
}
</style>
