<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue';

/*
 * Thin wrapper over Iconify so call sites say `name="chevron-down"` rather
 * than repeating the `lucide:` prefix 200 times — and so swapping icon sets
 * later is one edit here rather than a codemod.
 *
 * Icons resolve from the offline subset registered by registerEtsIcons().
 * A name that was never generated renders NOTHING — no error, no warning, no
 * layout shift — so if an icon is mysteriously absent, check
 * src/icons/names.json first.
 *
 * `aria-hidden` is bound to an explicit false rather than undefined, because
 * Iconify's own component sets aria-hidden="true" by default and undefined
 * leaves it in place — which would hide every LABELLED icon from assistive
 * tech, silently. Vue renders aria-* falses rather than dropping them, so the
 * false actually reaches the DOM and overrides it.
 */
withDefaults(
  defineProps<{
    /** Lucide icon name, without the `lucide:` prefix. */
    name: string;
    /** Rendered square size. Matches the type scale, not an arbitrary px grid. */
    size?: number | string;
    /**
     * Accessible label. Omit when the icon is decorative and sits next to
     * text that already says the same thing — the icon is then hidden from
     * assistive tech, which is what you want. Supply it when the icon IS the
     * whole control (an icon-only button, a status glyph carrying meaning).
     */
    label?: string;
  }>(),
  { size: 16, label: undefined },
);
</script>

<template>
  <IconifyIcon
    class="r-icon"
    :icon="`lucide:${name}`"
    :width="size"
    :height="size"
    :aria-hidden="label ? false : true"
    :aria-label="label"
    :role="label ? 'img' : undefined"
  />
</template>

<style>
/* Unscoped, `r-`-prefixed. Deliberate: scoped styles would force every
     consumer override through :deep(), which is exactly the friction we are
     leaving behind with PrimeVue (62 :deep() selectors in config-admin alone).
     A plain class is overridable with a plain class. */
.r-icon {
  display: inline-block;
  flex: none;
  /* Icons sit on the text baseline rather than the line box, so they read as
       part of the sentence instead of floating above it. */
  vertical-align: -0.125em;
}
</style>
