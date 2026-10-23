<script setup lang="ts">
import { Tabs } from '@vuetify/v0/components';
import Icon from './Icon.vue';

defineProps<{
  /** Matches the TabPanel of the same value. */
  value: string | number;
  disabled?: boolean;
  icon?: string;
}>();
</script>

<template>
  <Tabs.Item class="r-tab" :value="value" :disabled="disabled">
    <Icon v-if="icon" :name="icon" :size="14" />
    <slot />
  </Tabs.Item>
</template>

<style>
.r-tab {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 0;
  /* Transparent rather than absent, so selecting a tab does not change its
       height and shove the panel below down by 2px. */
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--fg-muted);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  white-space: nowrap;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}

.r-tab:hover:not([disabled]) {
  color: var(--fg-primary);
}

/* v0 marks the selected tab with aria-selected, which is the same fact the
     styling needs — no parallel `is-active` class to keep in step. */
.r-tab[aria-selected='true'] {
  border-bottom-color: var(--accent-bar);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-tab[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-tabs--vertical .r-tab {
  justify-content: flex-start;
  border-right: 2px solid transparent;
  border-bottom: 0;
}

.r-tabs--vertical .r-tab[aria-selected='true'] {
  border-right-color: var(--accent-bar);
  border-bottom-color: transparent;
}
</style>
