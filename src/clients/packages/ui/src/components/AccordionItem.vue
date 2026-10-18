<script setup lang="ts">
/**
 * One accordion panel. Must sit inside Accordion.
 *
 * Header goes in `#header`; the default slot is the panel body. ExpansionPanel
 * keeps every Content mounted and hides closed ones with `hidden` — same
 * contract as Tabs panels, so form state survives a collapse.
 */
import { ExpansionPanel } from '@vuetify/v0/components';
import Icon from './Icon.vue';

defineProps<{
  /** Matches Accordion v-model. */
  value: string | number;
  disabled?: boolean;
}>();

defineSlots<{
  header?: () => unknown;
  default?: () => unknown;
}>();
</script>

<template>
  <ExpansionPanel.Root class="r-accordion__item" :value="value" :disabled="disabled">
    <ExpansionPanel.Header class="r-accordion__header">
      <ExpansionPanel.Activator class="r-accordion__trigger">
        <ExpansionPanel.Cue class="r-accordion__cue">
          <Icon name="chevron-down" :size="14" />
        </ExpansionPanel.Cue>
        <span class="r-accordion__title"><slot name="header" /></span>
      </ExpansionPanel.Activator>
    </ExpansionPanel.Header>
    <ExpansionPanel.Content class="r-accordion__content">
      <slot />
    </ExpansionPanel.Content>
  </ExpansionPanel.Root>
</template>
