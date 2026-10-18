<script setup lang="ts">
/**
 * A yes/no prompt built on v0's AlertDialog.
 *
 * AlertDialog rather than Dialog: an alert dialog is modal and interruptive by
 * definition, announces as `role="alertdialog"`, and moves focus to the
 * dialog rather than merely trapping it. That is the correct semantic for
 * "you are about to lose work".
 *
 * `blocking` is on: click-outside and Escape do NOT dismiss. Dismissing a
 * destructive confirmation by missing the button is how people lose things.
 */
import { AlertDialog } from '@vuetify/v0/components';
import Button from './Button.vue';

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Paints the confirm action as destructive. */
    destructive?: boolean;
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel' },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <AlertDialog.Root :model-value="open" @update:model-value="(value) => !value && emit('cancel')">
    <AlertDialog.Content class="r-confirm" :blocking="true" :close-on-click-outside="false" :close-on-escape="false">
      <AlertDialog.Title class="r-confirm__title">{{ title }}</AlertDialog.Title>
      <AlertDialog.Description class="r-confirm__body">
        <slot />
      </AlertDialog.Description>

      <!-- Plain Buttons rather than AlertDialog.Cancel / .Action. Those
           sub-components exist to close the dialog themselves, but `open` here
           is owned by the caller (the dirty guard holds a navigation open on a
           promise), so their closing behaviour would fight it. Focus management
           comes from AlertDialog.Content regardless — it is the Content that
           traps focus, not the action buttons.

           Cancel first in the DOM so it is the first tab stop, and the safe
           option is what a hurried Enter lands on. -->
      <div class="r-confirm__actions">
        <Button variant="outlined" @click="emit('cancel')">{{ cancelLabel }}</Button>
        <Button :severity="destructive ? 'error' : 'primary'" @click="emit('confirm')">
          {{ confirmLabel }}
        </Button>
      </div>
    </AlertDialog.Content>
  </AlertDialog.Root>
</template>

<style>
/*
   * Centring a native <dialog> is `inset: 0` + `margin: auto`, NOT
   * top/left 50% with a translate.
   *
   * The UA stylesheet already gives a modal dialog `margin: auto`, which is
   * what centres it. Adding `left: 50%` on top does not replace that — the box
   * is placed at the 50% offset and THEN the auto margins distribute the
   * remaining free space, pushing it further right. `translate(-50%, -50%)`
   * pulls back by half the dialog's own width, which is a fixed amount, so the
   * two never cancel: the error is proportional to the viewport and the dialog
   * drifts further off-centre the wider the window gets. That is exactly the
   * "does not centre on different sizes" symptom.
   *
   * `height: fit-content` is needed because the UA sets a height on modal
   * dialogs; without it `margin: auto` has no free space to distribute
   * vertically and the dialog sticks to the top.
   */
.r-confirm {
  position: fixed;
  z-index: 60;
  inset: 0;
  width: min(30rem, calc(100vw - var(--sp-8)));
  height: fit-content;
  max-height: calc(100dvh - var(--sp-8));
  margin: auto;
  padding: var(--sp-5);
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  box-shadow: var(--shadow-modal);
}

.r-confirm::backdrop {
  background: var(--bg-overlay);
}

.r-confirm__title {
  margin: 0 0 var(--sp-2);
  color: var(--fg-primary);
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: var(--fw-regular);
}

.r-confirm__body {
  margin: 0;
  color: var(--fg-secondary);
  font-size: var(--fs-base);
  line-height: var(--lh-base);
}

.r-confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
  margin-top: var(--sp-5);
}
</style>
