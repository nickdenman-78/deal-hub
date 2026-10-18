<script setup lang="ts">
/**
 * Status / count indicator. Wrap a control to pin it as a corner mark
 * (unread count on a messages icon), or render alone as a pill.
 *
 * Numbers honour `max` (`120` with `max={99}` → `99+`). Zero and empty
 * content hide the mark unless `dot` is set. Solid fills only — a soft
 * tint is too quiet for a corner chip.
 */
import { computed, useSlots } from 'vue';
import { formatBadgeContent } from './badge';
import type { Severity } from '../severity';

export type BadgePosition = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

const props = withDefaults(
  defineProps<{
    /** Count or short label. Numbers use `max`; `0` / empty hides the mark. */
    content?: string | number | null;
    /** Cap for numeric content — e.g. `99` shows `99+` when content is larger. */
    max?: number;
    severity?: Severity;
    /**
     * Small filled dot with no label. Useful for "something is new" without a
     * count. Shown even when `content` is empty.
     */
    dot?: boolean;
    /** Corner when wrapping a host. Ignored for a standalone badge. */
    position?: BadgePosition;
    /** Accessible name for the mark (defaults from the visible label). */
    label?: string;
  }>(),
  {
    content: undefined,
    max: undefined,
    severity: 'error',
    position: 'top-end',
    label: undefined,
  },
);

const slots = useSlots();
const hasHost = computed(() => Boolean(slots.default));

const markText = computed(() => formatBadgeContent(props.content, props.max));
const showMark = computed(() => props.dot === true || markText.value !== null);

const ariaLabel = computed(() => {
  if (props.label !== undefined) return props.label;
  if (props.dot && markText.value === null) return 'Indicator';
  return markText.value ?? undefined;
});
</script>

<template>
  <span
    class="r-badge"
    :class="{
      'r-badge--alone': !hasHost,
      [`r-badge--${position}`]: hasHost,
    }"
  >
    <span v-if="hasHost" class="r-badge__host">
      <slot />
    </span>
    <span
      v-if="showMark"
      class="r-badge__mark"
      :class="[`r-severity-${severity}`, { 'r-badge__mark--dot': dot && markText === null }]"
      :aria-label="ariaLabel"
      :aria-hidden="ariaLabel ? undefined : true"
      role="status"
    >
      <span v-if="markText !== null" class="r-badge__label">{{ markText }}</span>
    </span>
  </span>
</template>

<style>
.r-badge {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
  flex: none;
}

.r-badge__host {
  display: inline-flex;
  max-width: 100%;
}

.r-badge__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 1.125rem;
  height: 1.125rem;
  padding: 0 5px;
  border-radius: var(--r-pill);
  /* Ring so the mark stays readable on both light and dark hosts. */
  box-shadow: 0 0 0 2px var(--bg-app);
  background: var(--sev-fill);
  color: var(--sev-on);
  font-family: var(--font-ui);
  font-size: 0.625rem;
  font-weight: var(--fw-semibold);
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

.r-badge__mark--dot {
  min-width: 0.5rem;
  width: 0.5rem;
  height: 0.5rem;
  padding: 0;
}

.r-badge__label {
  translate: 0 0.5px;
}

/* Anchored corners — slight overlap so the mark reads as a super/subscript. */
.r-badge--top-end .r-badge__mark {
  position: absolute;
  top: 0;
  right: 0;
  translate: 40% -40%;
}

.r-badge--top-start .r-badge__mark {
  position: absolute;
  top: 0;
  left: 0;
  translate: -40% -40%;
}

.r-badge--bottom-end .r-badge__mark {
  position: absolute;
  right: 0;
  bottom: 0;
  translate: 40% 40%;
}

.r-badge--bottom-start .r-badge__mark {
  position: absolute;
  bottom: 0;
  left: 0;
  translate: -40% 40%;
}

.r-badge--alone .r-badge__mark {
  position: static;
  translate: none;
}
</style>
