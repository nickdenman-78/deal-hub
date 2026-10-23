<script setup lang="ts">
import { ToggleGroup, type ToggleOption } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { toggleGroupExample } from '../../apiExamples';
import { toggleGroupProps, toggleOptionProps } from '../../apiDocs';

const DENSITY: ToggleOption<string>[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'standard', label: 'Standard' },
  { value: 'comfortable', label: 'Comfortable' },
];
const density = ref<string | string[] | undefined>('standard');

const STATUSES: ToggleOption<string>[] = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'retired', label: 'Retired' },
];
const statuses = ref<string | string[] | undefined>(['active', 'draft']);

const ALIGNMENT: ToggleOption<string>[] = [
  { value: 'start', icon: 'align-left', ariaLabel: 'Align left' },
  { value: 'center', icon: 'align-center', ariaLabel: 'Align centre' },
  { value: 'end', icon: 'align-right', ariaLabel: 'Align right' },
];
const alignment = ref<string | string[] | undefined>('start');
</script>

<template>
  <Specimen
    title="ToggleGroup — single"
    note="A mode switch: the choices are few, mutually exclusive, and worth showing all at once. mandatory stops the last one being cleared, because a table with no density is not a state. On a CommandRail, TableDensityMenu is the compact alternative."
  >
    <ToggleGroup v-model="density" :options="DENSITY" label="Row density" mandatory />
  </Specimen>

  <Specimen
    title="ToggleGroup — multiple"
    note="Same control, filter semantics. Clearing every option is meaningful here (it means “no filter”), so mandatory is off."
  >
    <div class="sb__stack">
      <ToggleGroup v-model="statuses" :options="STATUSES" label="Status filter" multiple />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(statuses) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ToggleGroup — icon only"
    note="An option with an icon and no label MUST carry ariaLabel; there is otherwise nothing for a screen reader to announce."
  >
    <ToggleGroup v-model="alignment" :options="ALIGNMENT" label="Alignment" mandatory size="sm" />
  </Specimen>
  <CodeExample :code="toggleGroupExample" />

  <PropsTable :rows="toggleGroupProps" />
  <PropsTable :rows="toggleOptionProps" title="ToggleOption" note="Shape of each entry in `options`." />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
