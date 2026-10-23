<script setup lang="ts">
import { Button, useToast } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { toastExample } from '../../apiExamples';
import { toastProps } from '../../apiDocs';

const toast = useToast();
</script>

<template>
  <Specimen
    title="Toasts"
    note="Errors do NOT auto-dismiss — a toast reporting a failure is often the only record of it, and 3 seconds is gone before you have finished reading. Successes clear quickly because they confirm something already on screen."
  >
    <div class="sb__row">
      <Button variant="outlined" size="sm" @click="toast.success('Configuration published', 'staging')">Success</Button>
      <Button variant="outlined" size="sm" @click="toast.info('Composition refreshed')">Info</Button>
      <Button
        variant="outlined"
        size="sm"
        @click="toast.warn('Missing secret', 'kv:pricing-api-key resolved to a placeholder.')"
      >
        Warning
      </Button>
      <Button size="sm" severity="error" @click="toast.error('Publish failed', 'The environment registry is locked.')">
        Error (stays)
      </Button>
    </div>
  </Specimen>
  <CodeExample :code="toastExample" />

  <PropsTable :rows="toastProps" title="useToast()" note="Mount ToastHost once in the app shell." />
</template>
