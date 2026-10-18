<script setup lang="ts">
import { DateTimePicker } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dateTimePickerExample } from '../../apiExamples';
import { dateTimePickerProps } from '../../apiDocs';

const effective = ref<string | undefined>('2026-07-01T09:30');
const windowed = ref<string | undefined>(undefined);
const withSeconds = ref<string | undefined>('2026-07-01T14:30:00');
</script>

<template>
  <Specimen
    title="DateTimePicker"
    note="One v-model, two controls: DatePicker and TimePicker side by side. The model is yyyy-mm-ddTHH:mm (datetime-local shape, no timezone). A date without a time becomes midnight; clearing the date clears the value. min/max are full datetimes — the time bound only applies on that calendar day. Prefer this over input[type=datetime-local], which piles every part into one field and fights the chrome/Tab behaviour we already own."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <DateTimePicker v-model="effective" label="Effective from" />
        <p class="sb__state">
          Model: <code>{{ effective ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <DateTimePicker
          v-model="windowed"
          label="Trading window open"
          description="Not before market open on the first day."
          min="2026-07-01T09:00"
          max="2026-07-31T16:30"
          required
        />
        <p class="sb__state">
          Model: <code>{{ windowed ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <DateTimePicker v-model="withSeconds" label="Settlement instant" :step="1" />
        <p class="sb__state">
          Model: <code>{{ withSeconds ?? 'undefined' }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <Specimen title="Read-only" note="Forwarded to the date and time pickers beneath.">
    <div class="sb__stack">
      <DateTimePicker model-value="2026-08-28T04:12" label="Last sync" readonly />
    </div>
  </Specimen>

  <CodeExample :code="dateTimePickerExample" />

  <PropsTable :rows="dateTimePickerProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
