<script setup lang="ts">
import { MonthPicker, monthOfDate } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { monthPickerExample } from '../../apiExamples';
import { monthPickerProps } from '../../apiDocs';

const term = ref<string | undefined>('2026-08');
const empty = ref<string | undefined>(undefined);
const bounded = ref<string | undefined>('2026-06');
const clearable = ref<string | undefined>('2026-08');

const now = new Date();
const lastMonth = monthOfDate(new Date(now.getFullYear(), now.getMonth() - 1, 15));
</script>

<template>
  <Specimen
    title="MonthPicker"
    note="A year header and a grid of twelve. Deliberately NOT the native input[type=month] — that is the opposite call to DatePicker's, because Firefox and Safari do not implement it at all and degrade to a plain text box. A month grid is also not a calendar: twelve fixed cells, no week starts, no locale-dependent first day, no day arithmetic. The part that made hand-rolling a calendar unwise is the part this does not have."
  >
    <div class="sb__stack">
      <MonthPicker v-model="term" label="Billing term" />
      <p class="sb__note">
        Value: <code>{{ term ?? 'undefined' }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="MonthPicker — the value is a string"
    note="An ISO yyyy-MM string, the same one input[type=month] speaks, so a screen already on the native control moves across without touching its bindings. Never a Date: a month has no day, and every representation that invents one lands on the timezone bug DatePicker documents — new Date('2026-08') is UTC midnight on the 1st, which is July anywhere behind Greenwich."
  >
    <div class="sb__stack">
      <MonthPicker v-model="empty" label="Nothing chosen" />
      <p class="sb__note">
        Value: <code>{{ empty ?? 'undefined' }}</code> — the placeholder is shown, not an em dash; the field is still a
        control.
      </p>
    </div>
  </Specimen>

  <Specimen
    title="MonthPicker — min and max"
    note="Out-of-range months render disabled rather than absent. A grid that changes shape is harder to read than one with an unavailable cell, and the months that would go missing are the very ones the operator is looking for. An unparsable bound is treated as no bound: a typo'd max must not quietly disable all twelve, which reads as the screen being broken with nothing to say why."
  >
    <div class="sb__stack">
      <MonthPicker v-model="bounded" label="Within 2026 H1–Q3" min="2026-03" max="2026-09" />
      <MonthPicker :model-value="lastMonth" label="Nothing in the future" :max="lastMonth" />
    </div>
  </Specimen>

  <Specimen
    title="MonthPicker — read-only and disabled"
    note="Read-only shows the month as a value and does not render the grid at all, the same call Select makes: a trigger that opens nothing reads as broken rather than as read-only. The value sits in a native readonly input, so it is a tab stop you can select and copy the month out of."
  >
    <div class="sb__stack">
      <MonthPicker model-value="2026-08" label="Billing term" readonly />
      <MonthPicker label="Never set" readonly />
      <MonthPicker model-value="2026-08" label="Locked by the run" disabled />
    </div>
  </Specimen>

  <Specimen
    title="MonthPicker — clearable"
    note="The clear control appears only once there is something to clear, and sits beside the trigger rather than inside it — a button in a button is markup browsers reparent. Clearing sets undefined, not an empty string."
  >
    <div class="sb__stack">
      <MonthPicker v-model="clearable" label="Optional term" clearable />
      <p class="sb__note">
        Value: <code>{{ clearable ?? 'undefined' }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="MonthPicker — keyboard"
    note="The APG grid pattern with the year as the outer axis. One tab stop for the whole grid (a roving tabindex), then: Left/Right step a month and roll into the neighbouring year, Up/Down move a row of three, PageUp/PageDown step a year, Home/End go to January and December of the year on screen. Arrows MOVE and do not select — Enter or Space selects — because on a grid that commits on arrival, arrowing across to December would set eleven wrong values on the way."
  >
    <div class="sb__stack">
      <MonthPicker v-model="term" label="Try it with the keyboard" />
    </div>
  </Specimen>

  <CodeExample :code="monthPickerExample" />

  <PropsTable :rows="monthPickerProps" />
</template>

<style scoped>
.sb__note {
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
