<script setup lang="ts">
import { computed } from 'vue';
import { plainTextExcerpt } from '../markdown/render';

/*
 * A one-line plain-text excerpt of a markdown source, for list rows and cards.
 * Renders nothing at all when the source is empty, so a table cell collapses
 * rather than reserving space for a description that is not there.
 */
const props = withDefaults(
  defineProps<{
    source?: string | null;
    maxChars?: number;
  }>(),
  { source: undefined, maxChars: 120 },
);

const text = computed(() => plainTextExcerpt(props.source, props.maxChars));
</script>

<template>
  <p v-if="text" class="r-md-excerpt">{{ text }}</p>
</template>

<style>
.r-md-excerpt {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  line-height: 1.35;
}
</style>
