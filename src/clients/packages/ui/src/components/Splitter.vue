<script setup lang="ts">
/**
 * Resizable panel layout on v0's Splitter. Pair with SplitterPanel.
 *
 * The handle is a real focusable control with arrow-key resizing — v0 gives
 * that; a mouse-only splitter is unusable for anyone who cannot drag.
 */
import { Splitter } from '@vuetify/v0/components';

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
  }>(),
  { orientation: 'horizontal' },
);

const emit = defineEmits<{
  /** Fires at the end of a resize with every panel's size (%). */
  (e: 'layout', sizes: number[]): void;
}>();

function onLayout(sizes: number[]) {
  emit('layout', sizes);
}
</script>

<template>
  <Splitter.Root
    class="r-splitter"
    :class="`r-splitter--${orientation}`"
    :orientation="orientation"
    :disabled="disabled"
    @layout="onLayout"
  >
    <slot />
  </Splitter.Root>
</template>

<style>
.r-splitter {
  display: flex;
  /*
   * Fills its host. `flex: 1` alone only stretches inside a FLEX parent — drop
   * the splitter into an ordinary block of fixed height and it collapsed to the
   * height of its content, which for a pair of short panes is about 20px. The
   * handle was then a 20px sliver and dragging had almost nothing to move,
   * which reads as the splitter simply not working.
   */
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
}

.r-splitter--vertical {
  flex-direction: column;
}

/*
 * The handle has to be FINDABLE. It was a 1px hairline in --border-default,
 * indistinguishable from every other divider on the page, so nobody could tell
 * the layout was resizable. It is now a filled track a little darker than the
 * surface, carrying a grip that firms up on hover and focus.
 *
 * States come from v0's data-state (inactive | hover | drag) rather than :hover,
 * because the pointer leaves the handle constantly while dragging — a :hover
 * rule flickers off mid-drag exactly when the affordance matters most.
 */
.r-splitter-handle {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  background: var(--bg-surface-3);
  cursor: col-resize;
  /*
   * NO background-clip here, and that is the whole reason the handle used to be
   * invisible. It was `padding: 0 4px` + `background-clip: content-box` — which
   * paints the background only inside the CONTENT box, and an 8px-wide element
   * with 4px of padding either side has a content box exactly 0px wide. The
   * track was clipped out of existence; the splitter looked like a plain gap.
   *
   * The whole 7px is now both the visible track and the hit area. A 1px line
   * would be prettier and unusable: too small to hit with a mouse and
   * impossible with a finger.
   */
  inline-size: 7px;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

/* The grip: a short bar centred on the handle, so the control reads as
   draggable while it is sitting still. */
.r-splitter-handle::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: var(--border-strong, var(--fg-faint));
  transition:
    background-color var(--dur-fast) var(--ease-out),
    inline-size var(--dur-fast) var(--ease-out),
    block-size var(--dur-fast) var(--ease-out);
}

.r-splitter--horizontal .r-splitter-handle::after {
  inline-size: 2px;
  block-size: 18px;
}

.r-splitter--vertical .r-splitter-handle::after {
  inline-size: 18px;
  block-size: 2px;
}

.r-splitter--vertical .r-splitter-handle {
  inline-size: auto;
  block-size: 7px;
  cursor: row-resize;
}

/*
 * :hover AND data-state, deliberately. :hover covers the ordinary case without
 * depending on v0 keeping an attribute in sync; data-state='drag' covers the
 * one :hover cannot, because the pointer leaves the handle constantly while
 * dragging and a hover-only rule flickers off exactly when the affordance
 * matters most.
 */
.r-splitter-handle:hover,
.r-splitter-handle[data-state='hover'],
.r-splitter-handle[data-state='drag'],
.r-splitter-handle:focus-visible {
  background-color: var(--accent-soft);
}

.r-splitter-handle:hover::after,
.r-splitter-handle[data-state='hover']::after,
.r-splitter-handle[data-state='drag']::after,
.r-splitter-handle:focus-visible::after {
  background: var(--accent);
}

/* Longer while active, so the grip grows under the pointer rather than just
   changing colour. */
.r-splitter--horizontal .r-splitter-handle:hover::after,
.r-splitter--horizontal .r-splitter-handle[data-state='hover']::after,
.r-splitter--horizontal .r-splitter-handle[data-state='drag']::after,
.r-splitter--horizontal .r-splitter-handle:focus-visible::after {
  block-size: 30px;
}

.r-splitter--vertical .r-splitter-handle:hover::after,
.r-splitter--vertical .r-splitter-handle[data-state='hover']::after,
.r-splitter--vertical .r-splitter-handle[data-state='drag']::after,
.r-splitter--vertical .r-splitter-handle:focus-visible::after {
  inline-size: 30px;
}

.r-splitter-handle[aria-disabled='true'] {
  cursor: default;
  opacity: 0.5;
}
</style>
