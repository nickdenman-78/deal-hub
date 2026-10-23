<script setup lang="ts">
import { BladeStack } from '@ets/ui';
</script>

<template>
  <!--
    Fill the showcase view under the toolbar. Note copy and Blade API docs live
    in the root Deals blade — keeping them out of this shell lets the viewport
    stretch edge to edge.
  -->
  <div class="blades-demo">
    <BladeStack>
      <RouterView />
    </BladeStack>
  </div>
</template>

<style scoped>
.blades-demo {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
