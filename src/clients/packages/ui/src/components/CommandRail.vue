<script setup lang="ts">
/**
 * Horizontal command strip — Azure-style toolbar for page/table chrome.
 *
 * Holds command controls (link buttons, filters, selects) in groups separated
 * by a vertical rule. Place it anywhere a page needs a command row — typically
 * just above a DataTable. Domain-free: the rail does not know what a "New key"
 * is; callers compose Buttons and fields.
 *
 * Size and weight are forced at the rail so every child reads as `sm` /
 * regular regardless of what the author passed — a mixed-size toolbar is the
 * failure mode this exists to prevent.
 *
 * Field labels are hidden by default (pass `label` anyway for a11y / the
 * tooltip). Opt in with `showLabels`. When hidden, each field's label text is
 * mirrored onto the control as a native `title` tooltip — slotted fields cannot
 * be wrapped in `<Tooltip>` without knowing their structure.
 */
import { nextTick, onMounted, onUpdated, useTemplateRef, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Accessible name for the toolbar (required when the purpose is not obvious from surrounding copy). */
    ariaLabel?: string;
    /**
     * Show field labels beside controls. Off by default — placeholders carry
     * the cue; the label still feeds a11y and the hover/focus `title` tooltip.
     */
    showLabels?: boolean;
  }>(),
  { ariaLabel: undefined, showLabels: false },
);

const rootRef = useTemplateRef<HTMLElement>('root');

function labelText(labelEl: Element): string {
  // Strip the decorative required asterisk — it is aria-hidden in fields and
  // only adds noise to a tooltip.
  return (labelEl.textContent ?? '')
    .replace(/\s*\*\s*$/u, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function syncLabelTooltips() {
  const root = rootRef.value;
  if (!root) return;

  // Only direct group fields — not DatePickers inside a nested custom panel.
  for (const field of root.querySelectorAll<HTMLElement>(
    ':scope .r-command-rail__group > .r-field, :scope .r-command-rail__group > .r-date-range-selector',
  )) {
    const labelEl = field.querySelector(':scope > .r-field__label');
    const control = field.querySelector<HTMLElement>(':scope > .r-field__control');
    const target = control ?? field;
    const text = labelEl ? labelText(labelEl) : '';

    if (!props.showLabels && text) {
      target.setAttribute('title', text);
    } else {
      target.removeAttribute('title');
    }
  }
}

async function scheduleSync() {
  await nextTick();
  syncLabelTooltips();
}

onMounted(() => {
  void scheduleSync();
});
onUpdated(() => {
  void scheduleSync();
});
watch(
  () => props.showLabels,
  () => {
    void scheduleSync();
  },
);
</script>

<template>
  <div
    ref="root"
    class="r-command-rail"
    :class="{ 'r-command-rail--show-labels': showLabels }"
    role="toolbar"
    :aria-label="ariaLabel"
  >
    <slot />
  </div>
</template>

<style>
.r-command-rail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2) var(--sp-3);
  margin: 0;
  padding: 0;
  padding-block-end: var(--sp-2);
  /* Hairline under the strip so the rail reads as chrome above the content. */
  border-block-end: 1px solid var(--border-subtle);
  /* Regular weight for every control in the strip — medium shouts next to
     table data and Azure-style command bars stay light. */
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
  color: var(--fg-secondary);
}

/*
 * Force sm metrics on anything that lands in the rail. Callers should still
 * pass size="sm" for honesty; this is the backstop when they forget.
 *
 * Plain descendants — this block is unscoped, and Vue leaves `:deep()` as a
 * literal (invalid) selector when scoped:false, so those rules never matched.
 */
.r-command-rail .r-btn {
  height: 28px;
  padding: 0 var(--sp-3);
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
}

/* Link commands are the default action affordance in a rail — icon + label,
   quiet until hover, hit target still sm-tall. */
.r-command-rail .r-btn--link {
  padding: 0 var(--sp-2);
  color: var(--fg-secondary);
  border-radius: var(--r-sm);
}

.r-command-rail .r-btn--link:hover:not(:disabled) {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-command-rail .r-btn--icon-only {
  padding: 0;
  aspect-ratio: 1;
}

/* Density / mode toggles in the rail — same sm hit target as link commands. */
.r-command-rail .r-toggles {
  font-weight: var(--fw-regular);
}

.r-command-rail .r-toggles--sm .r-toggles__item,
.r-command-rail .r-toggles .r-toggles__item {
  height: 28px;
  padding: 0 var(--sp-2);
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
}

/* Three-dot (and similar) Menu activators — icon-only link chrome. */
.r-command-rail .r-menu__activator.r-command-rail__menu-trigger,
.r-command-rail .r-command-rail__menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 28px;
  aspect-ratio: 1;
  padding: 0;
  color: var(--fg-secondary);
  border-radius: var(--r-sm);
  cursor: pointer;
}

.r-command-rail .r-menu__activator.r-command-rail__menu-trigger:hover,
.r-command-rail .r-command-rail__menu-trigger:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

/*
 * Field chrome applies only to controls that are *direct* group children.
 * Descendant `.r-field`s (e.g. DatePickers inside DateRangeSelector's custom
 * panel) must not inherit `flex: 0 1 12rem` — in a column popover that basis
 * is height and stretches the panel.
 */
.r-command-rail__group > .r-field {
  /* Label beside the control when showLabels — a stacked label would double
     the rail height. nowrap is load-bearing: with wrap + a width cap, the
     control (native input min-width) wraps under the label. */
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--sp-2);
  /* Fixed preferred width as a group item — `flex: 1` would stretch each
     field to the full group width and force the next field onto a new row. */
  flex: 0 1 12rem;
  width: 12rem;
  min-width: 8rem;
  max-width: 18rem;
  box-sizing: border-box;
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
}

/* Single search filters in list blades — claim remaining rail width. */
.r-command-rail__group > .r-field.r-command-rail__field--grow {
  flex: 1 1 12rem;
  width: auto;
  max-width: none;
}

/* Chip / name filters that need more than a 12rem text box, without growing
   to the rail edge. */
.r-command-rail__group > .r-field.r-command-rail__field--wide {
  flex: 0 1 20rem;
  width: 20rem;
  min-width: 16rem;
  max-width: 24rem;
}

.r-command-rail__group > .r-field > .r-field__control,
.r-command-rail__group > .r-date-range-selector > .r-field__control {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  height: 28px;
  font-size: var(--fs-sm);
}

/*
 * MultiSelect in the rail stays one row: chips do not wrap (that would
 * double the strip). Extra selections collapse to “+N more”; a long chip
 * ellipsizes so the more-suffix and chevron stay visible.
 */
.r-command-rail__group > .r-multiselect .r-multiselect__chips {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  overflow: hidden;
}

.r-command-rail__group > .r-multiselect .r-multiselect__chip {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-command-rail__group > .r-multiselect .r-multiselect__more {
  flex: none;
}

.r-command-rail__group > .r-field > .r-field__label,
.r-command-rail__group > .r-date-range-selector > .r-field__label {
  flex: none;
  margin: 0;
  color: var(--fg-muted);
  font-weight: var(--fw-regular);
  white-space: nowrap;
}

/*
 * Labels off by default (match DataTable filter bars). Keep them in the tree
 * for a11y; clip rather than display:none so screen readers still find them.
 * Only the rail's own field labels — not labels inside a nested popover form.
 */
.r-command-rail:not(.r-command-rail--show-labels) .r-command-rail__group > .r-field > .r-field__label,
.r-command-rail:not(.r-command-rail--show-labels) .r-command-rail__group > .r-date-range-selector > .r-field__label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Rail chrome is not a form — keep hints/errors from forcing a second row. */
.r-command-rail__group > .r-field > .r-field__hint,
.r-command-rail__group > .r-field > .r-field__error,
.r-command-rail__group > .r-date-range-selector > .r-field__hint,
.r-command-rail__group > .r-date-range-selector > .r-field__error {
  display: none;
}

/*
 * DateRangePicker (dual fields) needs room for the from/to pair. Nested
 * pickers must not inherit the 16rem cap or the pair stacks inside the rail.
 */
.r-command-rail__group > .r-daterange {
  flex: 1 1 22rem;
  min-width: 20rem;
  max-width: 32rem;
}

.r-command-rail__group > .r-daterange .r-field {
  flex: 1 1 11rem;
  min-width: 0;
  max-width: none;
  width: auto;
}

/* DateRangePicker's inner row defaults to width:100%, which would wrap under
   the label; shrink it so "Range [from – to]" stays one inline cluster. */
.r-command-rail__group > .r-daterange .r-daterange__row {
  width: auto;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: nowrap;
}

/* DateRangeSelector is a single collapsed control — wider than a text filter,
   still one field tall. */
.r-command-rail__group > .r-date-range-selector {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: var(--sp-2);
  flex: 0 1 18rem;
  width: 18rem;
  min-width: 14rem;
  max-width: 22rem;
  box-sizing: border-box;
  font-size: var(--fs-sm);
  font-weight: var(--fw-regular);
}
</style>
