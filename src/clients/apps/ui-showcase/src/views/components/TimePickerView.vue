<script setup lang="ts">
import { TimePicker } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { timePickerExample } from '../../apiExamples';
import { timePickerProps } from '../../apiDocs';

const start = ref<string | undefined>('09:00');
const windowed = ref<string | undefined>(undefined);
const withSeconds = ref<string | undefined>('14:30:00');
const locked = ref<string | undefined>('12:00');
</script>

<template>
  <Specimen
    title="TimePicker"
    note="Native input[type=time] in the field chrome — same pattern as DatePicker: icon or empty control space opens the picker, timeparts edit on click, Escape returns to the first part, Tab leaves in one stop, and impossible / out-of-range values paint the field error. The model is HH:mm (or HH:mm:ss when step is under 60). The popup is the browser's."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <TimePicker v-model="start" label="Start time" />
        <p class="sb__state">
          Model: <code>{{ start ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <TimePicker
          v-model="windowed"
          label="Trading window open"
          description="Between market open and close."
          min="09:00"
          max="16:30"
          required
        />
        <p class="sb__state">
          Model: <code>{{ windowed ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <TimePicker v-model="withSeconds" label="Settlement instant" :step="1" />
        <p class="sb__state">
          Model: <code>{{ withSeconds ?? 'undefined' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <TimePicker v-model="locked" label="Locked" disabled size="sm" />
        <p class="sb__state">
          Model: <code>{{ locked ?? 'undefined' }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <Specimen title="Read-only" note="As DatePicker: the native input takes readonly and the clock opener is guarded.">
    <div class="sb__stack">
      <TimePicker model-value="04:12" label="Last RDCS sync" readonly />
    </div>
  </Specimen>

  <CodeExample :code="timePickerExample" />

  <PropsTable :rows="timePickerProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
