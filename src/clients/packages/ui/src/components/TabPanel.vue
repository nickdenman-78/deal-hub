<script setup lang="ts">
import { Tabs } from '@vuetify/v0/components';

defineProps<{
  /** Matches the Tab of the same value. */
  value: string | number;
}>();
</script>

<template>
  <Tabs.Panel class="r-tabpanel" :value="value">
    <slot />
  </Tabs.Panel>
</template>

<style>
.r-tabpanel {
  min-height: 0;
  flex: 1;
  padding-top: var(--sp-4);
}

/*
 * Same trap as Accordion: consumers often set `display: flex` on the panel so
 * a filled child can stretch. That beats the UA `[hidden] { display: none }`
 * when it lacks `!important`, and both panels stack as if tabs did nothing.
 */
.r-tabpanel[hidden] {
  display: none;
}

.r-tabs--vertical .r-tabpanel {
  padding-top: 0;
  padding-left: var(--sp-4);
}
</style>
