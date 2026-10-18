<script setup lang="ts">
/**
 * One panel in a <BladeStack>. Wrap a route's content in this, rendering a
 * <RouterView> INSIDE it for child blades; the panel teleports into the
 * stack's horizontal strip.
 *
 * Nothing here holds the stack in state. The nested route tree *is* the
 * stack: depth comes from provide/inject, order comes from CSS, and closing
 * is a navigation to the parent path. So every view is addressable and
 * survives a reload.
 */
import { computed, inject, onScopeDispose, onWatcherCleanup, provide, useId, watchEffect } from 'vue';
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router';
import BladePanel from '../internal/BladePanel.vue';
import { bladeDepthKey, bladeStackKey, type BladeEntry } from './context';
import { hasVariableLengthParams, prefixPath, segmentCount } from './paths';
import { ancestorOf, deepestClosableDepth } from './registry';
import type { BladeMinSize, BladeSize } from './sizes';
import '../router/types';

const props = withDefaults(
  defineProps<{
    /**
     * Data, not markup, which is why it is a prop and a plain string: the
     * stack uses it for the mobile crumb bar and the discard-changes dialog
     * as well as the header, and neither can render a VNode.
     */
    title: string;
    subtitle?: string | undefined;
    size?: BladeSize;
    /**
     * Floor for the panel's width. Meant for `fill`, which otherwise gives up
     * width to its siblings down to the built-in `lg` floor: a workbench that
     * must stay readable declares `min-size="xl"` and keeps its columns even
     * with two list blades open beside it. It still grows past the floor.
     *
     * Ignored on mobile, where every panel is full width and stacked.
     */
    minSize?: BladeMinSize | undefined;
    /**
     * Hide the ✕ where closing would only bounce off a loader redirect — a
     * root blade, or an index blade sharing its path with its parent.
     * Declaring it also lets Escape fall through to a blade that can close.
     */
    closable?: boolean;
    /**
     * Where ✕ and Escape go, when that is not the parent blade's path. For a
     * blade that *replaces* a sibling rather than stacking beside it, the
     * route tree cannot know where it came from, so the opener passes it on.
     */
    closeTo?: RouteLocationRaw | undefined;
    /** When true, navigations that would leave this blade ask to confirm. */
    dirty?: boolean;
  }>(),
  {
    subtitle: undefined,
    size: 'md',
    minSize: undefined,
    closable: true,
    closeTo: undefined,
    dirty: false,
  },
);

defineSlots<{
  default(): unknown;
  /** One compact control beside the ✕. */
  actions?(): unknown;
  /** Command bar, pinned to the foot. */
  footer?(): unknown;
  /** Rich alternative to the `subtitle` prop. */
  subtitle?(): unknown;
  /** Compact control on the title row, immediately after the heading text. */
  titleEnd?(): unknown;
}>();

// The root is a <Teleport>, which has nowhere to put fallthrough attributes,
// so they are forwarded explicitly to the panel below. Without this a class
// on a <Blade> would silently do nothing.
defineOptions({ inheritAttrs: false });

const route = useRoute();
const router = useRouter();
const id = useId();

const depth = inject(bladeDepthKey, 0);
provide(bladeDepthKey, depth + 1);

// Undefined when a Blade is used outside a stack — an error panel rendered by
// a global error view, for instance. It then renders in place instead.
const stack = inject(bladeStackKey, undefined);

/** The matched record that owns this blade. */
const record = computed(() => route.matched.filter((r) => r.meta.blade === true)[depth]);

/** This blade's own resolved path, params filled in. */
const path = computed(() => {
  const owner = record.value;
  return owner ? prefixPath(route.path, segmentCount(owner.path)) : route.path;
});

if (import.meta.env.DEV) {
  watchEffect(() => {
    const owner = record.value;
    if (!owner) {
      console.warn(
        `[blade] "${props.title}" is at depth ${depth} but only ` +
          `${route.matched.filter((r) => r.meta.blade === true).length} matched records ` +
          'carry meta.blade. Did a route forget the marker?',
      );
      return;
    }
    if (hasVariableLengthParams(owner.path)) {
      console.warn(
        `[blade] route "${owner.path}" uses a variable-length param, so its ` +
          "segment count is not fixed and this blade's path cannot be derived.",
      );
      return;
    }
    // The assertion that makes the whole segment-prefix scheme safe: if the
    // derived path does not resolve back to the record it came from, every
    // close destination and dirty-guard comparison below is wrong.
    if (!router.resolve(path.value).matched.includes(owner)) {
      console.warn(`[blade] derived path "${path.value}" does not resolve back to "${owner.path}".`);
    }
  });
}

// Registered in setup rather than onMounted. Parent setup runs before child
// setup, so registration order already equals depth order and the registry is
// correct the first time anything reads it — no round trip through an effect.
if (stack) {
  const read = (): BladeEntry => ({
    id,
    depth,
    title: props.title,
    path: path.value,
    dirty: props.dirty,
    closable: props.closable,
    closeTo: props.closeTo,
  });
  stack.register(id, read);
  onScopeDispose(() => stack.unregister(id));
}

const blades = computed(() => stack?.blades.value ?? []);
const isMobile = computed(() => stack?.isMobile.value ?? false);

/** Where ✕ and Escape go. A root blade has nowhere, so it cannot close. */
const closeDestination = computed<RouteLocationRaw | null>(() => {
  if (props.closeTo !== undefined) return props.closeTo;
  return ancestorOf(blades.value, depth)?.path ?? null;
});

const showClose = computed(() => props.closable && closeDestination.value !== null && !isMobile.value);

const isEscapeTarget = computed(
  () =>
    props.closable &&
    closeDestination.value !== null &&
    !isMobile.value &&
    depth === deepestClosableDepth(blades.value),
);

const closeHint = computed(() => (isEscapeTarget.value ? 'Close (Esc)' : 'Close'));

function close() {
  const to = closeDestination.value;
  if (to === null) return;
  // The same navigation the ✕ makes, so the dirty guard gets its say either
  // way. Scroll is left alone by the router's blade-aware scrollBehavior.
  void router.push(to);
}

// Escape is the keyboard's version of the ✕, on the one blade whose ✕ the
// user would be reaching for. Only unclaimed presses count: anything that
// already handled the key — a dropdown, an aside — marks the event
// defaultPrevented. Native <dialog> is the exception: Escape closes it via
// the cancel event and does NOT mark keydown defaultPrevented, so without
// the open-dialog check one press would dismiss the dialog AND the blade
// underneath it.
watchEffect(() => {
  if (!isEscapeTarget.value) return;

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    close();
  };

  document.addEventListener('keydown', onKeyDown);
  onWatcherCleanup(() => document.removeEventListener('keydown', onKeyDown));
});

/** Mobile shows one blade at a time; the rest are hidden, not unmounted. */
const hidden = computed(() => {
  if (!isMobile.value) return false;
  const focused = stack?.focusedId.value ?? null;
  if (focused !== null) return focused !== id;
  const deepest = blades.value[blades.value.length - 1];
  return deepest ? deepest.id !== id : false;
});

/**
 * The leaf (or mobile-focused) panel owns keyboard focus. Mount alone is not
 * enough: closing a child, swapping a sibling, or un-hiding on mobile must
 * reclaim focus the same way a fresh open does.
 */
const ownsFocus = computed(() => {
  if (!stack) return true;
  return stack.focusedId.value === id;
});
</script>

<template>
  <!-- v-if rather than :disabled. A disabled Teleport renders the panel in
       place — inside the route subtree, which is the zero-footprint sibling
       that must stay invisible — so it would flash in the wrong position and
       then move. With v-if, the first pass creates nothing; the strip ref is
       assigned in a post-render effect, and the re-render lands in the same
       microtask, before paint. -->
  <Teleport v-if="stack && stack.strip.value" :to="stack.strip.value">
    <BladePanel
      v-bind="$attrs"
      :title="title"
      :subtitle="subtitle"
      :size="size"
      :min-size="minSize"
      :closable="showClose"
      :close-hint="closeHint"
      :hidden="hidden"
      :owns-focus="ownsFocus"
      :order="depth"
      :identity="path"
      @close="close"
    >
      <slot />
      <template v-if="$slots.subtitle" #subtitle><slot name="subtitle" /></template>
      <template v-if="$slots.titleEnd" #titleEnd><slot name="titleEnd" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
      <template v-if="$slots.footer" #footer><slot name="footer" /></template>
    </BladePanel>
  </Teleport>

  <!-- No stack at all: render in place, so an error panel looks right wherever
       it is put. Deliberately not v-else — while a stack exists but its strip
       ref has not been assigned yet, this renders nothing for one pass. -->
  <BladePanel
    v-else-if="!stack"
    v-bind="$attrs"
    :title="title"
    :subtitle="subtitle"
    :size="size"
    :closable="false"
    close-hint="Close"
    :owns-focus="true"
    :order="depth"
    :identity="path"
  >
    <slot />
    <template v-if="$slots.subtitle" #subtitle><slot name="subtitle" /></template>
    <template v-if="$slots.titleEnd" #titleEnd><slot name="titleEnd" /></template>
    <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </BladePanel>
</template>
