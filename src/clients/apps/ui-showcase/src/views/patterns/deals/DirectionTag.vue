<script setup lang="ts">
/*
 * Buy / Sell tag. Domain vocabulary, so it lives with the deals screens (apps/ets/src/modules/deals in the real
 * app), not in @ets/ui. It reuses Tag's soft styling by feeding the trading-direction tokens into the severity
 * custom properties, and pairs the colour with an arrow and the word so it never relies on colour alone.
 */
import { Icon } from '@ets/ui';
import type { Direction } from './dealsData';

defineProps<{ direction: Direction }>();
</script>

<template>
  <span class="r-tag r-tag--soft direction-tag" :class="`direction-tag--${direction.toLowerCase()}`">
    <Icon :name="direction === 'Buy' ? 'arrow-up' : 'arrow-down'" :size="12" />
    {{ direction }}
  </span>
</template>

<style scoped>
.direction-tag--buy {
  --sev-soft: var(--buy-soft);
  --sev-ink: var(--buy-ink);
}

.direction-tag--sell {
  --sev-soft: var(--sell-soft);
  --sev-ink: var(--sell-ink);
}
</style>
