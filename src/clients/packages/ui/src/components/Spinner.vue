<script setup lang="ts">
/*
 * Indeterminate activity indicator. Not v0's Progress — that models a value
 * with segments and buffers, which an indeterminate spinner does not have.
 *
 * `label` defaults to "Loading" rather than being optional-and-empty: a bare
 * spinner announces nothing at all to a screen reader, so the page appears
 * simply blank while it spins.
 */
withDefaults(
  defineProps<{
    size?: number;
    label?: string;
    /** Centres the spinner in the available space, with padding. */
    centered?: boolean;
  }>(),
  { size: 24, label: 'Loading' },
);
</script>

<template>
  <div class="r-spinner-wrap" :class="{ 'r-spinner-wrap--centered': centered }" role="status" :aria-label="label">
    <span
      class="r-spinner"
      :style="{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: `${Math.max(2, Math.round(size / 10))}px`,
      }"
    />
  </div>
</template>

<style>
.r-spinner-wrap {
  display: inline-flex;
}

.r-spinner-wrap--centered {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: var(--sp-8) 0;
}

.r-spinner {
  display: block;
  border-style: solid;
  border-color: var(--border-default);
  /* One transparent edge is what makes the ring read as spinning — a fully
       coloured ring rotates invisibly. */
  border-top-color: var(--accent);
  border-radius: var(--r-pill);
  animation: r-spinner-rotate 720ms linear infinite;
}

@keyframes r-spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

/* base.css already flattens animation-duration under prefers-reduced-motion,
     which would leave a static ring looking like a broken graphic. Fade instead
     — still communicates "busy", without sustained rotation. */
@media (prefers-reduced-motion: reduce) {
  .r-spinner {
    animation: r-spinner-pulse 1.4s ease-in-out infinite !important;
  }
}

@keyframes r-spinner-pulse {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}
</style>
