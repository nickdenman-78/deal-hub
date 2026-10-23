<script setup lang="ts">
import { Button, Drawer, Input } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { drawerExample } from '../../apiExamples';
import { drawerProps } from '../../apiDocs';

const drawerOpen = ref(false);
const modelessOpen = ref(false);
</script>

<template>
  <Specimen title="Drawer" note="An app-level edge panel. Distinct from BladeAside, which belongs to the blade stack.">
    <div class="sb__row">
      <Button variant="outlined" @click="drawerOpen = true">Open drawer</Button>
      <Button variant="outlined" @click="modelessOpen = true">Open modeless drawer</Button>
    </div>
  </Specimen>

  <Drawer v-model:open="drawerOpen" title="Filters">
    <div class="sb__stack">
      <Input label="Service name" icon="search" />
      <Input label="Owner" />
    </div>
    <template #footer>
      <Button variant="outlined" @click="drawerOpen = false">Clear</Button>
      <Button severity="primary" @click="drawerOpen = false">Apply</Button>
    </template>
  </Drawer>

  <Drawer v-model:open="modelessOpen" title="Details" side="start" modeless>
    Modeless: no scrim, and the page behind stays clickable.
  </Drawer>
  <CodeExample :code="drawerExample" />

  <PropsTable :rows="drawerProps" />
</template>
