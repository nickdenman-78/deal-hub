<script setup lang="ts">
/**
 * A modal dialog on v0's Dialog, which renders a native <dialog> and opens it
 * with showModal() — so it lands in the top layer, gets a real ::backdrop, and
 * traps focus without any of that being our problem.
 *
 * ConfirmDialog is separate and built on AlertDialog: an alert dialog
 * announces as `role="alertdialog"` and is the right semantic for "you are
 * about to lose work". This one is the general-purpose container.
 */
import { Dialog } from '@vuetify/v0/components';
import { computed } from 'vue';
import Button from './Button.vue';

const props = withDefaults(
  defineProps<{
    /** Override with the `title` slot when the heading needs markup. */
    title: string;
    /** Sub-line under the title. Also wired to aria-describedby by v0. */
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    /**
     * Any CSS width, for the handful of dialogs that are neither a form nor a
     * pane — a side-by-side diff needs the viewport, a countdown needs almost
     * none. Still capped to the viewport. Prefer `size`.
     */
    width?: string;
    /**
     * Renders the header's close button. Turn it OFF for a dialog the
     * operator must answer — an X that does nothing is worse than no X.
     */
    closable?: boolean;
    closeOnEscape?: boolean;
    /**
     * Defaults to FALSE, unlike click-outside-to-close elsewhere. Most
     * dialogs here hold unsaved input, and dismissing a form by missing the
     * button is how people lose work.
     */
    closeOnClickOutside?: boolean;
  }>(),
  {
    description: undefined,
    size: 'md',
    width: undefined,
    closable: true,
    closeOnEscape: true,
    closeOnClickOutside: false,
  },
);

const open = defineModel<boolean>('open', { required: true });

/*
 * v0 calls scrim-dismissal `blocking`, which is the inverse of ours and
 * covers only the scrim. Escape is a separate flag on the same element.
 */
const style = computed(() => (props.width === undefined ? undefined : { '--r-dialog-width': props.width }));
</script>

<template>
  <Dialog.Root v-model="open">
    <Dialog.Content
      class="r-dialog"
      :class="[`r-dialog--${size}`, { 'r-dialog--custom-width': width !== undefined }]"
      :style="style"
      :blocking="!closeOnClickOutside"
      :close-on-click-outside="closeOnClickOutside"
      :close-on-escape="closeOnEscape"
    >
      <header class="r-dialog__header">
        <div class="r-dialog__heading">
          <!-- Dialog.Title still renders even when the slot replaces its text:
               it is what v0 wires aria-labelledby to, so replacing the element
               would leave the dialog unnamed. -->
          <Dialog.Title class="r-dialog__title"
            ><slot name="title">{{ title }}</slot></Dialog.Title
          >
          <Dialog.Description v-if="description" class="r-dialog__description">
            {{ description }}
          </Dialog.Description>
        </div>
        <Button
          v-if="closable"
          variant="text"
          size="sm"
          icon="x"
          :aria-label="`Close ${title}`"
          @click="open = false"
        />
      </header>

      <div class="r-dialog__body"><slot /></div>

      <footer v-if="$slots.footer" class="r-dialog__footer"><slot name="footer" /></footer>
    </Dialog.Content>
  </Dialog.Root>
</template>

<style>
/*
   * Centred by `inset: 0` + `margin: auto`, NOT top/left 50% with a translate.
   * The UA already gives a modal dialog `margin: auto`; adding an offset places
   * the box and THEN distributes free space, so the two never cancel and the
   * error grows with the viewport. `height: fit-content` gives the auto margins
   * something to distribute vertically.
   */
.r-dialog {
  position: fixed;
  max-height: calc(100dvh - var(--sp-8));
  inset: 0;
  height: fit-content;
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  color: var(--fg-primary);
  box-shadow: var(--shadow-modal);
}

/*
   * `display` is set ONLY on the open state, and that is load-bearing.
   *
   * The UA stylesheet hides a closed dialog with `dialog:not([open]) { display:
   * none }`. A bare `display: flex` on `.r-dialog` outranks it, so every closed
   * dialog renders in place, permanently visible, stacked on top of the page —
   * with no error and nothing in the DOM to suggest it should not be there.
   */
.r-dialog[open] {
  display: flex;
  flex-direction: column;
}

.r-dialog::backdrop {
  background: var(--bg-overlay);
}

.r-dialog--sm {
  width: min(24rem, calc(100vw - var(--sp-8)));
}

.r-dialog--md {
  width: min(34rem, calc(100vw - var(--sp-8)));
}

.r-dialog--lg {
  width: min(52rem, calc(100vw - var(--sp-8)));
}

/* Last, so it beats whichever size class is also present. Still capped to the
     viewport — an explicit width is a preference, not a licence to overflow. */
.r-dialog--custom-width {
  width: min(var(--r-dialog-width), calc(100vw - var(--sp-8)));
}

.r-dialog__header {
  display: flex;
  flex: none;
  align-items: flex-start;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border-bottom: 1px solid var(--border-subtle);
}

.r-dialog__heading {
  flex: 1;
  min-width: 0;
}

.r-dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  font-weight: var(--fw-regular);
}

.r-dialog__description {
  margin: 2px 0 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

/* Scrolls, so a long form never pushes the footer off-screen. */
.r-dialog__body {
  flex: 1;
  min-height: 0;
  padding: var(--sp-4);
  overflow-y: auto;
}

.r-dialog__footer {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
}
</style>
