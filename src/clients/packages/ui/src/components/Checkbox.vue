<script setup lang="ts">
import { Checkbox } from '@vuetify/v0/components';
import { computed, useId } from 'vue';
import Icon from './Icon.vue';

const props = withDefaults(
  defineProps<{
    label?: string;
    /** Help text under the control. */
    description?: string;
    disabled?: boolean;
    /**
     * Shows the state without offering to change it. Not the same as
     * `disabled`: a disabled control is refusing you and is dimmed to say so,
     * while a read-only one is reporting a fact. The box keeps full contrast
     * because it IS the value; the label mutes, matching how `.r-field`
     * marks a read-only field.
     */
    readonly?: boolean;
    /** Renders the mixed state. v0 keeps this distinct from checked. */
    indeterminate?: boolean;
  }>(),
  { label: undefined, description: undefined },
);

const model = defineModel<boolean>();
const checkedModel = computed<boolean>({
  get: () => model.value === true,
  set: (next: boolean) => {
    model.value = next === true;
  },
});

function onLabelClick(): void {
  if (props.disabled || props.readonly) return;
  model.value = model.value !== true;
}

/*
 * Labelled by aria-labelledby, not by a <label for>. Checkbox.Root renders a
 * <button role="checkbox">, and a <label for> pointing at a button associates
 * with nothing — the browser silently ignores it, so the control ends up
 * unlabelled to a screen reader while looking perfectly fine.
 */
const labelId = useId();
const describedBy = useId();

/*
 * Read-only renders a static `role="checkbox"` INSTEAD of Checkbox.Root, not
 * over it. Leaving v0's Root mounted and swallowing the events would mean
 * fighting a control that owns its own click and Space handling — and losing
 * that race silently flips a value the screen says cannot be changed. Nothing
 * to intercept is the only version that cannot get this wrong.
 *
 * Still a tab stop, and still announced with its state: a read-only field is
 * one a keyboard user should be able to reach and read, and `aria-readonly`
 * is what says "this one, you cannot toggle".
 */
const ariaChecked = computed<'true' | 'false' | 'mixed'>(() =>
  props.indeterminate ? 'mixed' : model.value === true ? 'true' : 'false',
);
</script>

<template>
  <div class="r-check" :class="{ 'r-check--readonly': readonly }">
    <!-- Read-only: a static checkbox, not a suppressed one. See the note above
         the computed. Same box markup, so the two states line up in a column. -->
    <span
      v-if="readonly"
      class="r-check__control r-check__control--readonly"
      role="checkbox"
      tabindex="0"
      :aria-checked="ariaChecked"
      aria-readonly="true"
      :aria-labelledby="label ? labelId : undefined"
      :aria-describedby="description ? describedBy : undefined"
    >
      <span class="r-check__box">
        <span v-if="ariaChecked !== 'false'" class="r-check__glyph">
          <Icon v-if="indeterminate" name="minus" :size="12" />
          <Icon v-else name="check" :size="12" />
        </span>
      </span>
    </span>

    <Checkbox.Root
      v-else
      v-model="checkedModel"
      class="r-check__control"
      :disabled="disabled"
      :indeterminate="indeterminate"
      :aria-labelledby="label ? labelId : undefined"
      :aria-describedby="description ? describedBy : undefined"
    >
      <!-- The box is OURS and always rendered; only the glyph lives inside
           Checkbox.Indicator. v0 sets `visibility: hidden` on the Indicator
           while unchecked, so putting the box there made the entire control
           invisible until ticked — a checkbox you cannot see to click. -->
      <span class="r-check__box">
        <Checkbox.Indicator class="r-check__glyph">
          <Icon v-if="indeterminate" name="minus" :size="12" />
          <Icon v-else name="check" :size="12" />
        </Checkbox.Indicator>
      </span>
    </Checkbox.Root>

    <div v-if="label || description" class="r-check__text">
      <!-- A span, not a <label> — see above. The click handler restores the
           "clicking the words toggles it" behaviour a real label would give. -->
      <span v-if="label" :id="labelId" class="r-check__label" @click="onLabelClick">
        {{ label }}
      </span>
      <p v-if="description" :id="describedBy" class="r-check__description">{{ description }}</p>
    </div>
  </div>
</template>

<style>
.r-check {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  font-family: var(--font-ui);
}

.r-check__control {
  display: inline-flex;
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.r-check__box {
  display: grid;
  width: 16px;
  height: 16px;
  /* Aligns the box with the cap height of the label beside it, rather than
       its line box, which otherwise sits the box a little high. */
  margin-top: 1px;
  border: 1px solid var(--border-input);
  border-radius: var(--r-xs);
  background: var(--bg-surface);
  color: var(--fg-on-accent);
  place-items: center;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out);
}

.r-check__glyph {
  display: grid;
  place-items: center;
}

/* Driven off the ARIA state v0 already sets, so there is no parallel class to
     keep in step. `mixed` is a distinct value, not a flavour of true. */
.r-check__control[aria-checked='true'] .r-check__box,
.r-check__control[aria-checked='mixed'] .r-check__box {
  border-color: var(--accent-fill);
  background: var(--accent-fill);
}

.r-check__control[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.55;
}

/*
 * Read-only is NOT a faded control. No opacity and no not-allowed cursor —
 * nothing here is refusing you, and the tick is data that has to stay legible.
 * What moves is the label, exactly as it does on a read-only `.r-field`: the
 * words mute, the value does not.
 */
.r-check__control--readonly {
  cursor: default;
}

.r-check--readonly .r-check__label {
  color: var(--fg-muted);
  cursor: default;
}

.r-check__label {
  font-size: var(--fs-base);
  line-height: var(--lh-snug);
  cursor: pointer;
}

.r-check__description {
  margin: 2px 0 0;
  color: var(--ets-hint-text);
  font-size: var(--fs-xs);
}
</style>
