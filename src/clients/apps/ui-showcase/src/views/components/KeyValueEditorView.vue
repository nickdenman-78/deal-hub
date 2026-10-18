<script setup lang="ts">
import { KeyValueEditor } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { keyValueEditorExample } from '../../apiExamples';
import { keyValueEditorProps } from '../../apiDocs';

const serviceLabels = ref<Record<string, string>>({
  ASPNETCORE_ENVIRONMENT: 'Production',
  OTEL_SERVICE_NAME: 'pricing-api',
});
const emptyMap = ref<Record<string, string>>({});
</script>

<template>
  <Specimen
    title="KeyValueEditor"
    note="The model is a Record, but the rows are not — and that gap is the component. A record has no order, cannot hold two rows with the same key, and cannot hold a row whose key has not been typed yet, so binding one directly makes rows jump, destroys a value when a key briefly collides, and makes “Add entry” appear to do nothing. Rows are the truth while editing; the record is the truth on save. Type a duplicate key to see it reported rather than quietly resolved — dropping it would lose a value while its row sits there looking saved."
  >
    <div class="sb__stack">
      <KeyValueEditor
        v-model="serviceLabels"
        label="Environment variables"
        description="Passed to the container verbatim."
        key-label="Name"
        key-placeholder="key"
        value-placeholder="value"
        :rules="{ pattern: /^[A-Z][A-Z0-9_]*$/, patternMessage: 'Upper case, digits and underscores only.' }"
        sortable
      />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(serviceLabels) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="KeyValueEditor — empty, and sorting"
    note="Sorting is a button, never automatic: the order rows were typed in is information, and reordering on save throws it away. The empty state says so rather than showing a lone blank row, which reads as an entry someone forgot to fill in."
  >
    <div class="sb__stack">
      <KeyValueEditor v-model="emptyMap" label="Extra headers" key-label="Header" sortable />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(emptyMap) }}</code>
      </p>
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="Cells refuse edits, and Sort, Add and the Remove column all withdraw — so a read-only table is two columns rather than two and an empty one."
  >
    <div class="sb__stack">
      <KeyValueEditor
        :model-value="{ Accept: 'application/json', 'X-Deal-Ref': 'LGIRET06' }"
        label="Headers"
        readonly
      />
    </div>
  </Specimen>

  <CodeExample :code="keyValueEditorExample" />

  <PropsTable :rows="keyValueEditorProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
