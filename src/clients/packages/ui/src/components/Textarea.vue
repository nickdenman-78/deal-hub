<script setup lang="ts">
/**
 * Multi-line input. Shares Input's validation wiring by reusing Input.Root and
 * rendering the control `as="textarea"` — so rules, error messages and the
 * aria-describedby plumbing behave identically to a single-line field rather
 * than being reimplemented alongside it.
 */
import { Input } from '@vuetify/v0/components';
import { useId } from 'vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    rules?: ((value: unknown) => true | string)[];
    error?: boolean;
    errorMessages?: string | string[];
    /**
     * @deprecated Paints nothing. An editable field is now just a field; the
     * treatment moved to `readonly`. Kept so consumers keep compiling.
     */
    editable?: boolean;
    /** Renders the value in the monospace face — for JSON and config blobs. */
    mono?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: undefined,
    rows: 4,
    rules: undefined,
    errorMessages: undefined,
  },
);

const model = defineModel<string | undefined>();
const fieldId = useId();
</script>

<template>
  <Input.Root
    :id="fieldId"
    v-model="model"
    class="r-field r-field--area"
    :class="{
      'r-field--editable': editable && !readonly,
      'r-field--readonly': readonly,
      'r-field--disabled': disabled,
    }"
    :label="label"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rules="rules"
    :error="error"
    :error-messages="errorMessages"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <div class="r-field__control">
      <Input.Control
        as="textarea"
        class="r-field__input r-field__textarea"
        :class="{ 'r-field__input--mono': mono }"
        :rows="rows"
        :placeholder="placeholder"
      />
    </div>

    <Input.Description v-if="props.description" class="r-field__hint">{{ props.description }}</Input.Description>

    <Input.Error v-slot="{ errors }" class="r-field__error">
      <span v-for="message in errors" :key="message">{{ message }}</span>
    </Input.Error>
  </Input.Root>
</template>

<style>
/* A textarea's box grows with its content, so the fixed control heights that
     line single-line fields up in a toolbar must not apply here. */
.r-field--area .r-field__control {
  height: auto;
  align-items: stretch;
  padding: var(--sp-2);
}

.r-field__textarea {
  min-height: 0;
  /* Vertical only: a horizontally resizable field can be dragged wider than
       the panel it sits in. */
  resize: vertical;
  line-height: var(--lh-base);
}

.r-field__input--mono {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
}
</style>
