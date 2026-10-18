<script setup lang="ts">
import { Accordion, AccordionItem } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { accordionExample } from '../../apiExamples';
import { accordionProps, accordionItemProps } from '../../apiDocs';

const open = ref<string | number | undefined>('billing');
const horizontalOpen = ref<string | number | undefined>('keys');
const multiOpen = ref<Array<string | number>>(['billing', 'backup']);
</script>

<template>
  <Specimen
    title="Accordion"
    note="One panel open at a time by default. ExpansionPanel keeps every body mounted and hides closed ones with hidden — form state survives a collapse."
  >
    <Accordion v-model="open">
      <AccordionItem value="billing">
        <template #header>Billing</template>
        Invoice cadence, payment methods, and the overnight settlement window.
      </AccordionItem>
      <AccordionItem value="access">
        <template #header>Access</template>
        Two groups and four operators with publish rights on this service.
      </AccordionItem>
      <AccordionItem value="backup">
        <template #header>Backup</template>
        Nightly encrypted snapshots retained for thirty days.
      </AccordionItem>
      <AccordionItem value="archive" disabled>
        <template #header>Archive</template>
        Nothing here — the panel is disabled.
      </AccordionItem>
    </Accordion>
  </Specimen>

  <Specimen
    title="Accordion — horizontal"
    note="Same compound API with orientation flipped. Closed columns stay as a header strip; the open column claims the remaining width."
  >
    <Accordion v-model="horizontalOpen" orientation="horizontal" style="min-height: 14rem">
      <AccordionItem value="keys">
        <template #header>Keys</template>
        Twelve configuration keys across four environments.
      </AccordionItem>
      <AccordionItem value="access">
        <template #header>Access</template>
        Two groups, four operators.
      </AccordionItem>
      <AccordionItem value="backup">
        <template #header>Backup</template>
        Nightly, encrypted.
      </AccordionItem>
    </Accordion>
  </Specimen>

  <Specimen title="Accordion — multiple" note="multiple lets several panels stay open; v-model becomes an array.">
    <Accordion v-model="multiOpen" multiple>
      <AccordionItem value="billing">
        <template #header>Billing</template>
        Invoice cadence and payment methods.
      </AccordionItem>
      <AccordionItem value="access">
        <template #header>Access</template>
        Groups and operators.
      </AccordionItem>
      <AccordionItem value="backup">
        <template #header>Backup</template>
        Nightly encrypted snapshots.
      </AccordionItem>
    </Accordion>
  </Specimen>

  <Specimen
    title="Accordion — plain"
    note="No outer frame or header fill — for category groups above list rows (Services)."
  >
    <Accordion v-model="multiOpen" multiple variant="plain">
      <AccordionItem value="billing">
        <template #header>Billing</template>
        Invoice cadence and payment methods.
      </AccordionItem>
      <AccordionItem value="access">
        <template #header>Access</template>
        Groups and operators.
      </AccordionItem>
      <AccordionItem value="backup">
        <template #header>Backup</template>
        Nightly encrypted snapshots.
      </AccordionItem>
    </Accordion>
  </Specimen>

  <CodeExample :code="accordionExample" />

  <PropsTable :rows="accordionProps" title="Accordion" />
  <PropsTable :rows="accordionItemProps" title="AccordionItem" />
</template>
