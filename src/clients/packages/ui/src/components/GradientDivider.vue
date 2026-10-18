<script setup lang="ts">
/**
 * Brand gradient rule — violet → blue.
 *
 * Illustration accent only (hero splits, KPI clusters, sparse layout marks).
 * Not a substitute for `--border-*` chrome. Prefer ordinary borders / spacing
 * for routine list and form separation.
 *
 * `thickness` is the thin axis; `length` is the long axis (`auto` fills the
 * parent along that axis — 100% width when horizontal, 100% height when
 * vertical). Numbers are pixels; other CSS lengths pass through.
 */
import { computed } from 'vue';

export type GradientDividerOrientation = 'horizontal' | 'vertical';

const props = withDefaults(
  defineProps<{
    orientation?: GradientDividerOrientation;
    /** Thin axis. Number = px. */
    thickness?: number | string;
    /**
     * Long axis. Number = px. `'auto'` fills the parent. Omit for the
     * orientation default: 60px vertical, full-width horizontal.
     */
    length?: number | string;
  }>(),
  { orientation: 'vertical', thickness: 2 },
);

function cssSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

const resolvedLength = computed(() => {
  if (props.length != null) return props.length;
  return props.orientation === 'horizontal' ? 'auto' : 60;
});

const style = computed(() => {
  const thickness = cssSize(props.thickness);
  const length = resolvedLength.value === 'auto' ? '100%' : cssSize(resolvedLength.value);
  if (props.orientation === 'horizontal') {
    return { height: thickness, width: length };
  }
  return { width: thickness, height: length };
});
</script>

<template>
  <div
    class="r-gradient-divider"
    :class="`r-gradient-divider--${orientation}`"
    role="separator"
    :aria-orientation="orientation"
    :style="style"
  />
</template>

<style>
.r-gradient-divider {
  flex: none;
  border-radius: var(--r-pill);
}

.r-gradient-divider--vertical {
  background-image: var(--gradient-brand);
}

.r-gradient-divider--horizontal {
  background-image: var(--gradient-brand-inline);
}
</style>
