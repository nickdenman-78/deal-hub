<script setup lang="ts">
import { DateRangePicker, type DateRange } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dateRangePickerExample } from '../../apiExamples';
import { dateRangePickerProps } from '../../apiDocs';

const range = ref<DateRange>({ from: '2026-07-01', to: '2026-07-31' });
const bounded = ref<DateRange>({});
</script>

<template>
  <Specimen
    title="DateRangePicker"
    note="Two DatePickers, one DateRange value ({ from?, to? } — an object, not a tuple, because range.from survives a refactor better than range[0]). Each side becomes the other's bound, so an inverted range cannot be entered — only arrived at by editing — and that leftover case surfaces as a field error rather than a silent swap. Half-open ranges are legitimate filters, not errors."
  >
    <div class="sb__stack">
      <DateRangePicker v-model="range" label="Audit period" />
      <p class="sb__state">
        Value: <code>{{ JSON.stringify(range) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Outer bounds"
    note="min and max clamp both ends from the outside; the cross-constraint then narrows each side further inside them."
  >
    <DateRangePicker
      v-model="bounded"
      label="Settlement window"
      description="Within the 2026 financial year."
      min="2025-07-01"
      max="2026-06-30"
      size="sm"
    />
  </Specimen>
  <Specimen title="Read-only" note="Forwarded to both date pickers beneath.">
    <div class="sb__stack">
      <DateRangePicker :model-value="{ from: '2026-07-01', to: '2026-07-31' }" label="Billing term" readonly />
    </div>
  </Specimen>

  <CodeExample :code="dateRangePickerExample" />

  <PropsTable :rows="dateRangePickerProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
