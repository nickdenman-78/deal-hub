<script setup lang="ts">
/**
 * One step's content. Renders only while its step is the current one.
 *
 * Deliberately NOT the Tabs behaviour of keeping every panel mounted and
 * hiding the inactive ones. A wizard's later steps are downstream of earlier
 * ones — restore's review step exists because compare returned something —
 * so mounting them up front runs their setup against data that does not exist
 * yet, and leaves stale results from a previous run in the DOM for anything
 * walking it. Anything that must survive leaving a step belongs in the state
 * the flow owns, not in a panel's local refs.
 */
import { computed, inject } from 'vue';
import { stepperKey } from './stepper';

const props = defineProps<{ value: string }>();

const stepper = inject(stepperKey, null);
if (!stepper) throw new Error('<StepperPanel> must be used inside a <Stepper>.');

const active = computed(() => stepper.current.value === props.value);
const label = computed(() => stepper.steps.value.find((step) => step.value === props.value)?.label);
</script>

<template>
  <section v-if="active" class="r-stepper__panel" :aria-label="label">
    <slot />
  </section>
</template>
