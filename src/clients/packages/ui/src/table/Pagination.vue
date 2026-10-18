<script setup lang="ts">
/**
 * A pager, rendered BESIDE a table rather than inside it.
 *
 * Deliberately not folded into DataTable. The only paginated table in the
 * product pages server-side — the rows on screen are the page the API
 * returned, and the table has no idea how many others exist — so a pager that
 * lived inside the table would have to be told `total` anyway, and would then
 * be a second, silent source of truth about which page is showing. Keeping it
 * separate means the caller owns the page state, which it already does.
 *
 * v0's `createPagination` is not used for the same reason: it models a client
 * holding all the rows and slicing them.
 *
 * Rows-per-page defaults to {@link DEFAULT_PAGE_SIZE_OPTIONS}. Callers may
 * replace the list and/or disallow free-typed sizes via `allowCustomPageSize`
 * (on by default).
 */
import { computed, ref, useId, watch } from 'vue';
import Button from '../components/Button.vue';
import Input from '../components/Input.vue';
import Select from '../components/Select.vue';
import { DEFAULT_PAGE_SIZE_OPTIONS, parsePageSize } from './pageSize';

const CUSTOM_VALUE = '__custom__';

const props = withDefaults(
  defineProps<{
    /** Zero-based. */
    page: number;
    pageSize: number;
    /** Total rows across every page, as reported by the server. */
    total: number;
    /**
     * Preset sizes in the Rows control. Defaults to
     * {@link DEFAULT_PAGE_SIZE_OPTIONS}. Pass `[]` with
     * `allowCustomPageSize: false` to hide the control.
     */
    pageSizeOptions?: readonly number[];
    /**
     * When true (default), the operator can pick Custom… and type any integer
     * ≥ 1. When false, only `pageSizeOptions` are offered.
     */
    allowCustomPageSize?: boolean;
    disabled?: boolean;
  }>(),
  {
    pageSizeOptions: () => DEFAULT_PAGE_SIZE_OPTIONS,
    allowCustomPageSize: true,
    disabled: false,
  },
);

const emit = defineEmits<{ 'update:page': [value: number]; 'update:pageSize': [value: number] }>();

const rowsLabelId = useId();
const customDraft = ref(String(props.pageSize));

const lastPage = computed(() => Math.max(0, Math.ceil(props.total / props.pageSize) - 1));
const onFirst = computed(() => props.page <= 0);
const onLast = computed(() => props.page >= lastPage.value);

/* One-based and inclusive, because the report is read by a person. `total`
     rather than `page * size + rows.length` for the upper bound: the caller may
     render this before the page's rows have arrived. */
const from = computed(() => (props.total === 0 ? 0 : props.page * props.pageSize + 1));
const to = computed(() => Math.min((props.page + 1) * props.pageSize, props.total));

const presets = computed(() => props.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS);

const pageSizeInPresets = computed(() => presets.value.includes(props.pageSize));

/** Custom entry field visible when allowed and the current size is not a preset (or Custom… was chosen). */
const customOpen = ref(!pageSizeInPresets.value && props.allowCustomPageSize);

watch(
  () => [props.pageSize, props.allowCustomPageSize, presets.value] as const,
  () => {
    if (!props.allowCustomPageSize) {
      customOpen.value = false;
      return;
    }
    if (!pageSizeInPresets.value) customOpen.value = true;
    customDraft.value = String(props.pageSize);
  },
  { deep: true },
);

const showSizeControl = computed(() => presets.value.length > 0 || props.allowCustomPageSize);

/**
 * Select options: presets, plus the current size when it is a non-preset and
 * custom entry is off (so a persisted odd size still displays), plus Custom…
 * when free typing is allowed.
 */
const sizeOptions = computed(() => {
  const options = presets.value.map((size) => ({ value: String(size), label: String(size) }));
  if (!props.allowCustomPageSize && !pageSizeInPresets.value && props.pageSize >= 1) {
    options.push({ value: String(props.pageSize), label: String(props.pageSize) });
    options.sort((a, b) => Number(a.value) - Number(b.value));
  }
  // Custom… only when there are presets to leave — otherwise the number field alone is enough.
  if (props.allowCustomPageSize && presets.value.length > 0) {
    options.push({ value: CUSTOM_VALUE, label: 'Custom…' });
  }
  return options;
});

const showCustomInput = computed(
  () => props.allowCustomPageSize && (customOpen.value || presets.value.length === 0 || !pageSizeInPresets.value),
);

const selectModel = computed(() => {
  if (props.allowCustomPageSize && (customOpen.value || !pageSizeInPresets.value)) {
    return CUSTOM_VALUE;
  }
  return String(props.pageSize);
});

function go(page: number) {
  emit('update:page', Math.min(Math.max(page, 0), lastPage.value));
}

function applyPageSize(n: number) {
  if (n === props.pageSize) {
    emit('update:page', 0);
    return;
  }
  // Page 0, not the current page: at a larger size the current index may be
  // past the end, and the caller would fetch an empty page.
  emit('update:pageSize', n);
  emit('update:page', 0);
}

function onSelectSize(value: string | undefined) {
  if (value === undefined) return;
  if (value === CUSTOM_VALUE) {
    customOpen.value = true;
    customDraft.value = String(props.pageSize);
    return;
  }
  const n = parsePageSize(value);
  if (n === null) return;
  customOpen.value = false;
  applyPageSize(n);
}

function commitCustom() {
  const n = parsePageSize(customDraft.value);
  if (n === null) {
    customDraft.value = String(props.pageSize);
    return;
  }
  applyPageSize(n);
  // Stay on Custom… so the typed value remains editable; selecting a preset
  // is how you leave custom mode.
  customOpen.value = true;
}

function onCustomModel(value: string | undefined) {
  customDraft.value = value ?? '';
}

/** Commit when focus leaves the custom field (not when moving within it). */
function onCustomFocusOut(event: FocusEvent) {
  const current = event.currentTarget as HTMLElement | null;
  const next = event.relatedTarget as Node | null;
  if (current && next && current.contains(next)) return;
  commitCustom();
}
</script>

<template>
  <nav class="r-pagination" aria-label="Pagination">
    <Button
      variant="text"
      size="sm"
      icon="chevrons-left"
      aria-label="First page"
      :disabled="disabled || onFirst"
      @click="go(0)"
    />
    <Button
      variant="text"
      size="sm"
      icon="chevron-left"
      aria-label="Previous page"
      :disabled="disabled || onFirst"
      @click="go(page - 1)"
    />

    <!-- aria-live so a screen reader hears the range change; the buttons around
         it stay focused, so nothing else would announce it. -->
    <span class="r-pagination__report" aria-live="polite">{{ from }} – {{ to }} of {{ total }}</span>

    <Button
      variant="text"
      size="sm"
      icon="chevron-right"
      aria-label="Next page"
      :disabled="disabled || onLast"
      @click="go(page + 1)"
    />
    <Button
      variant="text"
      size="sm"
      icon="chevrons-right"
      aria-label="Last page"
      :disabled="disabled || onLast"
      @click="go(lastPage)"
    />

    <!--
      A <div>, not a <label>. Wrapping Select in a label re-clicks the activator
      when an option is chosen (option is still a DOM descendant via popover),
      so the menu closes then immediately reopens.
    -->
    <div v-if="showSizeControl" class="r-pagination__size">
      <span :id="rowsLabelId">Rows</span>
      <Select
        v-if="sizeOptions.length > 0"
        :model-value="selectModel"
        :options="sizeOptions"
        size="sm"
        :disabled="disabled"
        :aria-labelledby="rowsLabelId"
        @update:model-value="onSelectSize"
      />
      <div v-if="showCustomInput" class="r-pagination__custom-wrap" @focusout="onCustomFocusOut">
        <Input
          :model-value="customDraft"
          type="number"
          size="sm"
          class="r-pagination__custom"
          :disabled="disabled"
          :input-attrs="{ min: 1, step: 1, 'aria-label': 'Custom rows per page' }"
          @update:model-value="onCustomModel"
          @keydown.enter.prevent="commitCustom"
        />
      </div>
    </div>
  </nav>
</template>

<style>
.r-pagination {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  color: var(--fg-muted);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
}

.r-pagination__report {
  padding: 0 var(--sp-2);
  /* Data face: the numbers change as you page, and a proportional face makes
       the whole line jitter. */
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.r-pagination__size {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-left: auto;
}

.r-pagination__custom {
  width: 4.5rem;
}

.r-pagination__custom .r-field__input {
  font-variant-numeric: tabular-nums;
}
</style>
