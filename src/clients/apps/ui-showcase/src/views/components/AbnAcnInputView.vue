<script setup lang="ts">
import { AbnAcnInput, type AbnAcnKind } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { abnAcnInputExample } from '../../apiExamples';
import { abnAcnInputProps } from '../../apiDocs';

const abn = ref('51824753556');
const acn = ref('004085616');
const either = ref('51824753556');
const eitherKind = ref<AbnAcnKind>('abn');
</script>

<template>
  <Specimen
    title="AbnAcnInput"
    note="Digits in v-model (11 ABN / 9 ACN). Grouped display on blur. Lock the type with kind, or set kindSelector (paste of 9/11 digits also picks the kind). Spaces optional while typing or pasting."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <AbnAcnInput v-model="abn" label="ABN" description='Locked to kind="abn" (default).' />
        <p class="sb__state">
          Model: <code>{{ abn || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <AbnAcnInput v-model="acn" kind="acn" label="ACN" description='Locked to kind="acn".' />
        <p class="sb__state">
          Model: <code>{{ acn || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <AbnAcnInput
          v-model="either"
          v-model:kind="eitherKind"
          kind-selector
          label="Business identifier"
          description="kindSelector shows ABN | ACN at the end of the field."
        />
        <p class="sb__state">
          Model: <code>{{ either || 'empty' }}</code> · Kind: <code>{{ eitherKind }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="abnAcnInputExample" />
  <PropsTable :rows="abnAcnInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
