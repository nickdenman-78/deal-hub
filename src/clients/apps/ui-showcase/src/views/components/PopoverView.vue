<script setup lang="ts">
import { Button, Checkbox, Popover } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { popoverExample } from '../../apiExamples';
import { popoverProps } from '../../apiDocs';

/*
 * No v-model on the Popover below, and that is the point of this note rather
 * than an omission. Specimen renders its slot TWICE (light and dark), so a
 * single ref would be shared by two instances — and `popover="auto"` elements
 * are mutually exclusive, so opening the second light-dismisses the first,
 * whose close then writes false back and shuts both. The pair reads as
 * completely dead. Bind a model only when one instance needs driving.
 */
</script>

<template>
  <Specimen
    title="Popover"
    note="An anchored panel with arbitrary content, positioned with CSS anchor positioning rather than a JS floating library — no scroll or resize listeners to keep in sync. Distinct from Menu (a list of commands) and Tooltip (supplementary text): a Popover can hold controls, so it takes focus. Left uncontrolled here; see the note in this file about sharing one v-model across two instances."
  >
    <div class="sb__row">
      <Popover label="Column options" position-area="bottom span-right">
        <template #trigger="{ open }">
          <Button variant="outlined" icon="sliders-horizontal" icon-end="chevron-down" :aria-expanded="open"
            >Columns</Button
          >
        </template>
        <template #default="{ close }">
          <div class="sb__stack">
            <strong>Visible columns</strong>
            <Checkbox model-value label="Name" />
            <Checkbox model-value label="Owner" />
            <Checkbox label="Keys" />
            <Button size="sm" severity="primary" @click="close">Done</Button>
          </div>
        </template>
      </Popover>
    </div>
  </Specimen>
  <CodeExample :code="popoverExample" />

  <PropsTable :rows="popoverProps" />
</template>
