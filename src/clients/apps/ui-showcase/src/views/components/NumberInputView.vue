<script setup lang="ts">
import { NumberInput } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { numberInputExample } from '../../apiExamples';
import { numberInputProps } from '../../apiDocs';

const certs = ref('1000');
const rate = ref('178.45');
</script>

<template>
  <Specimen
    title="NumberInput"
    note="Amount field with optional unit chrome. prefixUnit / suffixUnit are display-only. v-model is always the raw number (e.g. 1234.50) — grouping separators appear only in the field while resting. Focus denormalises for typing; blur formats the display."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <NumberInput
          v-model="certs"
          label="Certificate volume"
          suffix-unit="certs"
          :fraction-digits="0"
          description='suffixUnit="certs", fractionDigits=0 → 1,000 certs'
          locale="en-AU"
        />
        <p class="sb__state">
          Model: <code>{{ certs || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <NumberInput
          v-model="rate"
          label="Capacity charge"
          prefix-unit="$"
          suffix-unit="/MW"
          :fraction-digits="2"
          description="Both units → $ 178.45 /MW"
          locale="en-AU"
        />
        <p class="sb__state">
          Model: <code>{{ rate || 'empty' }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="numberInputExample" />
  <PropsTable :rows="numberInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
