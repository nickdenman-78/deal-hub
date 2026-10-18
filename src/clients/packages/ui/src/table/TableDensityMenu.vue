<script setup lang="ts">
/**
 * Three-dot menu for `DataTable` row density — Compact / Standard / Comfortable.
 *
 * This is the CommandRail presentation of a contract the package already owns:
 * `DataTable.density` plus `DATA_TABLE_DENSITY_OPTIONS`. Audit invented the
 * ⋮ menu so a rail did not spend a ToggleGroup's width on three mutually
 * exclusive padding choices; leaving that in the app would make the next
 * table reinvent it. Pair with `usePersistedTableDensity` when the choice
 * should survive a reload.
 *
 * Designed to sit in a `CommandRailGroup` (typically `end`). The activator
 * carries `r-command-rail__menu-trigger` so rail chrome sizes it as an
 * icon-only control.
 */
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import Menu from '../components/Menu.vue';
import type { MenuItem } from '../components/Menu.vue';
import { DATA_TABLE_DENSITY_OPTIONS, type DataTableDensity } from './types';

const model = defineModel<DataTableDensity>({ default: 'standard' });

const props = withDefaults(
  defineProps<{
    /** Accessible name and native tooltip on the activator. */
    triggerLabel?: string;
    /** Placement relative to the trigger. */
    positionArea?: string;
  }>(),
  {
    triggerLabel: 'Row density',
    // Below the trigger, growing leftward — the density button lives at the
    // right edge of a toolbar. Physical keywords, not `bottom end`: mixing a
    // physical row with a logical column is an invalid `position-area`, the
    // browser drops the whole declaration, and the panel falls back to the
    // viewport corner with no anchoring at all.
    positionArea: 'bottom span-left',
  },
);

const items = computed<MenuItem[]>(() =>
  DATA_TABLE_DENSITY_OPTIONS.map((opt) => ({
    label: opt.label,
    icon: model.value === opt.value ? 'check' : undefined,
    action: () => {
      model.value = opt.value;
    },
  })),
);
</script>

<template>
  <Menu
    :items="items"
    :trigger-label="props.triggerLabel"
    trigger-class="r-command-rail__menu-trigger"
    :position-area="props.positionArea"
  >
    <template #trigger>
      <Icon name="ellipsis-vertical" :size="16" aria-hidden="true" />
    </template>
  </Menu>
</template>
