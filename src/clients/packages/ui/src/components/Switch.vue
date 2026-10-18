<script setup lang="ts">
/**
 * A switch, not a checkbox: a switch takes effect immediately, a checkbox is
 * a value you then submit. Using the wrong one is the difference between "this
 * is now on" and "this will be on when you save".
 */
import { Switch } from '@vuetify/v0/components';
import { useId } from 'vue';

withDefaults(
  defineProps<{
    label?: string;
    disabled?: boolean;
  }>(),
  { label: undefined },
);

const model = defineModel<boolean>();
const fieldId = useId();
</script>

<template>
  <div class="r-switch">
    <Switch.Root :id="fieldId" v-model="model" class="r-switch__control" :disabled="disabled">
      <Switch.Track class="r-switch__track">
        <Switch.Thumb class="r-switch__thumb" />
      </Switch.Track>
    </Switch.Root>
    <label v-if="label" class="r-switch__label" :for="fieldId">{{ label }}</label>
  </div>
</template>

<style>
.r-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-family: var(--font-ui);
}

.r-switch__control {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.r-switch__track {
  display: flex;
  width: 32px;
  height: 18px;
  align-items: center;
  padding: 2px;
  border-radius: var(--r-pill);
  background: var(--border-strong);
  transition: background-color var(--dur-fast) var(--ease-out);
}

.r-switch__thumb {
  width: 14px;
  height: 14px;
  border-radius: var(--r-pill);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  transition: transform var(--dur-fast) var(--ease-out);
}

.r-switch__control[aria-checked='true'] .r-switch__track {
  background: var(--accent-fill);
}

/* Travel = track width - thumb width - padding both sides. Written as a sum
     so changing any one of those does not silently misalign the thumb. */
.r-switch__control[aria-checked='true'] .r-switch__thumb {
  transform: translateX(calc(32px - 14px - 4px));
}

/*
 * aria-disabled, NOT [disabled]. Switch.Root renders a <button> and v0 marks it
 * disabled with aria-disabled/data-disabled rather than the boolean attribute —
 * so `[disabled]` matched nothing and a disabled switch was pixel-identical to
 * an enabled one.
 */
.r-switch__control[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.55;
}

.r-switch__label {
  font-size: var(--fs-base);
  cursor: pointer;
}
</style>
