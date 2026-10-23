<script setup lang="ts">
/**
 * National Metering Identifier — raw alnum in `v-model`, spaced checksum when resting.
 */
import { computed } from 'vue';
import MaskedInput from './MaskedInput.vue';
import type { InputSize } from './Input.vue';
import { maskNmi, nmiRule, unformatNmi } from './nmi';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    /** Overrides the default AEMO checksum rule when provided. */
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    size?: InputSize;
    editable?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: 'XXXXXXXXXX C',
    rules: undefined,
    errorMessages: undefined,
    size: 'md',
  },
);

const model = defineModel<string | undefined>();

const effectiveRules = computed(() => props.rules ?? [nmiRule()]);
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
    :mask="unformatNmi"
    :blur-mask="maskNmi"
  />
</template>
