<script setup lang="ts">
/**
 * The strip every blade teleports into.
 *
 * It owns the container element, the registry, the mobile crumb bar and the
 * auto-scroll that keeps the newest panel in view. It does not own the list
 * of open blades — the URL does.
 *
 * Render this in a persistent layout rather than inside a route component: a
 * stack that never unmounts cannot be taken down by a route failing.
 */
import { computed, inject, nextTick, onScopeDispose, provide, ref, shallowReactive, useTemplateRef, watch } from 'vue';

const props = defineProps<{
  discard?: () => void | Promise<void>;
}>();
import { useRoute, useRouter } from 'vue-router';
import { blockerKey, installDirtyGuard } from '../router/blocker';
import { idleNavigationState, navigationStateKey } from '../router/navigationState';
import BladeCrumbBar from '../internal/BladeCrumbBar.vue';
import BladeSkeleton from '../internal/BladeSkeleton.vue';
import DiscardChangesDialog from '../internal/DiscardChangesDialog.vue';
import { bladeDepthKey, bladeStackKey, type BladeEntry, type BladeStackInternals } from './context';
import { isPathWithin } from './paths';
import { useIsMobile } from '../internal/useIsMobile';

const route = useRoute();
const router = useRouter();
const strip = useTemplateRef<HTMLElement>('strip');
const asideHost = useTemplateRef<HTMLElement>('asideHost');
const isMobile = useIsMobile();

// Getters, not snapshots. Each closes over its Blade's own props, so a title
// or dirty flag changing is picked up without a watcher and without the blade
// having to re-register.
const registry = shallowReactive(new Map<string, () => BladeEntry>());

const blades = computed<readonly BladeEntry[]>(() =>
  [...registry.values()].map((read) => read()).sort((a, b) => a.depth - b.depth),
);

/** Mobile: which panel is on screen. Null means "the deepest". */
const focused = ref<string | null>(null);

// Focusing an ancestor is view state, not a navigation, so it must not
// survive one. Anything that changes the path has changed which blades exist.
watch(
  () => route.path,
  () => {
    focused.value = null;
  },
);

const focusedId = computed(() => {
  if (focused.value !== null && blades.value.some((blade) => blade.id === focused.value)) {
    return focused.value;
  }
  return blades.value[blades.value.length - 1]?.id ?? null;
});

const internals: BladeStackInternals = {
  strip,
  asideHost,
  isMobile,
  blades,
  focusedId,
  focus: (id) => {
    focused.value = id;
  },
  register: (id, read) => registry.set(id, read),
  unregister: (id) => registry.delete(id),
};

provide(bladeStackKey, internals);
provide(bladeDepthKey, 0);

// The dirty guard lives here because this is where the registry is. It reads
// blades lazily rather than being handed a snapshot, so a blade turning dirty
// after the guard was installed still counts.
const blocker = installDirtyGuard(router, () => blades.value, props.discard);
onScopeDispose(blocker.dispose);
provide(blockerKey, blocker);

// Null-object default, so a stack still renders when installBladeRouter was
// never called — it just never shows a skeleton.
const navigation = inject(navigationStateKey, idleNavigationState, true);

/**
 * A navigation heading deeper into the path we are already on means a new
 * blade is coming. One heading elsewhere means the whole stack is being
 * replaced, and a skeleton at the end of it would be a lie.
 */
const showSkeleton = computed(() => {
  const to = navigation.pendingTo.value;
  if (to === null) return false;
  // A navigation held up by the discard dialog is pending but going nowhere;
  // a skeleton behind the dialog would promise a panel that may never arrive.
  if (blocker.blocked.value) return false;
  return to.path !== route.path && isPathWithin(route.path, to.path);
});

/**
 * Where to scroll so the newest blade is readable.
 *
 * The goal is the whole panel on screen, so the primary aim is its *trailing*
 * edge against the viewport's — scroll as far right as this panel needs, which
 * for the deepest blade is usually the end of the strip. Aiming at its leading
 * edge instead would be enough to bring it into view but would leave the tail
 * of anything wider than the gap cut off at the right.
 *
 * That aim is then capped at the panel's own leading edge. The two only differ
 * once a panel is wider than the strip, where "whole panel visible" is not on
 * offer: a wide `fill` blade right-aligned shows its tail, with the title and
 * the close button off-screen to the left and the parent pushed out of sight
 * entirely. Below that cap it is shown from its beginning instead.
 *
 * Visual order comes from CSS `order`, which is the depth, so the newest
 * panel is the one with the highest order rather than the last in the DOM.
 */
function newestBladeOffset(element: HTMLElement): number {
  const panels = [...element.children].filter(
    // NOTE: this matches on the CSS class. Renaming `r-blade` in blade.css
    // without changing it here breaks auto-scroll SILENTLY — no error, the
    // strip simply stops following the newest panel.
    (child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('r-blade'),
  );
  if (panels.length === 0) return element.scrollWidth;

  const newest = panels.reduce((deepest, panel) =>
    Number(panel.style.order || 0) >= Number(deepest.style.order || 0) ? panel : deepest,
  );

  const maxScroll = element.scrollWidth - element.clientWidth;
  const padding = parseFloat(getComputedStyle(element).paddingLeft) || 0;
  // offsetLeft is a layout coordinate, unaffected by the strip's own scroll
  // position and by the slide-in transform, so both edges are stable however
  // mid-flight the panel is when this runs.
  const leading = newest.offsetLeft - element.offsetLeft - padding;
  const trailing = leading + newest.offsetWidth - element.clientWidth + padding;
  return Math.max(0, Math.min(maxScroll, leading, trailing));
}

// Keep the newest blade in view as the stack grows. flush: 'post' plus the
// nextTick is deliberate — the teleported section has to be in the DOM and
// laid out before the measurements above mean anything.
watch(
  () => [route.path, blades.value.length] as const,
  async () => {
    if (isMobile.value) return;
    await nextTick();
    const element = strip.value;
    // jsdom has no layout engine and no scrollTo, so this is also the guard
    // that lets the stack be mounted in a unit test at all. Whether the strip
    // actually scrolls is a question only a real browser can answer.
    if (!element || typeof element.scrollTo !== 'function') return;
    element.scrollTo({ left: newestBladeOffset(element), behavior: 'smooth' });
  },
  { flush: 'post' },
);
</script>

<template>
  <div class="r-blade-viewport">
    <div ref="strip" class="r-blade-strip" :class="{ 'is-mobile': isMobile }">
      <BladeCrumbBar
        v-if="isMobile && blades.length > 1"
        :blades="blades"
        :focused-id="focusedId"
        @focus="internals.focus"
      />
      <BladeSkeleton v-if="showSkeleton" :order="blades.length" />
    </div>

    <!-- Where the asides land. A sibling of the strip rather than a child, so
         a drawer is positioned against the whole viewport and does not travel
         when the strip scrolls sideways. Empty and inert until something
         teleports in — `pointer-events` is restored by the panels themselves,
         or this would swallow every click on the blades underneath. -->
    <div ref="asideHost" class="r-blade-asides"></div>

    <!-- The route subtree. It renders the blades, which teleport into the strip
         above, and contributes no layout of its own — so it must stay outside
         the flex container, not inside it. -->
    <slot />

    <DiscardChangesDialog
      :open="blocker.blocked.value"
      :titles="blocker.titles.value"
      @proceed="blocker.proceed"
      @stay="blocker.stay"
    />
  </div>
</template>
