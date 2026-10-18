<script setup lang="ts" generic="T extends object">
import { computed } from 'vue';
import Button from '../components/Button.vue';
import Checkbox from '../components/Checkbox.vue';
import Popover from '../components/Popover.vue';
import type { DataTableColumn } from './types';

/**
 * Column visibility toggle for a DataTable.
 *
 * Two values in play: a definition list (`allColumns`, source of truth) and a
 * visible-ids model that the picker drives. The consuming screen then filters
 * `allColumns` through the model before handing them to DataTable.
 *
 * Reorder is deliberately not in this component. Column sets on ROBI's screens
 * are small (six on Retail deals; up to nine elsewhere) and the drag-and-drop
 * needed for a reorder popover carries a non-trivial a11y bill for a payoff
 * most operators never reach for. Add it when a screen actually needs it, not
 * in the initial cut.
 */

const props = defineProps<{
  allColumns: readonly DataTableColumn<T>[];
  /** Column ids that MUST stay visible (e.g. primary identifier). */
  requiredIds?: readonly string[];
}>();

/** Ids of the columns currently shown. */
const model = defineModel<string[]>({ required: true });

const requiredSet = computed(() => new Set(props.requiredIds ?? []));

function isRequired(id: string): boolean {
  return requiredSet.value.has(id);
}

function isVisible(id: string): boolean {
  return model.value.includes(id);
}

function toggle(id: string, on: boolean | undefined) {
  const next = on === true;
  if (isRequired(id) && !next) return;
  if (next && !model.value.includes(id)) {
    model.value = [...model.value, id];
  } else if (!next) {
    model.value = model.value.filter((v) => v !== id);
  }
}

const visibleCount = computed(() => model.value.length);
</script>

<template>
  <Popover position-area="bottom span-left" content-class="column-picker" label="Columns">
    <template #trigger>
      <Button
        variant="outlined"
        size="sm"
        icon="columns-3"
        :aria-label="`Columns (${visibleCount} of ${allColumns.length})`"
      >
        Columns
      </Button>
    </template>

    <div class="column-picker__body">
      <p class="column-picker__hint">Show or hide columns.</p>
      <div class="column-picker__list">
        <Checkbox
          v-for="column in allColumns"
          :key="column.id"
          :model-value="isVisible(column.id)"
          :label="column.header"
          :disabled="isRequired(column.id)"
          @update:model-value="(v: boolean | undefined) => toggle(column.id, v)"
        />
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.column-picker__body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  min-width: 12rem;
}
.column-picker__hint {
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
.column-picker__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
</style>
