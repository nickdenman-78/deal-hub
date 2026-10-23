<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdownToHtml } from '../markdown/render';

/*
 * Rendered markdown prose. The HTML is sanitised in renderMarkdownToHtml
 * against a strict allow-list — see that file; it is the security boundary, not
 * this component. Brand typography/colours come from the host editor skin.
 */
const props = withDefaults(
  defineProps<{
    source?: string | null;
    /**
     * Caps the block and scrolls inside it. Unset by default: a height limit is
     * a layout decision belonging to the surface that embeds the prose, and
     * config-admin's editor views want 9rem so a long description cannot push
     * the workspace tabs off screen. A standalone page wants no cap at all.
     */
    maxHeight?: string;
  }>(),
  { source: undefined, maxHeight: undefined },
);

const html = computed(() => renderMarkdownToHtml(props.source));
const hasContent = computed(() => html.value.length > 0);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitised in renderMarkdownToHtml -->
  <div
    v-if="hasContent"
    class="r-md-view"
    :style="maxHeight ? { '--r-md-view-max-height': maxHeight } : undefined"
    v-html="html"
  />
</template>

<style>
.r-md-view {
  margin: 0.25rem 0 1rem 0;
  /* Set only when the caller asks for a cap; see the maxHeight prop. */
  max-height: var(--r-md-view-max-height, none);
  overflow-y: auto;
}
.r-md-view :is(h1),
.r-md-view :is(h2),
.r-md-view :is(h3),
.r-md-view :is(h4) {
  margin-top: 0.8rem;
  margin-bottom: 0.3rem;
}
.r-md-view :is(p) {
  margin: 0.3rem 0;
}
.r-md-view :is(p:first-child) {
  margin-top: 0;
}
.r-md-view :is(p:last-child) {
  margin-bottom: 0;
}
.r-md-view :is(ul),
.r-md-view :is(ol) {
  margin: 0.3rem 0 0.3rem 1.25rem;
}
.r-md-view :is(table) {
  border-collapse: collapse;
  margin: 0.4rem 0;
}
.r-md-view :is(blockquote) {
  margin: 0.3rem 0;
  padding: 0 0.75rem;
}
</style>
