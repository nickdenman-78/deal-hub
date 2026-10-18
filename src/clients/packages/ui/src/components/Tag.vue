<script setup lang="ts">
import Icon from './Icon.vue';
import type { Severity } from '../severity';

export type TagVariant = 'soft' | 'solid' | 'outline';

/*
 * Status chip. No v0 primitive — a tag has no behaviour, only appearance.
 *
 * `soft` is the default because these mostly appear in table cells, where a
 * column of solid-filled chips fights the data for attention. Reach for
 * `solid` when the chip IS the message (a banner state), not a row attribute.
 *
 * Colour comes from `.r-severity-*` (`--sev-*`); the variants below consume
 * them so a new severity is free.
 */
withDefaults(
  defineProps<{
    severity?: Severity;
    variant?: TagVariant;
    icon?: string;
  }>(),
  { severity: 'secondary', variant: 'soft', icon: undefined },
);
</script>

<template>
  <span class="r-tag" :class="[`r-severity-${severity}`, `r-tag--${variant}`]">
    <Icon v-if="icon" :name="icon" :size="12" />
    <slot />
  </span>
</template>

<style>
.r-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 2px var(--sp-2);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  line-height: var(--lh-snug);
  white-space: nowrap;
}

.r-tag--soft {
  background: var(--sev-soft);
  /* --sev-ink, not --sev-hue: the plain hue sits mid-lightness and only
       manages ~2:1 on its own tint. The ink values are darkened until they
       measure past 4.5:1. See the note in @ets/brand's tokens.css. */
  color: var(--sev-ink);
}

.r-tag--solid {
  /* --sev-fill, not --sev-hue: white on the plain hue measures 2.5–3.8:1 in
       light mode. The fill is the dark end of the ramp in light and the light
       end in dark, so --sev-on flips with it. */
  background: var(--sev-fill);
  color: var(--sev-on);
}

.r-tag--outline {
  /* The hue IS correct here — nothing sits on top of it. */
  border-color: var(--sev-hue);
  color: var(--sev-ink);
}
</style>
