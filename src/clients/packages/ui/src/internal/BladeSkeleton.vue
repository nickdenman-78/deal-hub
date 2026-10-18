<script setup lang="ts">
import Skeleton from '../components/Skeleton.vue';

/**
 * A placeholder panel while a deeper blade loads, so the strip grows at the
 * moment of the click rather than after the data arrives.
 *
 * Always md-width: the incoming blade's real size is not knowable until its
 * component renders, and guessing wrong looks worse than a consistent
 * placeholder.
 */
defineProps<{ order: number }>();

/* Varied widths so the body reads as ragged prose rather than a barcode. */
const LINES = ['91%', '100%', '66%', '83%', '50%'];
</script>

<template>
  <div class="r-blade r-blade--md r-blade--skeleton" :style="{ order }" role="status" aria-label="Loading">
    <!-- The bars sit inside the real header's own wrappers rather than beside
         them. It is those two elements that carry the reserved line heights, so
         borrowing them is what makes the placeholder exactly as tall as the
         panel replacing it — the alternative is two more heights to keep in
         step by hand, and the drift only shows as a flinch at the moment the
         data arrives. -->
    <div class="r-blade__header">
      <div class="r-blade__heading">
        <div class="r-blade__title"><Skeleton variant="title" /></div>
        <div class="r-blade__subtitle"><Skeleton variant="subtitle" /></div>
      </div>
    </div>
    <div class="r-blade__body r-blade__body--skeleton">
      <Skeleton v-for="(width, i) in LINES" :key="i" variant="line" :width="width" />
    </div>
  </div>
</template>
