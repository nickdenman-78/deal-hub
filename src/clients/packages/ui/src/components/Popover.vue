<script setup lang="ts">
/**
 * A general-purpose anchored panel on v0's Popover, which uses the CSS anchor
 * API — so there is no JS measurement to keep in sync with scroll or resize.
 *
 * For a list of commands use Menu instead: this has no menu roles and no
 * roving focus, and giving arbitrary content menuitem semantics is worse than
 * having none.
 *
 * Edge behaviour comes from CSS `position-try-fallbacks` (see
 * `POPOVER_POSITION_TRY`), not Floating UI. `@floating-ui/dom` stays in
 * `@ets/editor` for TipTap bubble menus; pulling it into every app via
 * `@ets/ui` is not worth it when the platform API already flips.
 */
import { Popover } from '@vuetify/v0/components';
import { POPOVER_POSITION_TRY } from './popoverPosition';

withDefaults(
  defineProps<{
    /** Placement, in CSS `position-area` terms, e.g. "bottom span-right". */
    positionArea?: string;
    /**
     * CSS `position-try-fallbacks` when the preferred area overflows.
     * Defaults to flip-block / flip-inline / both.
     */
    positionTry?: string;
    /** Accessible name for the panel itself. */
    label?: string;
    /** Extra class on the panel (e.g. to widen past the default max-width). */
    contentClass?: string;
    /** When false, the activator is removed from the tab order. */
    tabbable?: boolean;
    /** Disables the activator (panel cannot open). */
    disabled?: boolean;
  }>(),
  {
    positionArea: undefined,
    positionTry: POPOVER_POSITION_TRY,
    label: undefined,
    contentClass: undefined,
    tabbable: true,
  },
);

const open = defineModel<boolean>('open', { default: false });

/*
 * ONE MODEL PER INSTANCE. `popover="auto"` elements are mutually exclusive in
 * the top layer, so opening a second light-dismisses the first — and if both
 * are bound to the SAME ref, that dismissal writes false back and closes the
 * one you just opened. Two popovers sharing a v-model therefore appear
 * completely dead rather than merely coupled. Leave the model off entirely if
 * you do not need to drive the panel from outside.
 */

/**
 * Clicks on non-focusable panel content would otherwise blur the activator's
 * field with relatedTarget=null, and host controls that close on focusout
 * would dismiss the panel mid-interaction. Focusing the panel first keeps
 * focus "inside" the popover.
 */
function onContentMouseDown(event: MouseEvent) {
  const panel = event.currentTarget;
  if (!(panel instanceof HTMLElement)) return;
  if (panel === document.activeElement || panel.contains(document.activeElement)) return;
  panel.focus({ preventScroll: true });
}
</script>

<template>
  <!--
    `v-slot="{ id }"` is load-bearing, not decoration — see the matching note in
    Menu.vue. v0's PopoverContent only honours `position-area` / `position-try`
    when it is given its OWN `id`; without one it silently falls back to the
    root's context styles, which are hard-wired to "bottom" / "most-width
    bottom" (PopoverRoot never threads the options into usePopover the way
    TooltipRoot does). Passing the root's id back down takes the branch that
    reads the props, and `position-anchor` derives from that same id, so the
    panel still anchors to the activator.
  -->
  <Popover.Root v-slot="{ id }" v-model="open">
    <!--
      NO @click HANDLER. Popover.Activator has no click handler of its own: it
      carries `popovertarget`, and the BROWSER toggles the panel and fires
      `toggle`, which v0 listens to in order to sync its state. An extra
      `open = !open` here was therefore a second toggle racing the browser's,
      and the two cancelled — the popover never opened at all, silently.
    -->
    <Popover.Activator
      class="r-popover__activator"
      :tabindex="tabbable === false ? -1 : undefined"
      :disabled="disabled"
      :aria-label="label"
    >
      <slot name="trigger" :open="open" />
    </Popover.Activator>

    <Popover.Content
      :id="id"
      class="r-popover"
      :class="contentClass"
      role="dialog"
      tabindex="-1"
      :aria-label="label"
      :position-area="positionArea"
      :position-try="positionTry"
      @mousedown="onContentMouseDown"
    >
      <slot :close="() => (open = false)" />
    </Popover.Content>
  </Popover.Root>
</template>

<style>
.r-popover__activator {
  display: inline-flex;
  /* v0 defaults Activator to <button>. Same reset as Tooltip/Menu so native
     light chrome does not show through in a dark themed subtree. */
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.r-popover {
  z-index: 50;
  max-width: min(28rem, calc(100vw - var(--sp-6)));
  padding: var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-primary);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
}

.r-popover:focus {
  outline: none;
}

.r-popover:focus-visible {
  outline: 1px solid var(--border-focus);
  outline-offset: 2px;
}
</style>
