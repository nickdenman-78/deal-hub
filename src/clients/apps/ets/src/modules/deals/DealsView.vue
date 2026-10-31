<script setup lang="ts">
/*
 * The Deals module: the deals list, a deal's details and capturing an ASX futures deal, as one blade stack.
 * Design: https://claude.ai/artifact/8KSmHf3W3jyRHZQCkN1en8 (prototype: ui-showcase Patterns › Deal capture).
 */
import { BladeStack } from '@ets/ui';
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="deals">
    <BladeStack>
      <RouterView />
    </BladeStack>
  </div>
</template>

<style scoped>
.deals {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
