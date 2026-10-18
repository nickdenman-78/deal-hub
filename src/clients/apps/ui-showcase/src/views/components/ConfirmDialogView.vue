<script setup lang="ts">
import { Button, ConfirmDialog } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { confirmDialogExample } from '../../apiExamples';
import { confirmDialogProps } from '../../apiDocs';

/*
 * The dialog sits OUTSIDE the Specimen. Specimen renders its slot twice (light
 * and dark), so a dialog inside it would open twice on top of itself.
 */
const open = ref(false);
const lastAnswer = ref('—');

function answer(value: string) {
  lastAnswer.value = value;
  open.value = false;
}
</script>

<template>
  <Specimen
    title="ConfirmDialog"
    note="The declarative form behind confirm(). Use it when the dialog needs a richer body than a message string; otherwise prefer confirm()."
  >
    <div class="sb__row">
      <Button severity="error" icon="x" @click="open = true">Cancel deal…</Button>
      <span
        >Last answer: <code>{{ lastAnswer }}</code></span
      >
    </div>
  </Specimen>
  <ConfirmDialog
    :open="open"
    title="Cancel deal ETS-D-24017?"
    confirm-label="Cancel deal"
    cancel-label="Keep deal"
    destructive
    @confirm="answer('confirmed')"
    @cancel="answer('cancelled')"
  >
    Settlement and Risk will drop this deal from their positions. This cannot be undone.
  </ConfirmDialog>
  <CodeExample :code="confirmDialogExample" />

  <PropsTable :rows="confirmDialogProps" />
</template>
