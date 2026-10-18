<script setup lang="ts">
import { DatePicker, WEEKEND_DAYS } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { datePickerExample } from '../../apiExamples';
import { datePickerProps } from '../../apiDocs';

const effectiveFrom = ref<string | undefined>('2026-07-01');
const bounded = ref<string | undefined>(undefined);
const businessDay = ref<string | undefined>('2026-07-03');
const locked = ref<string | undefined>('2026-01-01');

const holidays = ['2026-12-25', '2026-12-26', '2027-01-01'];
</script>

<template>
  <Specimen
    title="DatePicker"
    note="Native input[type=date] in the field chrome: click the icon or empty control space to open the calendar, click a datepart to edit it, Escape returns to the first datepart, Tab leaves in one stop (arrows between parts), and the value is an ISO yyyy-mm-dd string. Impossible dates, min/max breaches, disabled weekdays and holiday lists paint the field error — the browser chooser cannot grey those days out. The popup itself cannot be themed."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <DatePicker v-model="effectiveFrom" label="Effective from" />
        <p class="sb__state">
          Model: <code>{{ effectiveFrom ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <DatePicker
          v-model="bounded"
          label="Settlement date"
          description="Within the current financial year."
          min="2026-07-01"
          max="2027-06-30"
          required
        />
        <p class="sb__state">
          Model: <code>{{ bounded ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <DatePicker
          v-model="businessDay"
          label="Business day"
          description="Weekends and public holidays are rejected after selection."
          :disabled-weekdays="WEEKEND_DAYS"
          :disabled-dates="holidays"
        />
        <p class="sb__state">
          Model: <code>{{ businessDay ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <DatePicker v-model="locked" label="Locked" disabled size="sm" />
        <p class="sb__state">
          Model: <code>{{ locked ?? 'undefined' }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="The native input takes readonly, and the calendar opener is guarded too — some browsers still open the picker from the indicator on a read-only field."
  >
    <div class="sb__stack">
      <DatePicker model-value="2026-07-01" label="Valid from" readonly />
      <DatePicker label="Ended" readonly />
    </div>
  </Specimen>

  <CodeExample :code="datePickerExample" />

  <PropsTable :rows="datePickerProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
