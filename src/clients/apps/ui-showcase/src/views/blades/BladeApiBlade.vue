<script setup lang="ts">
/**
 * Showcase-only API surface for Blade / BladeLink. Lives in its own panel so
 * the Deals demo stays a deal list, and so the props tables get the widest
 * blade (`fill`) rather than competing with the sm list column.
 */
import { Blade } from '@ets/ui';
import CodeExample from '../../components/CodeExample.vue';
import PropsTable from '../../components/PropsTable.vue';
import { bladeExample } from '../../apiExamples';
import { bladeLinkProps, bladeProps } from '../../apiDocs';
</script>

<template>
  <Blade title="Blade API" subtitle="Props & example" size="fill">
    <CodeExample :code="bladeExample" />
    <PropsTable
      :rows="bladeProps"
      title="Blade"
      note="One panel in a BladeStack. Nested RouterView inside increments depth."
    />
    <PropsTable :rows="bladeLinkProps" title="BladeLink" note="Row that opens a child blade." />
  </Blade>
</template>
