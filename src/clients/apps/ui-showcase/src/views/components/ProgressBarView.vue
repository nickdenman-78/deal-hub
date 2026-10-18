<script setup lang="ts">
import { Button, ProgressBar } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { progressBarExample } from '../../apiExamples';
import { progressBarProps } from '../../apiDocs';

const progress = ref(38);
</script>

<template>
  <Specimen
    title="ProgressBar"
    note="Determinate only — it takes a value. For work of unknown length use Spinner, on the Feedback page."
  >
    <div class="sb__stack">
      <ProgressBar :value="progress" label="Publishing" show-value />
      <ProgressBar :value="100" label="Complete" severity="success" show-value />
      <ProgressBar :value="72" label="Quota used" severity="warning" show-value />
      <ProgressBar :value="96" label="Disk" severity="error" show-value />
      <div class="sb__row">
        <Button variant="outlined" size="sm" @click="progress = Math.max(0, progress - 10)">-10</Button>
        <Button variant="outlined" size="sm" @click="progress = Math.min(100, progress + 10)">+10</Button>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="progressBarExample" />

  <PropsTable :rows="progressBarProps" />
</template>
