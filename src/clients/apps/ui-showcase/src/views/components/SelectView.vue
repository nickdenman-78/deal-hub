<script setup lang="ts">
import { Select, type SelectOption } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { selectExample } from '../../apiExamples';
import { selectProps, selectOptionProps } from '../../apiDocs';

const ENVIRONMENTS: SelectOption<string>[] = [
  { value: 'dev', label: 'Development' },
  { value: 'test', label: 'Test' },
  { value: 'staging', label: 'Staging' },
  { value: 'prod', label: 'Production' },
  { value: 'dr', label: 'Disaster recovery', disabled: true },
];
const environment = ref<string | undefined>('test');
const emptySelect = ref<string | undefined>(undefined);
</script>

<template>
  <Specimen
    title="Select"
    note="Single choice from a known list. Options carry their own disabled flag — Disaster recovery below is listed but unselectable, which tells an operator it exists without letting them pick it."
  >
    <div class="sb__stack">
      <Select v-model="environment" :options="ENVIRONMENTS" label="Environment" />
      <Select v-model="emptySelect" :options="ENVIRONMENTS" label="Promote to" placeholder="Choose an environment…" />
      <Select v-model="environment" :options="ENVIRONMENTS" label="Target" size="sm" />
      <Select :options="ENVIRONMENTS" label="Locked" disabled />
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="The listbox is not rendered at all rather than rendered and then ignored — a chevron that opens nothing reads as broken, not as read-only. The value is a native readonly input, so it is a tab stop you can select and copy from; a focusable div would have been reachable but would have copied nothing. An unset value shows the em dash as a placeholder — on screen, but not on your clipboard."
  >
    <div class="sb__stack">
      <Select
        :options="[
          { value: 'nsw', label: 'NSW1' },
          { value: 'qld', label: 'QLD1' },
        ]"
        model-value="nsw"
        label="NEM region"
        readonly
      />
      <Select :options="[]" label="Superseded by" readonly />
    </div>
  </Specimen>

  <CodeExample :code="selectExample" />

  <PropsTable :rows="selectProps" />
  <PropsTable :rows="selectOptionProps" title="SelectOption" note="Shape of each entry in `options`." />
</template>
