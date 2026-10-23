<script setup lang="ts">
import { DefinitionList, type DefinitionItem } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { definitionListExample } from '../../apiExamples';
import { definitionListProps } from '../../apiDocs';

const deal: DefinitionItem[] = [
  { key: 'ref', label: 'Deal ref', value: 'ETS-D-24017', mono: true },
  { key: 'instrument', label: 'Instrument', value: 'ASX base future' },
  { key: 'region', label: 'Region', value: 'NSW1', mono: true },
  { key: 'strip', label: 'Strip', value: 'Q1 2027' },
  { key: 'volume', label: 'Volume', value: '5.0 MW' },
  { key: 'price', label: 'Price', value: '$138.50 /MWh' },
  { key: 'broker', label: 'Broker', value: null },
  { key: 'notes', label: 'Notes', value: 'Hedge against the Q1 retail load forecast.', wide: true },
];
</script>

<template>
  <Specimen
    title="DefinitionList"
    note="Read-only label/value pairs for detail blades. Empty values render a dash rather than collapsing the row, so the grid stays aligned."
  >
    <DefinitionList :items="deal" />
  </Specimen>
  <Specimen title="Single column" note="For narrow blades.">
    <DefinitionList :items="deal.slice(0, 4)" :columns="1" />
  </Specimen>
  <CodeExample :code="definitionListExample" />

  <PropsTable :rows="definitionListProps" />
</template>
