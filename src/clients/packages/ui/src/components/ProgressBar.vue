<script setup lang="ts">
/**
 * Determinate progress on v0's Progress.
 *
 * For an indeterminate "busy" state use Spinner instead — Progress models a
 * value with a min and max, and an indeterminate bar is not that.
 */
import { Progress } from '@vuetify/v0/components';
import { computed } from 'vue';
import type { Severity } from '../severity';

const props = withDefaults(
  defineProps<{
    value: number;
    min?: number;
    max?: number;
    label?: string;
    /** Shows the percentage beside the bar. */
    showValue?: boolean;
    severity?: Severity;
  }>(),
  { min: 0, max: 100, label: 'Progress', severity: 'primary' },
);

const percent = computed(() => {
  const span = props.max - props.min;
  if (span <= 0) return 0;
  return Math.round(((props.value - props.min) / span) * 100);
});
</script>

<template>
  <div class="r-progress" :class="`r-severity-${severity}`">
    <Progress.Root :model-value="value" :min="min" :max="max" :aria-label="label" class="r-progress__root">
      <Progress.Track class="r-progress__track">
        <Progress.Fill class="r-progress__fill" :style="{ width: `${percent}%` }" />
      </Progress.Track>
    </Progress.Root>
    <span v-if="showValue" class="r-progress__value">{{ percent }}%</span>
  </div>
</template>

<style>
.r-progress {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.r-progress__root {
  flex: 1;
  min-width: 0;
}

.r-progress__track {
  height: 6px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: var(--bg-surface-3);
}

.r-progress__fill {
  height: 100%;
  border-radius: var(--r-pill);
  background: var(--sev-fill);
  transition: width var(--dur-base) var(--ease-out);
}

.r-progress__value {
  flex: none;
  color: var(--fg-muted);
  font-family: var(--font-data);
  font-size: var(--fs-xs);
  /* Tabular figures so the bar does not twitch sideways as the number grows
       from 9% to 10%. */
  font-variant-numeric: tabular-nums;
}
</style>
