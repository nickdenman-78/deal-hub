<script setup lang="ts">
/**
 * An editor for an arbitrary string→string map — env vars, labels, headers,
 * anything the schema does not name in advance.
 *
 * The model is `Record<string, string>`, because that is what the config file
 * holds. Internally it is an ordered list of ROWS, and the gap between those
 * two shapes is the whole reason this component exists rather than being
 * improvised per call site:
 *
 *   - A record has no order, so rows would jump as keys were edited.
 *   - A record cannot hold two rows with the same key, so a key that briefly
 *     collides while being retyped would destroy the other row's value.
 *   - A record cannot hold a row with no key, so "Add" would appear to do
 *     nothing.
 *
 * Rows are the truth while editing; the record is the truth once saved. What
 * cannot be represented is REPORTED rather than quietly resolved — see
 * keyValue.ts. Silently dropping a duplicate key loses a value the operator
 * typed while the row that held it is still on screen looking saved.
 */
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue';
import Button from '../components/Button.vue';
import Icon from '../components/Icon.vue';
import {
  emptyRow,
  duplicateKeyIndexes,
  keyError,
  rowsError,
  sortRows,
  toRecord,
  toRows,
  type KeyRules,
  type KeyValueRow,
} from './keyValue';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    disabled?: boolean;
    /**
     * Entries stay readable; the cells refuse edits and Sort, Remove and Add
     * are withdrawn. The Remove column goes with them, so a read-only table is
     * two columns rather than two and an empty one.
     */
    readonly?: boolean;
    editable?: boolean;
    keyLabel?: string;
    valueLabel?: string;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
    /** Key shape rules — pattern, length, case sensitivity. */
    rules?: KeyRules;
    /** Offers a button to put the rows in key order. Never automatic. */
    sortable?: boolean;
    addLabel?: string;
  }>(),
  {
    label: undefined,
    description: undefined,
    keyLabel: 'Key',
    valueLabel: 'Value',
    keyPlaceholder: 'key',
    valuePlaceholder: 'value',
    rules: undefined,
    addLabel: 'Add entry',
  },
);

const model = defineModel<Record<string, string>>({ default: () => ({}) });

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const ariaDescribedBy = computed(
  () => [props.description ? describedBy : undefined, errorId].filter(Boolean).join(' ') || undefined,
);

const root = useTemplateRef<HTMLElement>('root');
const rows = ref<KeyValueRow[]>(toRows(model.value));

/*
 * Incoming values rebuild the rows only when they describe a DIFFERENT map.
 *
 * Without the guard, every keystroke round-trips through the parent and comes
 * back as a fresh row array — new ids, so Vue tears down and rebuilds every
 * input, and focus lands back at the top of the list on each character typed.
 */
watch(
  model,
  (next) => {
    const current = toRecord(rows.value);
    const incoming = next ?? {};
    const same =
      Object.keys(current).length === Object.keys(incoming).length &&
      Object.entries(incoming).every(([key, value]) => current[key] === value);
    if (same) return;
    rows.value = toRows(incoming);
  },
  { deep: true },
);

function emit() {
  model.value = toRecord(rows.value);
}

async function addRow() {
  rows.value = [...rows.value, emptyRow()];
  await nextTick();
  const keys = root.value?.querySelectorAll<HTMLInputElement>('.r-kv__key');
  keys?.[keys.length - 1]?.focus();
}

function removeRow(id: string) {
  rows.value = rows.value.filter((row) => row.id !== id);
  emit();
}

function sort() {
  rows.value = sortRows(rows.value);
  emit();
}

const duplicates = computed(() => new Set(duplicateKeyIndexes(rows.value, props.rules)));
const error = computed(() => rowsError(rows.value, props.rules));
const count = computed(() => Object.keys(toRecord(rows.value)).length);

function keyIsInvalid(row: KeyValueRow, index: number): boolean {
  return duplicates.value.has(index) || keyError(row.key, props.rules) !== undefined;
}
</script>

<template>
  <div
    ref="root"
    class="r-field r-kv"
    :class="{
      'r-field--editable': editable,
      'r-field--readonly': readonly,
      'r-field--disabled': disabled,
    }"
  >
    <div class="r-kv__head">
      <label v-if="label" class="r-field__label">{{ label }}</label>
      <Button
        v-if="sortable && rows.length > 1 && !disabled && !readonly"
        variant="text"
        size="sm"
        icon="arrow-up-down"
        @click="sort"
      >
        Sort
      </Button>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint r-kv__description">{{ description }}</p>

    <!--
      A table rather than stacked field pairs. The column headings are what make
      an unlabelled grid of inputs legible, and they are said once instead of
      once per row — which is also what stops a screen reader announcing "Key,
      Value" forty times.
    -->
    <table v-if="rows.length > 0" class="r-kv__table" :aria-describedby="ariaDescribedBy">
      <thead>
        <tr>
          <th scope="col">{{ keyLabel }}</th>
          <th scope="col">{{ valueLabel }}</th>
          <th v-if="!disabled && !readonly" scope="col"><span class="r-kv__sr">Remove</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="row.id">
          <td>
            <input
              v-model="row.key"
              class="r-field__input r-kv__input r-kv__key"
              :class="{ 'r-kv__input--bad': keyIsInvalid(row, index) }"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :placeholder="keyPlaceholder"
              :disabled="disabled"
              :readonly="readonly"
              :aria-label="`${keyLabel} ${index + 1}`"
              :aria-invalid="keyIsInvalid(row, index) ? 'true' : 'false'"
              :aria-describedby="index === 0 ? ariaDescribedBy : undefined"
              @input="emit"
            />
          </td>
          <td>
            <input
              v-model="row.value"
              class="r-field__input r-kv__input"
              type="text"
              autocomplete="off"
              spellcheck="false"
              :placeholder="valuePlaceholder"
              :disabled="disabled"
              :readonly="readonly"
              :aria-label="`${valueLabel} ${index + 1}`"
              @input="emit"
            />
          </td>
          <td v-if="!disabled && !readonly">
            <button
              type="button"
              class="r-kv__remove"
              :aria-label="`Remove ${row.key.trim() === '' ? `entry ${index + 1}` : row.key}`"
              @click="removeRow(row.id)"
            >
              <Icon name="trash-2" :size="14" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="r-kv__empty">No entries.</p>

    <div class="r-kv__foot">
      <Button v-if="!disabled && !readonly" variant="text" size="sm" icon="plus" @click="addRow">{{ addLabel }}</Button>
      <span class="r-kv__count">{{ count }} {{ count === 1 ? 'entry' : 'entries' }}</span>
    </div>

    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
  </div>
</template>

<style>
.r-kv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.r-kv__description {
  margin-top: 0;
}

.r-kv__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.r-kv__table th {
  padding: 0 0 var(--sp-1);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-align: start;
}

/* The remove column is exactly a button wide; the rest splits evenly. */
.r-kv__table th:last-child {
  width: 32px;
}

.r-kv__table td {
  padding: 0 var(--sp-1) var(--sp-1) 0;
  vertical-align: middle;
}

.r-kv__table td:last-child {
  padding-right: 0;
}

.r-kv__input {
  width: 100%;
  height: 30px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--border-input);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-primary);
  font-size: var(--fs-sm);
}

/* No fill on an editable row — see Input.vue: the treatment belongs to the
   read-only state, not this one. KeyValueEditor has no `readonly` yet; when it
   grows one, paint --bg-surface-2 here. */

.r-kv__input:focus {
  border-color: var(--border-focus);
  outline: 1px solid var(--border-focus);
  outline-offset: -1px;
}

.r-kv__key {
  font-family: var(--font-data);
}

.r-kv__input--bad {
  border-color: var(--error-ink);
}

.r-kv__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid transparent;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-kv__remove:hover {
  background: var(--bg-surface-3);
  color: var(--error-ink);
}

.r-kv__empty {
  margin: 0;
  padding: var(--sp-2) 0;
  color: var(--fg-faint);
  font-size: var(--fs-sm);
}

.r-kv__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
}

.r-kv__count {
  color: var(--fg-faint);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
}

.r-kv__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
