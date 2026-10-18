<script setup lang="ts">
/**
 * Technical cron editor — one segment per field, like Ipv4Editor.
 *
 * Blurred it shows a human-readable schedule (cronstrue). Focused it expands
 * into the parts editor: five standard fields plus an optional leading seconds
 * segment. Frequency presets belong on ScheduleEditor (for end users).
 *
 * The model is the expression string. Invalid intermediate states are emitted
 * as typed (same reason as Ipv4Editor) so a parent validator sees what is in
 * the boxes.
 */
import { computed, nextTick, ref, useId, watch } from 'vue';
import { focusablesIn } from '../composables/useFocusTrap';
import Icon from './Icon.vue';
import Popover from './Popover.vue';
import {
  CRON_FIELDS,
  cronError,
  describeCron,
  joinCron,
  nextOccurrences,
  splitCron,
  type CronFieldKey,
  type CronParts,
} from './cron';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    disabled?: boolean;
    /** Prose-only: no parts editor, and the editable tint is suppressed. */
    readonly?: boolean;
    required?: boolean;
    editable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    /**
     * Info control on the right: popover with the next five fire times.
     * Disabled while the expression is blank or invalid.
     */
    showOccurrences?: boolean;
  }>(),
  { label: undefined, description: undefined, size: 'md', showOccurrences: true },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const ariaDescribedBy = computed(
  () => [props.description ? describedBy : undefined, errorId].filter(Boolean).join(' ') || undefined,
);

const EMPTY: CronParts = {
  second: '',
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

const BLANK: CronParts = {
  second: '',
  minute: '',
  hour: '',
  dayOfMonth: '',
  month: '',
  dayOfWeek: '',
};

const parts = ref<CronParts>({ ...EMPTY });
const boxes = ref<(HTMLInputElement | null)[]>([]);
const openField = ref<CronFieldKey | null>(null);
const activeOption = ref(0);
const rootRef = ref<HTMLElement | null>(null);
/** Parts editor while focused; human-readable summary when blurred. */
const editing = ref(false);
/** True while we are programmatically moving focus out — blocks summary re-entry. */
let leaving = false;
let blurTimer: ReturnType<typeof setTimeout> | null = null;

function setBoxRef(index: number, el: unknown) {
  if (el instanceof HTMLInputElement) boxes.value[index] = el;
  else boxes.value[index] = null;
}

function compose(): string {
  return joinCron(parts.value);
}

/** Core five fields blank — seconds alone does not count as a filled schedule. */
function isBlankParts(value: CronParts): boolean {
  return [value.minute, value.hour, value.dayOfMonth, value.month, value.dayOfWeek].every((part) => part.trim() === '');
}

/*
 * Incoming values fill the boxes only when they differ from what the boxes
 * already spell — otherwise every keystroke round-trips and resets the caret.
 */
watch(
  model,
  (next) => {
    if ((next ?? '') === compose()) return;
    const raw = (next ?? '').trim();
    if (raw === '') {
      parts.value = { ...BLANK };
      return;
    }
    const parsed = splitCron(next);
    parts.value = parsed ? { ...parsed } : { ...EMPTY };
  },
  { immediate: true },
);

function emit() {
  // Blank boxes stay blank in the model so `required` can see an empty field.
  model.value = isBlankParts(parts.value) ? '' : compose();
}

function focusBox(index: number, select = true) {
  const el = boxes.value[index];
  if (!el) return;
  el.focus();
  if (select) el.select();
}

function openMenu(key: CronFieldKey) {
  openField.value = key;
  const field = CRON_FIELDS.find((entry) => entry.key === key);
  const current = parts.value[key];
  const idx = field?.options.findIndex((opt) => opt.value === current) ?? -1;
  activeOption.value = idx >= 0 ? idx : 0;
}

function closeMenu() {
  openField.value = null;
}

function onFieldInput(key: CronFieldKey, event: Event) {
  const el = event.target as HTMLInputElement;
  // Fields may contain `*`, `-`, `,`, `/` and digits — strip whitespace only.
  const cleaned = el.value.replace(/\s+/g, '');
  parts.value = { ...parts.value, [key]: cleaned };
  el.value = cleaned;
  emit();
  openMenu(key);
}

function pick(key: CronFieldKey, value: string) {
  parts.value = { ...parts.value, [key]: value };
  emit();
  closeMenu();
  const index = CRON_FIELDS.findIndex((field) => field.key === key);
  void nextTick(() => focusBox(index, true));
}

function onFieldFocus(key: CronFieldKey, event: FocusEvent) {
  (event.target as HTMLInputElement).select();
  openMenu(key);
}

function onFieldBlur(key: CronFieldKey) {
  // Delay so a mousedown on an option can fire before the menu unmounts.
  window.setTimeout(() => {
    if (openField.value === key) closeMenu();
  }, 120);
}

function filteredOptions(key: CronFieldKey) {
  const field = CRON_FIELDS.find((entry) => entry.key === key);
  if (!field) return [];
  const query = parts.value[key].trim().toLowerCase();
  if (query === '' || query === '*') return [...field.options];
  return field.options.filter(
    (opt) =>
      opt.value.toLowerCase().includes(query) ||
      opt.label.toLowerCase().includes(query) ||
      (opt.value === '' && 'omit'.includes(query)),
  );
}

function optionsForOpenField() {
  return openField.value ? filteredOptions(openField.value) : [];
}

watch(
  () => [openField.value, openField.value ? parts.value[openField.value] : ''] as const,
  () => {
    const options = optionsForOpenField();
    if (activeOption.value >= options.length) activeOption.value = Math.max(0, options.length - 1);
  },
);

/*
 * Keep the highlighted row in the scrollport while arrowing through a long
 * suggestion list — without this the active class moves off-screen and the
 * keyboard feels broken.
 */
watch([activeOption, openField], async () => {
  if (openField.value === null) return;
  await nextTick();
  const active = rootRef.value?.querySelector('.r-cron__option--active');
  if (active instanceof HTMLElement) {
    active.scrollIntoView({ block: 'nearest' });
  }
});

function onFieldKeydown(index: number, key: CronFieldKey, event: KeyboardEvent) {
  const el = event.target as HTMLInputElement;
  const options = filteredOptions(key);

  /*
   * Tab walks segments explicitly. Native tab order alone is unreliable here:
   * each segment is a combobox with an open listbox, and the info popover
   * activator can sit in the tab sequence after day-of-week. From the ends,
   * jump straight to the next control outside the shell.
   */
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (index > 0) {
        event.preventDefault();
        closeMenu();
        focusBox(index - 1, true);
        return;
      }
      // First field (seconds): leave to the previous page tab stop. Only
      // preventDefault when we actually moved focus — otherwise the browser
      // must keep its native Shift+Tab (preventDefault-with-no-move traps).
      if (leaveEditor(true)) event.preventDefault();
      return;
    }
    if (index < CRON_FIELDS.length - 1) {
      event.preventDefault();
      closeMenu();
      focusBox(index + 1, true);
      return;
    }
    if (leaveEditor(false)) event.preventDefault();
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (openField.value !== key) openMenu(key);
    else if (options.length > 0) activeOption.value = (activeOption.value + 1) % options.length;
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (openField.value !== key) openMenu(key);
    else if (options.length > 0) {
      activeOption.value = (activeOption.value - 1 + options.length) % options.length;
    }
    return;
  }
  if (event.key === 'Enter' && openField.value === key && options[activeOption.value]) {
    event.preventDefault();
    pick(key, options[activeOption.value]!.value);
    return;
  }
  if (event.key === 'Escape') {
    if (openField.value === key) {
      event.preventDefault();
      closeMenu();
    }
    return;
  }

  // Space advances when the field already has a value — typing a leading space
  // into an empty box is noise, not an advance. Optional seconds may be empty
  // on purpose; Space still advances from there so Tab isn't required.
  if (event.key === ' ' || event.key === 'Spacebar') {
    const field = CRON_FIELDS[index];
    if (el.value !== '' || field?.optional) {
      event.preventDefault();
      closeMenu();
      if (index < CRON_FIELDS.length - 1) focusBox(index + 1);
    }
    return;
  }

  if (event.key === 'Backspace' && el.value === '' && index > 0) {
    event.preventDefault();
    closeMenu();
    focusBox(index - 1, false);
    const prev = boxes.value[index - 1];
    if (prev) prev.setSelectionRange(prev.value.length, prev.value.length);
    return;
  }
  if (event.key === 'ArrowLeft' && el.selectionStart === 0 && index > 0) {
    event.preventDefault();
    closeMenu();
    focusBox(index - 1, false);
    return;
  }
  if (event.key === 'ArrowRight' && el.selectionStart === el.value.length && index < CRON_FIELDS.length - 1) {
    event.preventDefault();
    closeMenu();
    focusBox(index + 1, false);
  }
}

/** Modal overlays that trap Tab — stay inside them when leaving the field. */
function tabScope(from: HTMLElement): HTMLElement {
  return from.closest<HTMLElement>('dialog, [role="dialog"]') ?? document.body;
}

/**
 * Move focus to the nearest tab stop outside the editor shell (skipping the
 * info activator and every segment). Returns whether focus moved.
 *
 * Collapse immediately after locating the target so destroying the focused
 * segment cannot bounce focus onto the summary and re-expand the editor.
 */
function leaveEditor(backward: boolean): boolean {
  closeMenu();
  const root = rootRef.value;
  const active = document.activeElement;
  if (!root || !(active instanceof HTMLElement) || !root.contains(active)) return false;

  const items = focusablesIn(tabScope(root));
  const start = items.indexOf(active);
  let target: HTMLElement | undefined;

  if (backward) {
    const from = start === -1 ? items.length : start;
    for (let i = from - 1; i >= 0; i--) {
      const el = items[i]!;
      if (!root.contains(el)) {
        target = el;
        break;
      }
    }
  } else {
    for (let i = (start === -1 ? -1 : start) + 1; i < items.length; i++) {
      const el = items[i]!;
      if (!root.contains(el)) {
        target = el;
        break;
      }
    }
  }

  if (!target) return false;

  leaving = true;
  clearBlurTimer();
  target.focus();
  editing.value = false;
  requestAnimationFrame(() => {
    leaving = false;
  });
  return true;
}

/*
 * Pasting a whole expression into any box fills every segment. Without this,
 * pasting "0 9 * * 1-5" into minute leaves a single invalid field.
 */
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? '';
  if (!/\s/.test(text.trim())) return;
  const parsed = splitCron(text);
  if (!parsed) return;
  event.preventDefault();
  parts.value = { ...parsed };
  emit();
  closeMenu();
}

const error = computed(() => {
  if (isBlankParts(parts.value) || (model.value ?? '').trim() === '') return null;
  return cronError(model.value);
});

const summary = computed(() => {
  if (isBlankParts(parts.value) || error.value !== null) return '';
  return describeCron(model.value);
});

/** Collapsed face: prose when valid, raw expression when invalid, placeholder when empty. */
const collapsedText = computed(() => {
  if (isBlankParts(parts.value) || (model.value ?? '').trim() === '') return 'Set a schedule…';
  if (summary.value !== '') return summary.value;
  return model.value ?? '';
});

const occurrences = computed(() => {
  if (error.value !== null || isBlankParts(parts.value)) return [];
  return nextOccurrences(model.value, 5);
});

const occurrencesEnabled = computed(() => occurrences.value.length > 0);
const occurrencesOpen = ref(false);
const expressionCopied = ref(false);
let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

/** Raw expression shown in the info popover (valid schedules only). */
const expression = computed(() => {
  if (error.value !== null || isBlankParts(parts.value)) return '';
  return (model.value ?? '').trim();
});

watch(occurrencesEnabled, (ok) => {
  if (!ok) occurrencesOpen.value = false;
});

watch(occurrencesOpen, (open) => {
  if (open) return;
  expressionCopied.value = false;
  if (copyResetTimer !== null) {
    clearTimeout(copyResetTimer);
    copyResetTimer = null;
  }
});

async function copyExpression() {
  const text = expression.value;
  if (text === '') return;
  try {
    await navigator.clipboard.writeText(text);
    expressionCopied.value = true;
    if (copyResetTimer !== null) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyResetTimer = null;
      expressionCopied.value = false;
    }, 1500);
  } catch {
    expressionCopied.value = false;
  }
}
watch(
  () => props.readonly,
  (ro) => {
    if (!ro) return;
    closeMenu();
    editing.value = false;
  },
);

function formatOccurrence(when: Date): string {
  return when.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Alt+ArrowDown opens upcoming runs from any focused box (when valid). */
function onControlKeydown(event: KeyboardEvent) {
  if (!(event.altKey && event.key === 'ArrowDown')) return;
  if (!props.showOccurrences || props.disabled || !occurrencesEnabled.value) return;
  event.preventDefault();
  occurrencesOpen.value = true;
}

function clearBlurTimer() {
  if (blurTimer !== null) {
    clearTimeout(blurTimer);
    blurTimer = null;
  }
}

function enterEdit() {
  if (props.disabled || props.readonly) return;
  clearBlurTimer();
  editing.value = true;
  void nextTick(() => {
    // Prefer the first filled core field, else minute (index 1 — after optional seconds).
    const prefer = parts.value.minute !== '' ? 1 : 0;
    focusBox(prefer, true);
  });
}

/**
 * Expand on focus once Tab has finished landing on the summary. Doing this
 * synchronously in the summary's focus handler destroys the focused button
 * mid-Tab and leaks focus past every segment. Readonly stays on the prose.
 */
function onRootFocusIn(event: FocusEvent) {
  clearBlurTimer();
  if (leaving || props.readonly || props.disabled || editing.value) return;
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains('r-cron__collapsed')) return;
  void nextTick(() => {
    if (leaving || props.readonly || editing.value) return;
    enterEdit();
  });
}

function onRootFocusOut(event: FocusEvent) {
  if (focusStaysWithField(event.relatedTarget)) return;
  // Delay so a suggestion mousedown can apply before the parts editor unmounts.
  clearBlurTimer();
  blurTimer = setTimeout(() => {
    blurTimer = null;
    if (focusStaysWithField(document.activeElement)) return;
    closeMenu();
    occurrencesOpen.value = false;
    editing.value = false;
  }, 120);
}

/**
 * Focus is still "on the field" when it is inside the shell or inside our
 * info popover (including CSS top-layer `:popover-open` panels).
 */
function focusStaysWithField(node: EventTarget | null): boolean {
  if (!(node instanceof Node) || !rootRef.value) return false;
  if (rootRef.value.contains(node)) return true;
  if (!(node instanceof Element)) return false;
  const panel = node.closest('.r-popover');
  return Boolean(panel && (rootRef.value.contains(panel) || panel.matches(':popover-open')));
}

/**
 * Width in `ch` for a segment. Sized to the longer of value and placeholder,
 * plus a digit of headroom — same reason as Ipv4Editor: input padding eats
 * into the border box and an exact `Nch` clips the last character.
 */
function fieldWidth(key: CronFieldKey, placeholder: string): number {
  const text = parts.value[key] || placeholder;
  return Math.max(text.length, 1) + 1;
}
</script>

<template>
  <div
    ref="rootRef"
    class="r-field r-cron"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable && !readonly, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
    @focusin="onRootFocusIn"
    @focusout="onRootFocusOut"
  >
    <label v-if="label" class="r-field__label" :for="!readonly && editing ? `${fieldId}-1` : `${fieldId}-summary`">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <!-- One chrome: collapsed prose or parts editor, plus optional occurrences
         info (non-tabbable, same pattern as Ipv4Editor). Editable: prose while
         blurred; focus expands to parts (deferred so Tab does not leak).
         Readonly: prose always — no parts editor, no editable tint. -->
    <div
      class="r-field__control r-cron__shell"
      role="group"
      :aria-label="label ?? 'Cron expression'"
      :aria-describedby="ariaDescribedBy"
      :aria-readonly="readonly || undefined"
      @keydown="onControlKeydown"
    >
      <button
        v-if="readonly || !editing"
        :id="`${fieldId}-summary`"
        type="button"
        class="r-cron__collapsed"
        :disabled="disabled"
        :aria-readonly="readonly || undefined"
        @click="enterEdit"
      >
        <span class="r-cron__prose" :class="{ 'r-cron__prose--empty': isBlankParts(parts) }">
          {{ collapsedText }}
        </span>
      </button>

      <div v-else class="r-cron__control">
        <div
          v-for="(field, index) in CRON_FIELDS"
          :key="field.key"
          class="r-cron__segment"
          :class="{ 'r-cron__segment--optional': field.optional }"
        >
          <input
            :id="`${fieldId}-${index}`"
            :ref="(el) => setBoxRef(index, el)"
            class="r-field__input r-cron__input"
            :value="parts[field.key]"
            type="text"
            autocomplete="off"
            spellcheck="false"
            :placeholder="field.placeholder"
            :aria-label="field.optional ? `${field.name} (optional)` : field.name"
            :aria-expanded="openField === field.key"
            :aria-controls="`${fieldId}-${field.key}-list`"
            role="combobox"
            aria-autocomplete="list"
            :disabled="disabled"
            :style="{ width: `${fieldWidth(field.key, field.placeholder)}ch` }"
            @input="onFieldInput(field.key, $event)"
            @keydown="onFieldKeydown(index, field.key, $event)"
            @focus="onFieldFocus(field.key, $event)"
            @blur="onFieldBlur(field.key)"
            @paste="onPaste"
          />

          <ul
            v-if="openField === field.key && filteredOptions(field.key).length > 0"
            :id="`${fieldId}-${field.key}-list`"
            class="r-cron__menu"
            role="listbox"
            :aria-label="`${field.name} suggestions`"
          >
            <li
              v-for="(option, optIndex) in filteredOptions(field.key)"
              :key="option.value === '' ? '__omit__' : option.value"
              class="r-cron__option"
              :class="{ 'r-cron__option--active': optIndex === activeOption }"
              role="option"
              :aria-selected="parts[field.key] === option.value"
              @mousedown.prevent="pick(field.key, option.value)"
            >
              <code class="r-cron__token">{{ option.value === '' ? '—' : option.value }}</code>
              <span class="r-cron__option-label">{{ option.label }}</span>
            </li>
          </ul>
        </div>
      </div>

      <span v-if="showOccurrences" class="r-cron__info">
        <Popover
          v-model:open="occurrencesOpen"
          label="Next occurrences"
          position-area="bottom span-left"
          :tabbable="false"
          :disabled="disabled || !occurrencesEnabled"
        >
          <template #trigger>
            <Icon class="r-field__icon" name="info" :size="14" />
          </template>
          <div class="r-cron__occurrences">
            <p v-if="summary" class="r-cron__occurrences-prose">{{ summary }}</p>
            <p class="r-cron__occurrences-title">Next 5 runs</p>
            <ol>
              <li v-for="when in occurrences" :key="when.toISOString()">
                {{ formatOccurrence(when) }}
              </li>
            </ol>
            <div v-if="expression" class="r-cron__occurrences-expr">
              <code>{{ expression }}</code>
              <button
                type="button"
                class="r-cron__occurrences-copy"
                :aria-label="expressionCopied ? 'Copied' : 'Copy expression'"
                @click="copyExpression"
              >
                <Icon :name="expressionCopied ? 'check' : 'copy'" :size="14" />
              </button>
            </div>
          </div>
        </Popover>
      </span>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
  </div>
</template>

<style>
.r-cron__shell {
  gap: 0;
}

/*
 * The wrapper owns the ring via `.r-field__control:focus-within`. Suppress the
 * global `:focus-visible` on inner controls so Tabbing segments (or the
 * collapsed summary) does not paint a second ring inside the box.
 */
.r-cron__collapsed:focus,
.r-cron__collapsed:focus-visible,
.r-cron__input:focus,
.r-cron__input:focus-visible {
  outline: none;
}

.r-cron__collapsed {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: var(--sp-1);
  min-width: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: start;
  cursor: text;
  appearance: none;
  font: inherit;
  color: inherit;
}

.r-cron__collapsed:disabled {
  cursor: not-allowed;
}

.r-cron__prose {
  overflow: hidden;
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-cron__prose--empty {
  color: var(--fg-faint);
}

.r-cron__control {
  /*
   * Content-sized segments, left-packed — spare track stays empty on the right
   * (before the info control) rather than stretching fields like a table.
   */
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-start;
  gap: var(--sp-1);
  min-width: 0;
  flex-wrap: nowrap;
  overflow: visible;
}

.r-cron__info {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  margin-left: auto;
  padding-left: var(--sp-1);
}

.r-cron__info .r-popover__activator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.r-cron__info .r-popover__activator .r-icon {
  display: block;
  vertical-align: 0;
}

.r-cron__info .r-popover__activator:hover:not(:disabled) {
  background: var(--bg-surface-3);
}

.r-cron__info .r-popover__activator:hover:not(:disabled) .r-field__icon {
  color: var(--fg-primary);
}

.r-cron__info .r-popover__activator:disabled {
  cursor: not-allowed;
}

.r-cron__occurrences {
  min-width: 16rem;
  max-width: min(28rem, calc(100vw - var(--sp-6)));
}

.r-cron__occurrences-prose {
  margin: 0 0 var(--sp-3);
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  line-height: 1.4;
}

.r-cron__occurrences-title {
  margin: 0 0 var(--sp-2);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
}

.r-cron__occurrences ol {
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-cron__occurrences li {
  padding: var(--sp-1) 0;
  font-family: var(--font-data);
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.r-cron__occurrences li + li {
  border-top: 1px solid var(--border-default);
}

.r-cron__occurrences-expr {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--border-default);
  min-width: 0;
}

.r-cron__occurrences-expr code {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--fg-primary);
  font-family: var(--font-mono, var(--font-data));
  font-size: var(--fs-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-cron__occurrences-copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-cron__occurrences-copy:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-cron__occurrences-copy:focus-visible {
  outline: 1px solid var(--border-focus);
  outline-offset: 1px;
}

.r-cron__segment {
  position: relative;
  flex: 0 0 auto;
  display: flex;
}

.r-cron__segment--optional .r-cron__input::placeholder {
  color: var(--fg-faint);
  font-style: italic;
}

.r-cron__input {
  flex: 0 0 auto;
  padding-inline: 0;
  text-align: center;
  font-family: var(--font-mono, var(--font-data));
  font-variant-numeric: tabular-nums;
}

.r-cron__menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 0;
  min-width: max(100%, 14rem);
  max-height: 16rem;
  margin: 0;
  padding: var(--sp-1);
  overflow: auto;
  list-style: none;
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  box-shadow: var(--shadow-md, 0 4px 16px rgb(0 0 0 / 12%));
}

.r-cron__option {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--r-sm);
  cursor: pointer;
}

.r-cron__option:hover,
.r-cron__option--active {
  background: var(--bg-surface-3);
}

.r-cron__token {
  flex: 0 0 auto;
  font-family: var(--font-mono, var(--font-data));
  font-size: var(--fs-sm);
  color: var(--fg-primary);
}

.r-cron__option-label {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
  white-space: nowrap;
}
</style>
