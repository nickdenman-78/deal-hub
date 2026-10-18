<script setup lang="ts">
import { Combobox } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { comboboxExample } from '../../apiExamples';
import { comboboxProps } from '../../apiDocs';

const OWNERS = ['trading desk', 'platform', 'finance', 'operations'];
const owner = ref<string | undefined>('finance');
const strictOwner = ref<string | undefined>('platform');
</script>

<template>
  <Specimen
    title="Combobox"
    note="Free text with suggestions — for a field that usually repeats a known value but must accept a new one. Type to filter, then arrow down into the filtered list and press Enter; the first arrow goes to the current selection when it survived the filter, and to the first visible option when it did not."
  >
    <div class="sb__stack">
      <Combobox v-model="owner" :options="OWNERS" label="Owner" placeholder="Start typing…" />
      <Combobox
        v-model="strictOwner"
        :options="OWNERS"
        label="Owner (strict)"
        description="Rejects anything not in the list."
        strict
      />
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="The value is shown as a readonly input and the menu is not rendered — a real tab stop, so the value can be selected and copied without a mouse. The hint moves out of the combobox root with it, so it is not lost."
  >
    <div class="sb__stack">
      <Combobox
        :options="['Essential Energy', 'Ausgrid', 'Ergon']"
        model-value="Essential Energy"
        label="Distributor"
        description="Set by MSATS, not here."
        readonly
      />
    </div>
  </Specimen>

  <CodeExample :code="comboboxExample" />

  <PropsTable :rows="comboboxProps" />
</template>
