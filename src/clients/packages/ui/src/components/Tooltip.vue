<script setup lang="ts">
/**
 * A description that appears on hover or focus, on v0's Tooltip.
 *
 * A tooltip is supplementary by definition: anything essential must be in the
 * page, because a tooltip is unreachable on touch and easy to miss. Use it to
 * expand an abbreviation or explain a disabled control, never to hold the only
 * copy of something.
 */
import { Tooltip } from '@vuetify/v0/components';

withDefaults(
  defineProps<{
    text: string;
    /** Delay before showing, in ms. Long enough not to fire while passing over. */
    openDelay?: number;
    disabled?: boolean;
    positionArea?: string;
    /**
     * The activator's element. A `<button>` by default, which suits plain text. Wrapping something that is already
     * interactive (a link, a button) needs `span`: a disabled tooltip disables its `<button>` activator, and a
     * disabled button swallows every click on what is inside it.
     */
    as?: 'button' | 'span';
  }>(),
  { openDelay: 400, positionArea: undefined, as: 'button' },
);
</script>

<template>
  <Tooltip.Root :open-delay="openDelay" :disabled="disabled" :position-area="positionArea">
    <Tooltip.Activator :as="as" class="r-tooltip__activator">
      <slot />
    </Tooltip.Activator>
    <Tooltip.Content class="r-tooltip">{{ text }}</Tooltip.Content>
  </Tooltip.Root>
</template>

<style>
.r-tooltip__activator {
  display: inline-flex;
  /* v0 defaults Activator to <button>. Same reset as Popover/Menu so native
     light chrome does not show through in a dark themed subtree. */
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.r-tooltip {
  z-index: 90;
  max-width: 18rem;
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--r-sm);
  /* Inverted against the page rather than a bordered card: a tooltip is a
       transient annotation, and giving it card chrome makes it read as a panel. */
  background: var(--nd-ink-850);
  color: var(--nd-ink-0);
  font-family: var(--font-ui);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

:where([data-theme='dark'], .dark) .r-tooltip {
  background: var(--nd-ink-200);
  color: var(--nd-ink-950);
}
</style>
