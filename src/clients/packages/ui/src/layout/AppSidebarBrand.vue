<script setup lang="ts">
/**
 * ETS wordmark / bolt mark for AppSidebar's #brand slot.
 *
 * Owns the rail ↔ expanded and light ↔ dark image swap that every product shell
 * would otherwise reinvent (admission test 1 — counterpart of AppSidebar's
 * brand region + @ets/brand assets). Product *copy* stays out: pass `label`
 * for the accessible name, and optionally `to` / `href` for the home link.
 *
 * Theme swap is CSS against `[data-theme]` / `.dark` so it tracks the painted
 * theme without a useTheme subscription (and works on VitePress / blank frames
 * that never mount AppLayout).
 */
import { computed, inject } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import dial from '@ets/brand/assets/ets-mark.svg';
import logo from '@ets/brand/assets/ets-logo.svg';
import logoNeg from '@ets/brand/assets/ets-logo-neg.svg';
import { appLayoutKey } from './context';

const props = withDefaults(
  defineProps<{
    /** Accessible name for the control (and img alt when expanded). */
    label?: string;
    to?: RouteLocationRaw;
    href?: string;
  }>(),
  { label: 'ETS', to: undefined, href: undefined },
);

const layout = inject(appLayoutKey, null);

/** Icons-only rail — same rule AppNavItem / AppSidebar use. */
const rail = computed(() => Boolean(layout?.collapsed.value && !layout?.isNarrow.value));

const tag = computed(() => {
  if (props.to !== undefined) return RouterLink;
  if (props.href !== undefined) return 'a';
  return 'span';
});

const interactive = computed(() => props.to !== undefined || props.href !== undefined);

const linkBind = computed(() => {
  if (props.to !== undefined) return { to: props.to };
  if (props.href !== undefined) return { href: props.href };
  return {};
});
</script>

<template>
  <component
    :is="tag"
    class="r-app-sidebar-brand"
    :class="{ 'r-app-sidebar-brand--rail': rail }"
    v-bind="linkBind"
    :aria-label="interactive ? label : undefined"
  >
    <img
      class="r-app-sidebar-brand__img r-app-sidebar-brand__wordmark r-app-sidebar-brand__wordmark--light"
      :src="logo"
      alt=""
      width="180"
      height="40"
      decoding="async"
    />
    <img
      class="r-app-sidebar-brand__img r-app-sidebar-brand__wordmark r-app-sidebar-brand__wordmark--dark"
      :src="logoNeg"
      alt=""
      width="180"
      height="40"
      decoding="async"
    />
    <img
      class="r-app-sidebar-brand__img r-app-sidebar-brand__dial"
      :src="dial"
      alt=""
      width="40"
      height="40"
      decoding="async"
    />
  </component>
</template>
