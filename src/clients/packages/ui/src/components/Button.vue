<script setup lang="ts">
import { Button } from '@vuetify/v0/components';
import { computed, getCurrentInstance, useSlots, watchEffect } from 'vue';
import type { Severity } from '../severity';
import Icon from './Icon.vue';

export type ButtonSeverity = Severity;
export type ButtonVariant = 'basic' | 'link' | 'text' | 'raised' | 'raisedText' | 'outlined';
export type ButtonSize = 'sm' | 'md' | 'lg';
/** Label weight. `regular` is for command rails and other quiet chrome. */
export type ButtonWeight = 'regular' | 'medium';

const props = withDefaults(
  defineProps<{
    /** Colour / intent. Default `secondary` — a screen of primaries has no primary. */
    severity?: ButtonSeverity;
    /** Visual treatment. Default `basic` is filled with the severity colour. */
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Label weight. Default `medium`; pass `regular` for non-bold chrome. */
    weight?: ButtonWeight;
    /** Leading icon name (Lucide, unprefixed). */
    icon?: string;
    /** Trailing icon — chevrons on menu triggers, external-link on links. */
    iconEnd?: string;
    disabled?: boolean;
    /**
     * Shows the spinner and blocks activation. v0 holds a grace period before
     * the spinner appears, so a request that resolves in 80ms does not flash
     * one — see `grace`.
     */
    loading?: boolean;
    /**
     * The button's action is running: the button disables, announces
     * `aria-busy`, and its label and icon fade in and out — no spinner. This
     * is the house busy style. A fade survives Windows' "Animation effects:
     * off" where a rotating spinner freezes, and keeping the label in view
     * tells the operator which action is running. Shows immediately; there is
     * no grace period.
     */
    busy?: boolean;
    /** Grace period in ms before the loading state becomes visible. */
    grace?: number;
    /** Stretches to the container's width — for stacked dialog footers. */
    block?: boolean;
    /**
     * Required when the button renders as icon-only. v0 warns in dev if a
     * solo Button.Icon has no label on the root, and an unlabelled icon
     * button is unusable with a screen reader.
     */
    ariaLabel?: string;
    /** Element or component to render as. `a` / RouterLink for navigation. */
    as?: string | object;
  }>(),
  {
    severity: 'secondary',
    variant: 'basic',
    size: 'md',
    weight: 'medium',
    icon: undefined,
    iconEnd: undefined,
    grace: 200,
    ariaLabel: undefined,
    as: undefined,
  },
);

const slots = useSlots();

/*
 * Icon-only is inferred rather than declared, because a caller passing
 * `icon` with no children always means the same thing and a separate
 * `iconOnly` prop would just be a second source of truth that can disagree.
 */
const isIconOnly = computed(() => Boolean(props.icon) && !slots.default);

const variantClass = computed(() =>
  props.variant === 'raisedText' ? 'r-btn--raised-text' : `r-btn--${props.variant}`,
);

const classes = computed(() => [
  'r-btn',
  `r-severity-${props.severity}`,
  variantClass.value,
  `r-btn--${props.size}`,
  `r-btn--weight-${props.weight}`,
  { 'r-btn--block': props.block, 'r-btn--icon-only': isIconOnly.value, 'r-btn--busy': props.busy },
]);

/*
 * This component is MULTI-ROOT: v0's Button.Root renders the <button> plus a
 * placeholder for its optional hidden form input. A template ref on <Button>
 * therefore yields the component instance, not an element — so `ref.value.focus()`
 * throws "focus is not a function" rather than failing visibly. That cost a
 * real bug in BladeAside, where focus silently never entered the panel and
 * Escape closed the blade behind it instead.
 *
 * Exposing focus()/el() makes a ref behave the way callers expect. `el` is
 * resolved lazily from the instance's root node rather than held as a
 * template ref, because a fragment root cannot carry one.
 */
const self = getCurrentInstance();

function el(): HTMLButtonElement | null {
  const node = self?.proxy?.$el as Node | null | undefined;
  if (node instanceof HTMLButtonElement) return node;
  // A fragment's $el is its first node, which is the anchor comment; the
  // button is the next element sibling.
  let next = node?.nextSibling ?? null;
  while (next && !(next instanceof HTMLButtonElement)) next = next.nextSibling;
  return next;
}

defineExpose({
  el,
  focus: (options?: FocusOptions) => el()?.focus(options),
});

/*
 * v0's Button.Root binds `aria-busy` from its own `loading` state and merges it
 * over fallthrough, so a template binding is discarded. Vue only re-patches the
 * attribute when v0's value changes, so writing it after render sticks.
 */
watchEffect(
  () => {
    const button = el();
    if (!button || props.loading) return;
    if (props.busy) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  },
  { flush: 'post' },
);
/*
 * THIS BUTTON CANNOT CARRY AN AUTHOR `aria-pressed`, so do not build a toggle
 * out of it.
 *
 * v0's Button.Root sets `aria-pressed: group ? isSelected : undefined` and
 * merges its own attrs AFTER fallthrough, so outside a v0 ButtonGroup it
 * overwrites whatever the caller passed with `undefined` — and Vue then drops
 * the attribute entirely. The button renders, any `[aria-pressed]` styling
 * silently never matches, and assistive tech is never told it is a toggle.
 * Other fallthrough attributes (`title`, `data-*`) are unaffected.
 *
 * For a pressed/unpressed control use ToggleGroup, which is built on v0's
 * Toggle and does emit aria-pressed, or a plain <button> — see
 * @ets/editor's SimpleMarkdownEditor toolbar.
 */
</script>

<template>
  <Button.Root
    :class="classes"
    :disabled="disabled || busy"
    :loading="loading"
    :grace="grace"
    :aria-label="ariaLabel"
    :as="as"
  >
    <!-- Loading and Content are siblings, not a v-if/v-else: v0 registers both
         with the root's internal selection and swaps them once the grace period
         elapses. Collapsing them into a conditional would lose the grace. -->
    <Button.Loading>
      <span class="r-btn__spinner" />
    </Button.Loading>

    <!--
      Both wrappers carry a class of ours, and that is what makes the icon line
      up with the label. v0 renders Content as a plain <span> with no class and
      no data attribute, so `.r-btn`'s flex/gap/align-items governed Content as a
      single child and never reached inside it: the icon and label fell back to
      INLINE layout and sat on the text baseline, leaving the label about 2px
      below the icon. Content has to be the flex container itself.
    -->
    <Button.Content class="r-btn__content">
      <Button.Icon v-if="icon" class="r-btn__icon">
        <Icon :name="icon" :size="size === 'lg' ? 18 : 16" />
      </Button.Icon>

      <span v-if="$slots.default" class="r-btn__label"><slot /></span>

      <Button.Icon v-if="iconEnd" class="r-btn__icon">
        <Icon :name="iconEnd" :size="size === 'lg' ? 18 : 16" />
      </Button.Icon>
    </Button.Content>
  </Button.Root>
</template>

<style>
.r-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  line-height: 1;
  /* Rendered as a link (as="a" or a RouterLink), it must not pick up the global link underline. */
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}

.r-btn--weight-medium {
  font-weight: var(--fw-medium);
}

.r-btn--weight-regular {
  font-weight: var(--fw-regular);
}

.r-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/*
 * A busy button is working, not unavailable. Callers commonly disable while
 * loading as well, and the faded disabled treatment then made the spinner
 * read as a dead control.
 */
.r-btn[data-loading]:disabled,
.r-btn--busy:disabled {
  cursor: progress;
  opacity: 1;
}

/*
 * Busy: the content fades rather than a spinner turning. `!important` lets the
 * fade outlive base.css's reduced-motion rule, which flattens every animation
 * to 0.01ms — a fade is the motion-safe signal that rule is there to keep.
 */
.r-btn--busy .r-btn__content {
  animation: r-btn-busy 1.4s ease-in-out infinite !important;
}

@keyframes r-btn-busy {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 1;
  }
}

/* --- Sizes. Heights are on the 4px grid so buttons line up with inputs in a
         toolbar without per-site nudging. --- */
.r-btn--sm {
  height: 28px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-sm);
}

.r-btn--md {
  height: 34px;
  padding: 0 var(--sp-4);
  font-size: var(--fs-base);
}

.r-btn--lg {
  height: 40px;
  padding: 0 var(--sp-5);
  font-size: var(--fs-md);
}

.r-btn--icon-only {
  padding: 0;
  aspect-ratio: 1;
}

.r-btn--block {
  display: flex;
  width: 100%;
}

/* --- Variants. Colour comes from `.r-severity-*` (`--sev-*`); these recipes
     only pick which of those tokens become border / fill / ink / shadow. --- */

/* Filled, no shadow. --sev-fill (not --sev-hue): white on the plain hue
     measures ~2.5:1 and fails AA. */
.r-btn--basic {
  border-color: var(--sev-fill);
  background: var(--sev-fill);
  color: var(--sev-on);
}

.r-btn--basic:hover:not(:disabled) {
  filter: brightness(1.12);
}

/* Raised. Hover lifts further rather than using filter:brightness, which
     would flatten the shadow into the fill. Do not use a negative spread —
     Material's `-2px` tucks the umbra under the chip and the lift vanishes. */

/* Filled chip. Denser/tighter than raisedText: a soft gray ambient around a
     saturated fill is easy to miss, so the contact edge has to be darker. */
.r-btn--raised {
  --btn-raise: 0 2px 2px rgb(0 0 0 / 45%), 0 5px 10px rgb(0 0 0 / 22%);
  --btn-raise-hover: 0 3px 3px rgb(0 0 0 / 48%), 0 8px 16px rgb(0 0 0 / 24%);
  border-color: var(--sev-fill);
  background: var(--sev-fill);
  color: var(--sev-on);
  box-shadow: var(--btn-raise);
}

.r-btn--raised:hover:not(:disabled) {
  box-shadow: var(--btn-raise-hover);
}

/* White chip, coloured label. Soft drop, no hairline — the shadow is the
     silhouette. This is the signed-off light-mode look. */
.r-btn--raised-text {
  --btn-raise: 0 2px 3px rgb(0 0 0 / 32%), 0 6px 14px rgb(0 0 0 / 18%);
  --btn-raise-hover: 0 3px 4px rgb(0 0 0 / 34%), 0 10px 20px rgb(0 0 0 / 20%);
  border-color: transparent;
  background: var(--bg-surface);
  color: var(--sev-ink);
  box-shadow: var(--btn-raise);
}

.r-btn--raised-text:hover:not(:disabled) {
  background: var(--bg-surface-2);
  box-shadow: var(--btn-raise-hover);
}

/* Dark: same physical model as light (darker well under the chip) plus a
     light rim so the top edge still reads on --bg-app. */
:where([data-theme='dark'], .dark) .r-btn--raised {
  --btn-raise: inset 0 1px 0 rgb(255 255 255 / 22%), 0 2px 2px rgb(0 0 0 / 80%), 0 6px 14px rgb(0 0 0 / 55%);
  --btn-raise-hover: inset 0 1px 0 rgb(255 255 255 / 28%), 0 3px 3px rgb(0 0 0 / 85%), 0 10px 20px rgb(0 0 0 / 60%);
}

:where([data-theme='dark'], .dark) .r-btn--raised-text {
  --btn-raise: inset 0 1px 0 rgb(255 255 255 / 16%), 0 2px 3px rgb(0 0 0 / 75%), 0 8px 18px rgb(0 0 0 / 50%);
  --btn-raise-hover: inset 0 1px 0 rgb(255 255 255 / 22%), 0 3px 4px rgb(0 0 0 / 80%), 0 12px 24px rgb(0 0 0 / 55%);
}

.r-btn--outlined {
  border-color: var(--sev-hue);
  background: var(--bg-surface);
  color: var(--sev-ink);
}

.r-btn--outlined:hover:not(:disabled) {
  background: var(--bg-surface-2);
}

/* Quiet chrome: a delete in a table row, a close on a dialog. Colour only
     on the label; a filled button would dominate the data it acts on. */
.r-btn--text {
  background: transparent;
  color: var(--sev-ink);
}

.r-btn--text:hover:not(:disabled) {
  background: var(--sev-soft);
}

/* A button that looks like a link — command-rail actions and inline table
     cells, where a bordered button would out-shout the data. Colour alone
     carries the affordance; an underline fights neighbouring body copy. */
.r-btn--link {
  height: auto;
  padding: 0;
  background: none;
  color: var(--sev-ink);
  text-decoration: none;
}

.r-btn--link:hover:not(:disabled) {
  color: var(--sev-fill);
}

/* --- Content / loading --- */
/*
 * `.r-btn__content`, not `[data-v0-button-content]` — v0 emits no such
 * attribute, so the old selector matched nothing and this rule never ran. That
 * is why the icon and label were baseline-aligned rather than centred.
 */
.r-btn__content,
.r-btn__label {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

/*
 * The icon wrapper must be a flex item in its own right. Left inline, the SVG
 * inside it keeps `.r-icon`'s `vertical-align: -0.125em` — correct for an icon
 * sitting in a sentence, wrong for one centred against a label — and
 * vertical-align is simply ignored once the wrapper is a flex item.
 */
.r-btn__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
}

.r-btn__spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentcolor;
  /* Transparent right edge is what makes the ring read as spinning; a full
       ring animates invisibly. */
  border-right-color: transparent;
  border-radius: var(--r-pill);
  animation: r-btn-spin 620ms linear infinite;
}

/*
 * v0 hides the content with `visibility: hidden`, so it still holds the
 * button's width. Laid out as a flex sibling the spinner sat at the far left
 * of an empty-looking button; overlaying it keeps it centred and the width
 * unchanged.
 */
.r-btn[data-loading] > .r-btn__spinner {
  position: absolute;
  inset: 0;
  margin: auto;
}

@keyframes r-btn-spin {
  to {
    transform: rotate(360deg);
  }
}

/*
 * Keep a visible busy signal when base.css suppresses rotation. These rules
 * must stay at the top level: nested inside @keyframes they are invalid CSS,
 * the browser drops them, and the spinner freezes as a static ring whenever
 * the OS has animation effects turned off.
 */
@media (prefers-reduced-motion: reduce) {
  .r-btn__spinner {
    animation: r-btn-pulse 1.4s ease-in-out infinite !important;
  }
}

@keyframes r-btn-pulse {
  0%,
  100% {
    opacity: 0.35;
  }

  50% {
    opacity: 1;
  }
}
</style>
