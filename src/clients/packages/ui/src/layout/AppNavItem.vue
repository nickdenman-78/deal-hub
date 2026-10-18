<script setup lang="ts">
/**
 * A primary-nav row that knows expanded vs rail presentation.
 *
 * When the sidebar is collapsed to icons-only, the label moves into a tooltip
 * and aria-label — the icon alone is not enough for assistive tech or for a
 * hover glance. Expanded (and always on narrow, where the drawer shows labels)
 * the label sits beside the icon.
 */
import { computed, inject, useSlots } from 'vue';
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import Icon from '../components/Icon.vue';
import Tooltip from '../components/Tooltip.vue';
import { appLayoutKey } from './context';

const props = withDefaults(
  defineProps<{
    /** Lucide icon name, without the `lucide:` prefix. */
    icon: string;
    label: string;
    to?: RouteLocationRaw;
    href?: string;
    /**
     * Browsing context for an `href` row — `_blank` for a destination outside
     * the app.
     *
     * It is a prop rather than a fallthrough attribute because this component's
     * root is a Tooltip: an attribute put on the tag lands there and never
     * reaches the anchor, silently, which looks like it worked.
     */
    target?: string;
    /**
     * Defaults to `noopener noreferrer` whenever `target` is set. Without it the
     * opened page can reach back through `window.opener`, and every external nav
     * item would have to remember to say so.
     */
    rel?: string;
    /** Match the path exactly (RouterLink exact-active). */
    exact?: boolean;
    /**
     * Force the active style when not using `to` (button / href rows).
     * RouterLink rows still get `is-active` from vue-router.
     */
    active?: boolean;
  }>(),
  { to: undefined, href: undefined, exact: false, active: false },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const slots = useSlots();
const layout = inject(appLayoutKey, null);

const rail = computed(() => Boolean(layout?.collapsed.value && !layout?.isNarrow.value));

const tag = computed(() => {
  if (props.to !== undefined) return RouterLink;
  if (props.href !== undefined) return 'a';
  return 'button';
});

const linkBind = computed(() => {
  if (props.to !== undefined) {
    return {
      to: props.to,
      activeClass: props.exact ? '' : 'is-active',
      exactActiveClass: props.exact ? 'is-active' : 'is-exact',
    };
  }
  if (props.href !== undefined) {
    return {
      href: props.href,
      target: props.target,
      rel: props.rel ?? (props.target ? 'noopener noreferrer' : undefined),
    };
  }
  return { type: 'button' as const };
});

function onClick(event: MouseEvent) {
  emit('click', event);
  // Close the mobile drawer after a nav activation so the destination is visible.
  if (layout?.isNarrow.value) {
    layout.closeNav();
  }
}
</script>

<template>
  <Tooltip :text="label" :disabled="!rail" position-area="right">
    <component
      :is="tag"
      class="r-app-nav-item"
      :class="{ 'r-app-nav-item--rail': rail, 'is-active': active }"
      v-bind="linkBind"
      :aria-label="rail ? label : undefined"
      :aria-current="active ? (to !== undefined ? 'true' : 'page') : undefined"
      @click="onClick"
    >
      <Icon class="r-app-nav-item__icon" :name="icon" :size="18" />
      <span v-if="!rail" class="r-app-nav-item__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-else-if="slots.default" class="r-app-nav-item__label r-app-nav-item__label--sr">
        <slot />
      </span>
    </component>
  </Tooltip>
</template>
