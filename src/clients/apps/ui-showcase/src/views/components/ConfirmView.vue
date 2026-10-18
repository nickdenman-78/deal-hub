<script setup lang="ts">
import { Button, confirm } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { confirmExample } from '../../apiExamples';
import { confirmProps } from '../../apiDocs';

const lastAnswer = ref<string>('—');

async function askToDelete() {
  const yes = await confirm({
    title: 'Delete API key?',
    message: 'Services using this key will start failing authentication immediately.',
    confirmLabel: 'Delete key',
    destructive: true,
  });
  lastAnswer.value = yes ? 'confirmed' : 'cancelled';
}
</script>

<template>
  <Specimen
    title="Confirm"
    note="Promise-based rather than an accept/reject callback pair: the decision reads in the order it happens, and the work after it stays in the function that started it."
  >
    <div class="sb__row">
      <Button severity="error" icon="trash-2" @click="askToDelete">Delete key…</Button>
      <span class="ovl-answer"
        >Last answer: <code>{{ lastAnswer }}</code></span
      >
    </div>
  </Specimen>
  <CodeExample :code="confirmExample" />

  <PropsTable :rows="confirmProps" title="confirm()" note="Promise API. Mount ConfirmHost once in the app shell." />
</template>

<style scoped>
.ovl-answer {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
