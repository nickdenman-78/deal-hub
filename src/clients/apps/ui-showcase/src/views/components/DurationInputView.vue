<script setup lang="ts">
import { DurationInput } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { durationInputExample } from '../../apiExamples';
import { durationInputProps } from '../../apiDocs';

const requestTimeout = ref('30s');
const retentionWindow = ref('7d');
const gracePeriod = ref('90m');
</script>

<template>
  <Specimen
    title="DurationInput"
    note="A text field, not a number-plus-unit pair. These values are compound — 1d12h — and a unit dropdown forces every one of them through a single unit; it also loses on round-trip, since an existing “90m” has to be shown as either 90 minutes or 1.5 hours and either choice rewrites a value nobody touched. The line underneath is where a typo’d 2h30s gets caught: 2h30m is only obviously right once something reads it back."
  >
    <div class="sb__stack">
      <DurationInput
        v-model="requestTimeout"
        label="Request timeout"
        description="How long the gateway waits before giving up."
        :presets="['5s', '30s', '2m']"
        :min="1000"
        :max="300000"
      />
      <p class="sb__state">
        Model: <code>{{ requestTimeout }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="DurationInput — units, presets and normalising"
    note="Type “30” and it is refused, on purpose: thirty of what? Seconds to one service and milliseconds to the next, and a field that guesses sets a timeout a thousand times too long without saying anything. Zero is the exception — it is the same duration in every unit. The second field normalises on blur, so 90m becomes 1h30m; that is off by default, because a field that silently rewrites what you typed is one you stop trusting."
  >
    <div class="sb__stack">
      <DurationInput v-model="retentionWindow" label="Retention" :presets="['1d', '7d', '30d']" />
      <DurationInput
        v-model="gracePeriod"
        label="Grace period (normalises on blur)"
        description="Try 90m, then click away."
        normalize
      />
      <p class="sb__state">
        Models: <code>{{ retentionWindow }}</code> · <code>{{ gracePeriod }}</code>
      </p>
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="Typing is refused and the presets withdraw — a preset button is an edit affordance."
  >
    <div class="sb__stack">
      <DurationInput model-value="30m" label="Interval length" :presets="['5m', '15m', '30m']" readonly />
    </div>
  </Specimen>

  <CodeExample :code="durationInputExample" />

  <PropsTable :rows="durationInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
