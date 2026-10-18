<script setup lang="ts">
/**
 * Tab set root. Owns which tab is selected and provides context to TabList /
 * Tab / TabPanel.
 *
 * Compound rather than an `items` array, matching PrimeVue's shape — the
 * panels in config-admin hold whole editors, and an array API would force all
 * of that through a slot keyed by index.
 *
 * Bind with `v-model` (modelValue), not `v-model:value` — the latter is the
 * PrimeVue Tabs habit and silently leaves this root unbound, so deep-links
 * that seed the active tab never take and the parent ref never tracks clicks.
 *
 * `activation="manual"` by default. With automatic activation, arrowing along
 * the tab strip selects as it goes, which on these screens means mounting a
 * Monaco editor per keypress. Manual means arrows move focus and Enter/Space
 * commits.
 *
 * Note that v0 keeps every panel MOUNTED and hides the inactive ones with the
 * `hidden` attribute, rather than unmounting them. That is what you want here
 * — an editor keeps its undo history and scroll position across a tab switch —
 * but it does mean a panel's `onMounted` runs once, not on every visit, and
 * that a hidden panel's content is still in the DOM for anything walking it.
 */
import { computed } from 'vue';
import { Tabs } from '@vuetify/v0/components';

const props = withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical';
    activation?: 'automatic' | 'manual';
    /** Prevents deselecting the last tab. On by default — a tab set with nothing selected shows nothing. */
    mandatory?: boolean;
    /** Arrow keys wrap from last to first. */
    circular?: boolean;
  }>(),
  { orientation: 'horizontal', activation: 'manual', mandatory: true, circular: true },
);

const model = defineModel<string | number | undefined>();

/*
 * v0's selection can still emit `undefined` when the active tab is clicked
 * again, even with `mandatory`. Workbench blades bind the model to a path
 * segment (`…/workbench/${tab}`), so that clear becomes `/undefined` and the
 * route falls off the `:tab(files|configuration)` match. Swallow clears here
 * when mandatory so consumers never see an empty selection.
 */
const selected = computed({
  get: () => model.value,
  set: (value) => {
    if (props.mandatory && (value === undefined || value === null)) return;
    model.value = value;
  },
});
</script>

<template>
  <!-- The wrapper div is not decoration. Tabs.Root renders a FRAGMENT (list
       plus panels, no element of its own), so a class on it is dropped with an
       "extraneous non-props attributes" warning and every layout rule here
       silently fails to apply — including the vertical variant. -->
  <div class="r-tabs" :class="`r-tabs--${orientation}`">
    <Tabs.Root
      v-model="selected"
      :orientation="orientation"
      :activation="activation"
      :mandatory="mandatory"
      :circular="circular"
    >
      <slot />
    </Tabs.Root>
  </div>
</template>

<style>
.r-tabs {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.r-tabs--vertical {
  flex-direction: row;
}
</style>
