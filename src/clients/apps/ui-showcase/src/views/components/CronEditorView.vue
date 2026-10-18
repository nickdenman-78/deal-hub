<script setup lang="ts">
import { CronEditor } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { cronEditorExample } from '../../apiExamples';
import { cronEditorProps } from '../../apiDocs';

const backupSchedule = ref('0 2 * * *');
const rotationSchedule = ref('*/15 9-17 * * 1-5');
const readonlySchedule = ref('0 9 * * 1-5');
</script>

<template>
  <Specimen
    title="CronEditor"
    note="Blurred: human-readable schedule (cronstrue). Focused: parts editor (prose is hidden). Info icon (non-tabbable) lists the next five runs."
  >
    <div class="sb__stack">
      <CronEditor v-model="backupSchedule" label="Backup schedule" description="Five fields, server local time." />
      <p class="sb__state">
        Expression: <code>{{ backupSchedule }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="CronEditor — a denser expression"
    note="Every 15 minutes, business hours, weekdays. Each segment still round-trips; the summary restates recognised shapes and falls back to a field readout otherwise."
  >
    <div class="sb__stack">
      <CronEditor v-model="rotationSchedule" label="Key rotation" />
      <p class="sb__state">
        Expression: <code>{{ rotationSchedule }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="CronEditor — readonly"
    note="Prose stays on focus. No parts editor, and the tint is suppressed even when is also set."
  >
    <div class="sb__stack">
      <CronEditor v-model="readonlySchedule" label="Publish schedule" readonly />
      <p class="sb__state">
        Expression: <code>{{ readonlySchedule }}</code>
      </p>
    </div>
  </Specimen>

  <CodeExample :code="cronEditorExample" />

  <PropsTable :rows="cronEditorProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
