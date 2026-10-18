<script setup lang="ts">
/*
 * Loading placeholder bar. No v0 primitive — a skeleton has no behaviour, only
 * a pulse.
 *
 * The variants carry the reserved heights that used to live as blade-only CSS:
 * `title`/`subtitle` are shaped to sit inside a heading's own wrappers (see
 * BladeSkeleton, this component's first consumer), `line` is a body row whose
 * width the caller varies so the block reads as ragged prose rather than a
 * barcode, `block` fills whatever box the caller gives it, and `circle` stands
 * in for an Avatar.
 *
 * Width/height are plain CSS lengths rather than a utility-class scale — the
 * caller knows what the placeholder is impersonating; a fixed scale just makes
 * it approximate that knowledge in steps.
 */
export type SkeletonVariant = 'title' | 'subtitle' | 'line' | 'block' | 'circle';

withDefaults(
  defineProps<{
    variant?: SkeletonVariant;
    /** CSS length; overrides the variant's default width. */
    width?: string;
    /** CSS length; overrides the variant's default height. */
    height?: string;
  }>(),
  { variant: 'line', width: undefined, height: undefined },
);
</script>

<template>
  <span class="r-skeleton" :class="`r-skeleton--${variant}`" :style="{ width, height }" aria-hidden="true"></span>
</template>

<style>
.r-skeleton {
  display: block;
  border-radius: var(--r-sm);
  background: var(--bg-surface-3);
  animation: r-skeleton-pulse 1.6s ease-in-out infinite;
}

/* The margins centre each bar in the line its wrapper reserves, rather than
   separating the two — the wrappers do the separating. Contained rather than
   collapsed out because blade heading wrappers set `overflow: hidden`, which is
   also what makes them a block formatting context. */
.r-skeleton--title {
  width: 50%;
  height: 14px;
  margin-top: var(--sp-1);
}

.r-skeleton--subtitle {
  width: 33%;
  height: 9px;
  margin-top: var(--sp-1);
}

.r-skeleton--line {
  height: 11px;
}

.r-skeleton--block {
  width: 100%;
  height: 100%;
}

.r-skeleton--circle {
  width: 32px;
  height: 32px;
  border-radius: var(--r-pill);
}

@keyframes r-skeleton-pulse {
  50% {
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* base.css flattens animation-duration globally, which would freeze the
     skeleton mid-pulse at an arbitrary opacity. Slow it right down instead. */
  .r-skeleton {
    animation-duration: 4s !important;
  }
}
</style>
