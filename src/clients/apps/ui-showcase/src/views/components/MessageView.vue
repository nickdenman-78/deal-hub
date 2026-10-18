<script setup lang="ts">
import { Message } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { messageExample } from '../../apiExamples';
import { messageProps } from '../../apiDocs';

const dismissed = ref(false);
</script>

<template>
  <Specimen
    title="Messages"
    note="Errors and warnings announce assertively (role=alert); info and success politely (role=status). They usually report that something the operator just did did not work, and a polite queue is too late."
  >
    <div class="sb__stack">
      <Message severity="info">Composition uses the merged service layer.</Message>
      <Message severity="success" title="Saved">Configuration published to staging.</Message>
      <Message severity="warning" title="Missing secret">
        <code>kv:pricing-api-key</code> did not resolve; a placeholder was substituted.
      </Message>
      <Message severity="error" title="Publish failed">The environment registry is locked by another operator.</Message>
      <Message v-if="!dismissed" severity="info" closable @close="dismissed = true">
        Dismissible. Click the ✕.
      </Message>
    </div>
  </Specimen>
  <CodeExample :code="messageExample" />

  <PropsTable :rows="messageProps" />
</template>
