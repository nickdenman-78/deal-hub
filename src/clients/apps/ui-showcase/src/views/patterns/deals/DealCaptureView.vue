<script setup lang="ts">
/*
 * Deal capture pattern: the ETS deals list, a deal's details and capturing an ASX futures deal from its product
 * code, as one blade stack. Design: https://claude.ai/artifact/8KSmHf3W3jyRHZQCkN1en8
 * Mapping (approved): https://claude.ai/artifact/5Wy1VGrhDoiQXrAHt67nyR
 *
 * Placeholder data only (./dealsData.ts). The real screens go in apps/ets/src/modules/deals and need
 * GET /api/deals, GET /api/deals/{id} and a product lookup that do not exist yet.
 */
import { BladeStack } from '@ets/ui';
</script>

<template>
  <div class="deal-capture">
    <BladeStack>
      <RouterView />
    </BladeStack>
  </div>
</template>

<style scoped>
.deal-capture {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
