<script setup lang="ts">
import { Input } from '@vuetify/v0/components';
import { computed, shallowRef, useId } from 'vue';
import Icon from './Icon.vue';
import { useFocusShortcutTarget } from '../composables/useFocusShortcutTarget';

export type InputSize = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    label?: string;
    /** Help text under the field. Wired to aria-describedby by v0. */
    description?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    /** Validation rules — each returns `true` or a message. */
    rules?: ((value: unknown) => true | string)[];
    /** Forces the error state without a rule (server-side validation). */
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    /** Leading icon, e.g. `search` on a filter field. */
    icon?: string;
    /**
     * @deprecated Paints nothing. An editable field is now just a field; the
     * treatment moved to `readonly`, which is the state worth marking. Kept so
     * consumers keep compiling — remove it in a follow-up sweep.
     */
    editable?: boolean;
    /** Shows a clear control when the field has a value. Escape clears while focused. */
    clearable?: boolean;
    /**
     * Registers this field for Ctrl/Cmd+K and `/`. When several fields opt in,
     * the shortcut cycles them in document order.
     */
    focusShortcut?: boolean;
    /** Native autocomplete token, e.g. `cc-number`. */
    autocomplete?: string;
    /** Extra attributes on the native `<input>` (manager ignore flags, etc.). */
    inputAttrs?: Record<string, string | number | boolean | undefined>;
  }>(),
  {
    label: undefined,
    description: undefined,
    type: 'text',
    placeholder: undefined,
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
    icon: undefined,
    autocomplete: undefined,
    inputAttrs: undefined,
  },
);

/*
 * `string | undefined`, matching v0's InputRoot exactly rather than widening
 * to `string | number | null`. A native <input> hands back a string even when
 * type="number", so a number-typed model would be a lie that only shows up as
 * a runtime string where a number was expected. Callers that want a number
 * should parse at the boundary, or use NumberField once it is wrapped.
 */
const model = defineModel<string | undefined>();

/*
 * The id is generated here rather than left to v0 because the visible <label>
 * is ours: v0's `label` prop feeds aria-label only, it renders no element. We
 * need the same id on both sides to wire `for`/`id`, and useId() is
 * SSR-stable.
 */
const fieldId = useId();
const rootRef = shallowRef<unknown>(null);

useFocusShortcutTarget(() => props.focusShortcut === true, rootRef);

const showClear = computed(
  () =>
    props.clearable === true && !props.disabled && !props.readonly && model.value !== undefined && model.value !== '',
);

function clear() {
  model.value = undefined;
}

/**
 * Escape clears when there is a value. Empty fields let Escape bubble so a
 * surrounding blade/drawer can still dismiss. The clear button itself is
 * pointer-only (tabindex -1) — a second tab stop per filter field is noise.
 *
 * `type` MUST land on Input.Root (template below). v0's Input.Control builds
 * controlAttrs with `type: root.type` and mergeProps(attrs, controlAttrs) so
 * Root wins — a `:type` on Control alone is overwritten by Root's default
 * `"text"`. That made password fields (secret reveal/hide) always render as
 * plaintext.
 *
 * Keep this note out of the template: a leading HTML comment is a second root
 * node, so template refs resolve `$el` to the Comment and useFilterShortcut
 * silently fails to focus the field.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !showClear.value) return;
  event.preventDefault();
  clear();
}
</script>

<template>
  <Input.Root
    :id="fieldId"
    ref="rootRef"
    v-model="model"
    class="r-field"
    :class="[
      `r-field--${props.size}`,
      { 'r-field--editable': editable && !readonly, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
    :type="type"
    :label="label"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rules="rules"
    :error="error"
    :error-messages="errorMessages"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">
      {{ label }}
      <!-- aria-hidden: `required` on the control already announces this, and an
           asterisk read aloud as "star" is noise. -->
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <div class="r-field__control" @keydown="onKeydown">
      <Icon v-if="icon" class="r-field__icon" :name="icon" :size="14" />
      <Input.Control
        class="r-field__input"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        v-bind="inputAttrs"
      />
      <button
        v-if="showClear"
        type="button"
        class="r-field__clear"
        tabindex="-1"
        :aria-label="`Clear ${label ?? 'value'}`"
        @click="clear"
      >
        <Icon name="x" :size="14" />
      </button>
    </div>

    <Input.Description v-if="description" class="r-field__hint">{{ description }}</Input.Description>

    <Input.Error v-slot="{ errors }" class="r-field__error">
      <span v-for="message in errors" :key="message">{{ message }}</span>
    </Input.Error>
  </Input.Root>
</template>

<style>
.r-field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-family: var(--font-ui);
}

/*
 * Foreground by default, muted when the field cannot be changed.
 *
 * The fill alone is not a signal: --bg-surface to --bg-surface-2 is a ~2%
 * luminance step (#ffffff to #fafbfc), which is invisible on plenty of
 * monitors and inside a white panel. The label carries the distinction —
 * ink-900 to ink-600 — and the fill supports it. Marking the state on the
 * label rather than the control also means it reads on the controls whose
 * "field" is not a box at all: a chip row, a key/value table.
 *
 * CommandRail pins its own labels to --fg-muted, so a dense filter rail keeps
 * its quieter look and is unaffected by this.
 */
.r-field__label {
  color: var(--fg-primary);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

.r-field--readonly .r-field__label,
.r-field--disabled .r-field__label {
  color: var(--fg-muted);
}

.r-field__required {
  /* --error-ink, not --error: the plain hue measures 3.48:1 on the field
       background. Decorative or not, it is rendered text. */
  color: var(--error-ink);
}

.r-field__control {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0 var(--sp-2);
  border: 1px solid var(--border-input);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  transition:
    border-color var(--dur-fast) var(--ease-out),
    background-color var(--dur-fast) var(--ease-out);
}

.r-field__control:focus-within {
  border-color: var(--border-focus);
  /* The ring lives on the wrapper, not the <input>: the leading icon sits
       inside the box, so a ring on the input alone would cut through it. */
  outline: 1px solid var(--border-focus);
  outline-offset: -1px;
}

.r-field__icon {
  color: var(--fg-faint);
}

.r-field__clear {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: var(--sp-1);
  margin-inline-end: calc(var(--sp-1) * -1);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-faint);
  cursor: pointer;
}

.r-field__clear:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-field__affix {
  flex-shrink: 0;
  color: var(--fg-muted);
  font-family: var(--font-ui);
  white-space: nowrap;
  user-select: none;
}

.r-field__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--fg-primary);
  font: inherit;
  /* Data face for values, so an amount matches the table cells it came from
       (tabular figures included). */
  font-family: var(--font-data);
}

.r-field__input:focus {
  /* Suppressed here only — base.css's global :focus-visible ring is replaced
       by the :focus-within ring on the wrapper above, not removed outright. */
  outline: none;
}

.r-field__input::placeholder {
  color: var(--fg-faint);
}

.r-field--sm .r-field__control {
  height: 28px;
  font-size: var(--fs-sm);
}

.r-field--md .r-field__control {
  height: 34px;
  font-size: var(--fs-base);
}

.r-field--lg .r-field__control {
  height: 40px;
  font-size: var(--fs-md);
}

/*
 * An editable field is just a field: default border, focus ring when the user
 * reaches it, no fill. The tint that used to sit here decorated the case the
 * operator is actually there to act on, and needed a legend to read — so the
 * treatment moved to the other state, which is the one worth marking.
 *
 * `.r-field--editable` is still bound by every control so consumers keep
 * compiling; it now paints nothing. Remove the prop in a follow-up sweep.
 */

/*
 * Read-only: inert, but not disabled. The muted fill says "not a control";
 * the value itself stays at full contrast, because it is real data and dimming
 * it the way a disabled control is dimmed would cost readability across a
 * panel that is mostly read-only fields. No opacity and no not-allowed cursor
 * either — nothing here is refusing you, it simply is not an input.
 *
 * Same height as an editable control, so a column mixing the two does not
 * step up and down.
 */
.r-field--readonly .r-field__control {
  background: var(--bg-surface-2);
}

/*
 * The read-only face used by controls that cannot pass `readonly` to a native
 * input (see FieldReadonly.vue). Same 34px rhythm as the control it replaces,
 * so a column mixing read-only and editable rows does not step; the value keeps
 * full contrast because it is data, not a dimmed control.
 */
.r-field__readonly {
  background: var(--bg-surface-2);
  cursor: default;
}

.r-field__readonly-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--fg-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-field__readonly-empty {
  color: var(--fg-faint);
}

/*
 * The read-only value is a native `readonly` input, so it can be tabbed to and
 * copied (see FieldReadonly.vue). It has to READ as a value and not as an
 * input: the box, the fill and the border all belong to the wrapper, and this
 * contributes nothing but the text.
 */
.r-field__readonly-input {
  border: 0;
  background: none;
  padding: 0;
  color: var(--fg-primary);
  font: inherit;
  /* Not `default`: the caret cursor is the affordance that says the text can
     be selected, which is the whole point of it being an input. */
  cursor: text;
}

/* The ring belongs on the wrapper (below), so the inner element does not paint
   its own inside it. Overrides base.css's system-wide :focus-visible, which is
   allowed to be overridden only when the ring is moved, not removed. */
.r-field__readonly-value:focus,
.r-field__readonly-value:focus-visible {
  outline: none;
}

.r-field__readonly-input::placeholder {
  color: var(--fg-faint);
  /* Firefox dims placeholders on top of the colour. */
  opacity: 1;
}

/*
 * The ring goes on the wrapper, not the value, so a focused read-only field is
 * outlined at the same box as a focused editable one.
 *
 * `:has(:focus-visible)` and not `:focus-within`: the latter fires on a mouse
 * click too, and base.css's rule for the whole system is that a pointer does
 * not paint a ring.
 */
.r-field__readonly:has(:focus-visible) {
  outline: 1px solid var(--border-focus);
  outline-offset: -1px;
}

.r-field--disabled .r-field__control {
  background: var(--bg-surface-3);
  opacity: 0.7;
  cursor: not-allowed;
}

.r-field__hint {
  color: var(--ets-hint-text);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

.r-field__error {
  display: flex;
  flex-direction: column;
  color: var(--ets-error-text);
  font-size: var(--fs-xs);
  line-height: var(--lh-snug);
}

/* v0 always renders Input.Error so its aria-live region exists before an
     error arrives — an aria-live region inserted at the same time as its
     content is not reliably announced. Empty, it must take no space. */
.r-field__error:empty {
  display: none;
}

.r-field:has(.r-field__error:not(:empty)) .r-field__control {
  border-color: var(--error);
}
</style>
