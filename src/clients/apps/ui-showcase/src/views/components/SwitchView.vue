<script setup lang="ts">
import { Switch } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { switchExample } from '../../apiExamples';
import { switchProps } from '../../apiDocs';

const maintenance = ref(false);
</script>

<template>
  <Specimen
    title="Switch"
    note="For a setting that takes effect immediately. If it needs a Save button next to it, it is a checkbox."
  >
    <div class="sb__stack">
      <Switch v-model="maintenance" label="Maintenance mode" />
      <Switch model-value disabled label="Audit logging (mandatory)" />
    </div>
  </Specimen>
  <CodeExample :code="switchExample" />

  <PropsTable :rows="switchProps" />
</template>
