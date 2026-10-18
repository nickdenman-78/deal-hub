<script setup lang="ts">
import { RadioGroup } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { radioGroupExample } from '../../apiExamples';
import { radioGroupProps, radioOptionProps } from '../../apiDocs';

const delivery = ref<string>('immediate');
const environment = ref<string>();
const density = ref<string>('comfortable');
</script>

<template>
  <Specimen
    title="RadioGroup"
    note="The single-choice control for MODES, where each option deserves a sentence and exactly one can hold. ToggleGroup already does single-select, but a segmented control earns its compactness by dropping the descriptions — right for short filter values, wrong for decisions the user should read before making. Radio semantics apply: a selection can be changed but never cleared."
  >
    <div class="sb__stack">
      <RadioGroup
        v-model="delivery"
        label="Delivery"
        :options="[
          { value: 'immediate', label: 'Immediately', description: 'Send each alert as it happens.' },
          { value: 'digest', label: 'Daily digest', description: 'Bundle alerts into one morning email.' },
          { value: 'none', label: 'Do not notify', description: 'Alerts stay in the activity feed only.' },
        ]"
      />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(delivery) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="RadioGroup — no selection yet, disabled options"
    note="The model starts undefined until the user chooses — a form should know the difference between “not answered” and “answered with the first option”. A disabled option stays visible and readable: hiding it would make the remaining options lie about what exists."
  >
    <div class="sb__stack">
      <RadioGroup
        v-model="environment"
        label="Deploy to"
        :options="[
          { value: 'dev', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'prod', label: 'Production', description: 'Requires a change window.', disabled: true },
        ]"
      />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(environment) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="RadioGroup — horizontal, small"
    note="The horizontal orientation suits short, description-less options inside a row of other controls. Keyboard behaviour is unchanged: arrows move and select, Tab leaves the group."
  >
    <div class="sb__stack">
      <RadioGroup
        v-model="density"
        label="Density"
        orientation="horizontal"
        size="sm"
        :options="[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact' },
        ]"
      />
    </div>
  </Specimen>

  <CodeExample :code="radioGroupExample" />

  <PropsTable :rows="radioGroupProps" />
  <PropsTable title="RadioOption" :rows="radioOptionProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
