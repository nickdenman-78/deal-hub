<script setup lang="ts">
/**
 * Credit card number field — digits in `v-model`, grouped display when resting.
 */
import { computed } from 'vue';
import MaskedInput from './MaskedInput.vue';
import type { InputSize } from './Input.vue';
import { creditCardRule, maskCreditCard, obscureCreditCard, unformatCreditCard } from './creditCard';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    /** Overrides the default Luhn rule when provided. */
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    editable?: boolean;
    /**
     * Resting display only — asterisks + last four digits. Full digits stay in
     * `v-model`; focusing reveals them for editing.
     */
    masked?: boolean;
    /**
     * When true (default), the field advertises `autocomplete="cc-number"` so
     * browsers and password managers can fill it. When false, autocomplete is
     * off and common manager ignore attributes are set.
     */
    autofill?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: 'ACCT-000006',
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
    autofill: true,
  },
);

const model = defineModel<string | undefined>();

const effectiveRules = computed(() => props.rules ?? [creditCardRule()]);
const restingMask = computed(() => (props.masked ? obscureCreditCard : maskCreditCard));
const autocomplete = computed(() => (props.autofill ? 'cc-number' : 'off'));
const managerIgnoreAttrs = computed(() =>
  props.autofill
    ? {}
    : {
        'data-1p-ignore': true,
        'data-lpignore': 'true',
        'data-bwignore': true,
        'data-form-type': 'other',
      },
);
</script>

<template>
  <MaskedInput
    v-model="model"
    :label="label"
    :description="description"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rules="effectiveRules"
    :error="error"
    :error-messages="errorMessages"
    :size="size"
    :editable="editable"
    :autocomplete="autocomplete"
    :input-attrs="managerIgnoreAttrs"
    :mask="unformatCreditCard"
    :blur-mask="restingMask"
  />
</template>
