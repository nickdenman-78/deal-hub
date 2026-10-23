<script setup lang="ts">
import { MultiSelect, type SelectOption } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { multiSelectExample } from '../../apiExamples';
import { multiSelectProps } from '../../apiDocs';

const ENVIRONMENTS: SelectOption<string>[] = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
  { value: 'dr', label: 'Disaster recovery', disabled: true },
];
const targetEnvironments = ref<string[]>(['test', 'staging']);
const noEnvironments = ref<string[]>([]);
const manyEnvironments = ref<string[]>(['dev', 'test', 'staging', 'prod']);
</script>

<template>
  <Specimen
    title="MultiSelect"
    note="The same v0 compound as Select with multiple set, so the keyboard model, ARIA wiring and anchor positioning are shared rather than reimplemented. The menu stays open while you toggle; the check column is always rendered so labels do not shift."
  >
    <div class="sb__stack">
      <MultiSelect v-model="targetEnvironments" :options="ENVIRONMENTS" label="Deploy to" />
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(targetEnvironments) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="MultiSelect — empty, overflowing, and disabled"
    note="Chips collapse to “+N more” past maxChips, because a filter with nine things chosen would otherwise grow the field tall enough to push the page around. Clear sits OUTSIDE the activator: v0 renders that as a button, and a button inside a button is invalid markup that browsers reparent."
  >
    <div class="sb__stack">
      <MultiSelect v-model="noEnvironments" :options="ENVIRONMENTS" label="Filter" placeholder="Any environment" />
      <MultiSelect v-model="manyEnvironments" :options="ENVIRONMENTS" label="Overflowing" :max-chips="2" />
      <MultiSelect :model-value="['prod']" :options="ENVIRONMENTS" label="Locked" disabled />
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="Chips stay readable; the menu and the clear control are withdrawn. A chip is not activatable in the first place, so read-only costs it nothing. Markup cannot go in an input, so this is the one read-only face that stays a focusable span rather than becoming one — reachable, with selection left to the browser."
  >
    <div class="sb__stack">
      <MultiSelect
        :options="[
          { value: 'mill', label: 'Mill' },
          { value: 'depot', label: 'Depot' },
        ]"
        :model-value="['mill', 'depot']"
        label="NMI groups"
        readonly
      />
    </div>
  </Specimen>

  <CodeExample :code="multiSelectExample" />

  <PropsTable :rows="multiSelectProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
