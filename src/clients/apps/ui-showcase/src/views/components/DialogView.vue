<script setup lang="ts">
import { Button, Dialog, Input, Message } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dialogExample } from '../../apiExamples';
import { dialogProps } from '../../apiDocs';

const dialogOpen = ref(false);
const blockingOpen = ref(false);
</script>

<template>
  <Specimen
    title="Dialog"
    note="A native <dialog> opened with showModal(), so it lands in the top layer and gets a real ::backdrop. Centred by inset:0 + margin:auto — an offset plus a translate drifts as the viewport changes."
  >
    <div class="sb__row">
      <Button variant="outlined" @click="dialogOpen = true">Open dialog</Button>
      <Button variant="outlined" @click="blockingOpen = true">Open must-answer dialog</Button>
    </div>
  </Specimen>

  <Dialog v-model:open="dialogOpen" title="Rotate signing key" description="This re-encrypts every slot file.">
    <div class="sb__stack">
      <Message severity="warning">Clients cache the old key for up to 5 minutes.</Message>
      <Input label="Reason" description="Recorded in the audit log." />
    </div>
    <template #footer>
      <Button variant="outlined" @click="dialogOpen = false">Cancel</Button>
      <Button severity="primary" @click="dialogOpen = false">Rotate</Button>
    </template>
  </Dialog>

  <Dialog v-model:open="blockingOpen" title="Unsaved changes" :closable="false" :close-on-escape="false">
    No close button, no Escape, no click-outside — for a question that has to be answered. An X that is there but does
    nothing is worse than no X at all.
    <template #footer>
      <Button severity="primary" @click="blockingOpen = false">Done</Button>
    </template>
  </Dialog>
  <CodeExample :code="dialogExample" />

  <PropsTable :rows="dialogProps" />
</template>
