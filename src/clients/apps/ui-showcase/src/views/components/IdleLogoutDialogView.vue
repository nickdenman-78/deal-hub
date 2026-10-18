<script setup lang="ts">
import { Button, IdleLogoutDialog } from '@ets/ui';
import { onBeforeUnmount, ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { idleLogoutDialogExample } from '../../apiExamples';
import { idleLogoutDialogProps } from '../../apiDocs';

/*
 * A simulated countdown, so the dialog can be seen without waiting for a real
 * idle timeout. In an app, useIdleTimeout() drives `open` and `seconds`.
 * Kept outside the Specimen for the same reason as ConfirmDialog: Specimen
 * renders its slot twice.
 */
const WARNING_SECONDS = 30;
const open = ref(false);
const seconds = ref(WARNING_SECONDS);
let timer: ReturnType<typeof setInterval> | undefined;

function stop() {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
  open.value = false;
}

function start() {
  stop();
  seconds.value = WARNING_SECONDS;
  open.value = true;
  timer = setInterval(() => {
    seconds.value -= 1;
    if (seconds.value <= 0) stop();
  }, 1000);
}

onBeforeUnmount(stop);
</script>

<template>
  <Specimen
    title="IdleLogoutDialog"
    note="The warning shown before an inactive session is signed out. It cannot be dismissed with Escape: staying signed in is a deliberate act."
  >
    <div class="sb__row">
      <Button icon="clock" @click="start">Simulate idle warning</Button>
    </div>
  </Specimen>
  <IdleLogoutDialog :open="open" :seconds="seconds" :warning-seconds="WARNING_SECONDS" @stay="stop" />
  <CodeExample :code="idleLogoutDialogExample" />

  <PropsTable :rows="idleLogoutDialogProps" />
</template>
