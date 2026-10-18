<script setup lang="ts">
import { Textarea } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { textareaExample } from '../../apiExamples';
import { textareaProps } from '../../apiDocs';

const notes = ref('Rates refresh every 30 seconds.\nOwner: trading desk.');
const jsonBlob = ref('{\n  "retries": 3,\n  "timeoutSeconds": 30\n}');
</script>

<template>
  <Specimen
    title="Textarea"
    note="Same field chrome as Input — label, description, rules, tint — plus rows and a monospace mode for config blobs. It is a textarea, not an editor: for JSON that needs validation and folding, reach for @ets/editor's JsonEditor."
  >
    <div class="sb__stack">
      <Textarea v-model="notes" label="Description" description="Markdown is rendered on the detail screen." />
      <Textarea v-model="jsonBlob" label="Overrides" :rows="5" mono />
      <Textarea label="Locked" model-value="Managed upstream." disabled />
    </div>
  </Specimen>
  <CodeExample :code="textareaExample" />

  <PropsTable :rows="textareaProps" />
</template>
