<script setup lang="ts">
import { Splitter } from '@vuetify/v0/components';

/*
 * Handle + Panel is always a fragment (even when the handle is v-if'd out), so
 * class / style from the caller would warn and drop. Park them on the panel.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /**
     * Starting size, as a percentage of the splitter.
     *
     * EVERY panel needs one. v0 registers a panel with no size as 0%, and a
     * panel at 0% is invisible — the layout looks like the splitter failed
     * rather than like a missing prop. The sizes across a splitter should add
     * up to 100.
     */
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    collapsible?: boolean;
    collapsedSize?: number;
    /** Renders the resize handle before this panel. Omit on the first one. */
    handle?: boolean;
    handleLabel?: string;
  }>(),
  { defaultSize: undefined, minSize: undefined, maxSize: undefined, collapsedSize: undefined, handleLabel: 'Resize' },
);

/*
 * Loud in dev, silent in production. This was worth a warning rather than a
 * default because there is no sensible default: a panel cannot know how many
 * siblings it has, so guessing a share would just move the surprise.
 *
 * config-admin hit exactly this after the PrimeVue migration — it kept passing
 * `size`, which is not a prop here, so both editor splitters registered every
 * panel at 0.
 */
if (import.meta.env.DEV && props.defaultSize === undefined) {
  console.warn(
    '[@ets/ui] <SplitterPanel> has no `defaultSize`, so it registers at 0% and will not be visible. ' +
      'Give every panel a size that adds up to 100 across the splitter.',
  );
}
</script>

<template>
  <!-- The handle belongs to the panel that follows it, so a consumer never has
       to remember to interleave handles between panels by hand. -->
  <Splitter.Handle v-if="handle" class="r-splitter-handle" :label="handleLabel" />

  <Splitter.Panel
    class="r-splitter-panel"
    v-bind="$attrs"
    :default-size="defaultSize"
    :min-size="minSize"
    :max-size="maxSize"
    :collapsible="collapsible"
    :collapsed-size="collapsedSize"
  >
    <slot />
  </Splitter.Panel>
</template>

<style>
.r-splitter-panel {
  /* Both minimums matter: without them a flex child refuses to shrink below
       its content, and dragging the handle past that point does nothing. */
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
</style>
