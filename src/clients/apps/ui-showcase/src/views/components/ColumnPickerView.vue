<script setup lang="ts">
import { ColumnPicker, type DataTableColumn } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { columnPickerExample } from '../../apiExamples';
import { columnPickerProps } from '../../apiDocs';

interface DealRow {
  ref: string;
  instrument: string;
  region: string;
  strip: string;
  mw: number;
  price: number;
  counterparty: string;
}

const columns: DataTableColumn<DealRow>[] = [
  { id: 'ref', header: 'Ref', field: 'ref' },
  { id: 'instrument', header: 'Instrument', field: 'instrument' },
  { id: 'region', header: 'Region', field: 'region' },
  { id: 'strip', header: 'Strip', field: 'strip' },
  { id: 'mw', header: 'MW', field: 'mw', align: 'end' },
  { id: 'price', header: 'Price $/MWh', field: 'price', align: 'end' },
  { id: 'counterparty', header: 'Counterparty', field: 'counterparty' },
];

const visible = ref<string[]>(['ref', 'instrument', 'region', 'mw', 'price']);
</script>

<template>
  <Specimen
    title="ColumnPicker"
    note="Shows and hides DataTable columns. Required columns stay ticked and cannot be turned off."
  >
    <div class="sb__row">
      <ColumnPicker v-model="visible" :all-columns="columns" :required-ids="['ref']" />
      <span
        >Visible: <code>{{ visible.join(', ') }}</code></span
      >
    </div>
  </Specimen>
  <CodeExample :code="columnPickerExample" />

  <PropsTable :rows="columnPickerProps" />
</template>
