<script setup lang="ts">
import { Button, Input, Message, Stepper, StepperPanel } from '@ets/ui';
import type { StepperStep } from '@ets/ui';
import { computed, ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { stepperExample } from '../../apiExamples';
import { stepperProps, stepperStepProps, stepperPanelProps } from '../../apiDocs';

// A gated flow: each step's button is the only way forward, which is what the
// linear strip is for.
type WizardStep = 'account' | 'plan' | 'review' | 'done';
const step = ref<WizardStep>('account');
const email = ref('');
const confirmed = ref(false);

const wizard = computed<StepperStep<WizardStep>[]>(() => [
  { value: 'account', label: 'Account', description: 'Who is this for' },
  { value: 'plan', label: 'Plan', description: 'What they get' },
  { value: 'review', label: 'Review', description: 'Check it over' },
  { value: 'done', label: 'Done', description: 'Outcome', status: confirmed.value ? 'success' : undefined },
]);

function restart() {
  step.value = 'account';
  email.value = '';
  confirmed.value = false;
}

// Same component, sections rather than gates — every marker stays live.
type SectionStep = 'general' | 'network' | 'limits';
const section = ref<SectionStep>('general');
const SECTIONS: StepperStep<SectionStep>[] = [
  { value: 'general', label: 'General' },
  { value: 'network', label: 'Network' },
  { value: 'limits', label: 'Limits' },
];

// A finished flow that finished badly.
const OUTCOME: StepperStep[] = [
  { value: 'a', label: 'Upload' },
  { value: 'b', label: 'Validate', status: 'warning' },
  { value: 'c', label: 'Import', status: 'error' },
];
</script>

<template>
  <Specimen
    title="Stepper — a gated flow"
    note="Not tabs. The markers report progress (done / here / not yet), only the active panel renders, and the strip is linear: it walks backwards so a mistake is fixable, but forward is the footer button's job — a clickable marker past the review is a way to skip it."
  >
    <Stepper v-model="step" :steps="wizard" label="Signup steps">
      <StepperPanel value="account">
        <Input v-model="email" label="Email" placeholder="someone@example.com" />
      </StepperPanel>
      <StepperPanel value="plan">
        <p class="sb__state">Plan choices would go here. Nothing has been created yet.</p>
      </StepperPanel>
      <StepperPanel value="review">
        <Message severity="warning">This creates the account. Check the address above.</Message>
        <p class="sb__state">
          Creating an account for <code>{{ email || '—' }}</code
          >.
        </p>
      </StepperPanel>
      <StepperPanel value="done">
        <Message severity="success">Account created.</Message>
      </StepperPanel>

      <template #actions="{ isFirst, prev }">
        <Button v-if="!isFirst && step !== 'done'" variant="outlined" icon="arrow-left" @click="prev">Back</Button>
        <Button v-if="step === 'account'" severity="primary" :disabled="!email" @click="step = 'plan'">Continue</Button>
        <Button v-else-if="step === 'plan'" severity="primary" @click="step = 'review'">Continue</Button>
        <Button
          v-else-if="step === 'review'"
          severity="primary"
          @click="
            () => {
              confirmed = true;
              step = 'done';
            }
          "
          >Create account</Button
        >
        <Button v-else variant="outlined" @click="restart">Start again</Button>
      </template>
    </Stepper>
  </Specimen>

  <Specimen
    title="Stepper — non-linear"
    note="linear=false when the steps are sections of one form rather than gates: every marker stays clickable, in any order."
  >
    <Stepper v-model="section" :steps="SECTIONS" label="Settings sections" :linear="false">
      <StepperPanel value="general"><p class="sb__state">General settings.</p></StepperPanel>
      <StepperPanel value="network"><p class="sb__state">Network settings.</p></StepperPanel>
      <StepperPanel value="limits"><p class="sb__state">Limits.</p></StepperPanel>
    </Stepper>
  </Specimen>

  <Specimen
    title="Stepper — reported outcomes"
    note="A step's `status` overrides what its position implies, so a finished flow stops claiming it went well. The word a screen reader hears changes with it — colour is never the only signal."
  >
    <Stepper :steps="OUTCOME" model-value="c" label="Import outcome" />
  </Specimen>

  <Specimen title="Stepper — vertical" note="Same strip down the side, for narrow columns and long labels.">
    <Stepper v-model="section" :steps="SECTIONS" label="Settings sections" orientation="vertical" :linear="false">
      <StepperPanel value="general"><p class="sb__state">General settings.</p></StepperPanel>
      <StepperPanel value="network"><p class="sb__state">Network settings.</p></StepperPanel>
      <StepperPanel value="limits"><p class="sb__state">Limits.</p></StepperPanel>
    </Stepper>
  </Specimen>

  <CodeExample :code="stepperExample" />

  <PropsTable :rows="stepperProps" />
  <PropsTable :rows="stepperPanelProps" title="StepperPanel" note="One step's content." />
  <PropsTable :rows="stepperStepProps" title="StepperStep" note="Shape of each entry in `steps`." />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
