<script setup lang="ts">
/**
 * The read-only face of a control that cannot simply pass `readonly` to a
 * native input — a listbox, a combobox, a chip editor.
 *
 * Rendered INSTEAD of the interactive control, not layered over it. The
 * alternative — leaving the popover wired and swallowing the clicks — leaves a
 * chevron that opens nothing and a trigger that takes Enter and does nothing,
 * which reads as broken rather than as read-only.
 *
 * **Focusable, because the value has to be copyable without a mouse.** A
 * focusable div would have been the smaller change but would not have done the
 * job: focus alone selects nothing, so Ctrl+C from one copies an empty
 * clipboard. A plain value therefore renders as a native `<input readonly>` —
 * a real tab stop, Ctrl+A selects within it, Ctrl+C copies. That is also what
 * `Input` does in its own read-only state, so the two paths now behave alike
 * instead of one of them being inert.
 *
 * The cost is a tab stop for every read-only field on a panel, which on a
 * mostly-read-only blade is a long tab route. That is the accepted trade: a
 * value you cannot copy is worse than a value you have to tab past.
 *
 * The input carries `id`, so the field's own `<label for>` names it — a real
 * association, not the one the previous version assumed. `<label for>` binds
 * only to labelable elements; aimed at a div it silently names nothing, so
 * this field used to reach a screen reader unnamed. Slot content cannot be an
 * input, so that branch is a focusable span named by `aria-label` instead.
 *
 * An absent value shows the em dash as a PLACEHOLDER rather than as content:
 * it marks "nothing is set" on screen without putting a dash on the clipboard
 * of anyone who copies the field.
 */
defineProps<{
  /** The value to show. Empty, null or undefined render the absent marker. */
  text?: string | null;
  /** The control's id, so the field's `<label for>` names the value. */
  id?: string;
  /** Accessible name for the slot branch, where `<label for>` cannot reach. */
  label?: string;
}>();
</script>

<template>
  <div class="r-field__control r-field__readonly">
    <!-- Slot branch: chips and other markup, which no input can hold. Focusable
         so it is still reachable; selection inside it is the browser's own. -->
    <span v-if="$slots.default" :id="id" class="r-field__readonly-value" tabindex="0" :aria-label="label">
      <slot />
    </span>

    <input
      v-else
      :id="id"
      class="r-field__readonly-value r-field__readonly-input"
      type="text"
      readonly
      :value="text ?? ''"
      placeholder="—"
    />
  </div>
</template>
