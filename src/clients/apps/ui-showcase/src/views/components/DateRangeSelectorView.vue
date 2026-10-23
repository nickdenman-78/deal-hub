<script setup lang="ts">
import { DateRangeSelector, addLocalDays, lastNDaysRange, type DateRange, type DateRangePreset } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dateRangeSelectorExample } from '../../apiExamples';
import { dateRangePresetProps, dateRangeSelectorProps } from '../../apiDocs';

const range = ref<DateRange>({});
const customPresets = ref<DateRange>({});

/**
 * Replace the built-in catalog. Each entry needs a stable id, a label, and a
 * resolve() that returns inclusive ISO dates for the given local today.
 */
const WINDOW_PRESETS: DateRangePreset[] = [
  {
    id: 'yesterday',
    label: 'Yesterday',
    resolve: ({ today }) => {
      const day = addLocalDays(today, -1);
      return { from: day, to: day };
    },
  },
  {
    id: 'last-7',
    label: 'Last 7 days',
    resolve: ({ today }) => lastNDaysRange(today, 7),
  },
];
</script>

<template>
  <Specimen
    title="DateRangeSelector"
    note="Single collapsed control: relative presets snapshot into a DateRange, plus Custom… for an explicit from/to pair in the same popover. Collapsed label shows the matching preset name for today, or an en-AU formatted range (01/07/2026 – 31/07/2026). Keeps the same DateRange model as DateRangePicker."
  >
    <div class="sb__stack">
      <DateRangeSelector v-model="range" label="Date range" clearable />
      <p class="sb__state">
        Value: <code>{{ JSON.stringify(range) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Custom presets"
    note="Pass a DateRangePreset[] to replace the default catalog. Define id + label + resolve({ today }) in script — helpers like addLocalDays and lastNDaysRange keep calendar math local. Empty array leaves Custom… alone."
  >
    <div class="sb__stack">
      <DateRangeSelector v-model="customPresets" label="Window" size="sm" clearable :presets="WINDOW_PRESETS" />
      <p class="sb__state">
        Value: <code>{{ JSON.stringify(customPresets) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Read-only"
    note="Not a pass-through, despite the shape: the date pickers live inside the popover panel, so forwarding to them would have left the trigger live. The whole control is replaced by its resolved label, in a readonly input you can tab to and copy the range out of."
  >
    <div class="sb__stack">
      <DateRangeSelector :model-value="{ from: '2026-08-01', to: '2026-08-31' }" label="Period" readonly />
    </div>
  </Specimen>

  <CodeExample :code="dateRangeSelectorExample" />
  <PropsTable :rows="dateRangeSelectorProps" />
  <PropsTable title="DateRangePreset" :rows="dateRangePresetProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
