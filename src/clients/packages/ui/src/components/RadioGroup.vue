<script setup lang="ts" generic="TValue extends string | number">
/*
 * A labelled radio list — the single-choice control for MODES, where each
 * option deserves a sentence of explanation and exactly one can hold.
 *
 * ToggleGroup already does single-select, but a segmented control earns its
 * compactness by dropping the descriptions: it suits short filter values, not
 * decisions like "Now / Later / Recurring schedule" where the option text
 * alone undersells what each choice commits the user to. Radios carry a
 * per-option description line and read top-to-bottom like the decision they
 * represent.
 *
 * Built on v0's Radio compound, which renders `role="radiogroup"` and
 * button-based `role="radio"` items with roving tabindex and arrow-key
 * traversal — none of that is reimplemented here. The model is the selected
 * option's value, undefined until a choice is made; radio semantics mean a
 * selection can be changed but never cleared.
 */
import { Radio } from '@vuetify/v0/components';
import { useId } from 'vue';

export interface RadioOption<TValue> {
  value: TValue;
  label: string;
  /** Secondary line under the label explaining what the option commits to. */
  description?: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: readonly RadioOption<TValue>[];
    /** Names the group for assistive tech. */
    label: string;
    disabled?: boolean;
    /** Stacks options (default) or lays them out in a wrapping row. */
    orientation?: 'vertical' | 'horizontal';
    size?: 'sm' | 'md';
  }>(),
  { orientation: 'vertical', size: 'md' },
);

const model = defineModel<TValue | undefined>();

/*
 * Labelled by aria-labelledby, not by a <label for>. Radio.Root renders a
 * <button role="radio">, and a <label for> pointing at a button associates
 * with nothing — the same silent failure Checkbox documents. The click
 * handler on the label span restores "clicking the words selects it".
 */
const baseId = useId();

function optionLabelId(index: number): string {
  return `${baseId}-opt-${index}`;
}

function optionDescriptionId(index: number): string {
  return `${baseId}-opt-${index}-desc`;
}

function select(option: RadioOption<TValue>): void {
  if (props.disabled || option.disabled) return;
  model.value = option.value;
}

const groupLabelId = `${baseId}-group`;
</script>

<template>
  <!--
    v0's Radio registry never selects a disabled item, so a disabled Radio.Group
    showed no selection at all — reading as "nothing chosen" rather than "fixed
    to this". A disabled group therefore renders a static radiogroup with the
    same markup and ARIA state, and no interaction to suppress.
  -->
  <div
    v-if="disabled"
    role="radiogroup"
    aria-disabled="true"
    :aria-labelledby="groupLabelId"
    class="r-radios"
    :class="[`r-radios--${size}`, `r-radios--${orientation}`]"
  >
    <span :id="groupLabelId" class="r-radios__group-label">{{ label }}</span>
    <div v-for="(option, index) in options" :key="String(option.value)" class="r-radios__option">
      <span
        role="radio"
        class="r-radios__control"
        :aria-checked="model === option.value ? 'true' : 'false'"
        aria-disabled="true"
        :aria-labelledby="optionLabelId(index)"
        :aria-describedby="option.description ? optionDescriptionId(index) : undefined"
      >
        <span class="r-radios__circle">
          <span v-if="model === option.value" class="r-radios__glyph">
            <span class="r-radios__dot" />
          </span>
        </span>
      </span>

      <div class="r-radios__text">
        <span :id="optionLabelId(index)" class="r-radios__label">{{ option.label }}</span>
        <p v-if="option.description" :id="optionDescriptionId(index)" class="r-radios__description">
          {{ option.description }}
        </p>
      </div>
    </div>
  </div>

  <Radio.Group
    v-else
    v-model="model"
    class="r-radios"
    :class="[`r-radios--${size}`, `r-radios--${orientation}`]"
    :label="label"
    :disabled="disabled"
  >
    <div v-for="(option, index) in options" :key="String(option.value)" class="r-radios__option">
      <Radio.Root
        class="r-radios__control"
        :value="option.value"
        :disabled="disabled || option.disabled"
        :aria-labelledby="optionLabelId(index)"
        :aria-describedby="option.description ? optionDescriptionId(index) : undefined"
      >
        <!-- The circle is OURS and always rendered; only the dot lives inside
             Radio.Indicator. v0 hides the Indicator while unchecked, so putting
             the circle there would leave unselected options invisible. -->
        <span class="r-radios__circle">
          <Radio.Indicator class="r-radios__glyph">
            <span class="r-radios__dot" />
          </Radio.Indicator>
        </span>
      </Radio.Root>

      <div class="r-radios__text">
        <span :id="optionLabelId(index)" class="r-radios__label" @click="select(option)">
          {{ option.label }}
        </span>
        <p v-if="option.description" :id="optionDescriptionId(index)" class="r-radios__description">
          {{ option.description }}
        </p>
      </div>
    </div>
  </Radio.Group>
</template>

<style>
.r-radios {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  font-family: var(--font-ui);
}

.r-radios--horizontal {
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-4);
}

.r-radios__option {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
}

.r-radios__control {
  display: inline-flex;
  flex: none;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.r-radios__circle {
  display: grid;
  width: 16px;
  height: 16px;
  /* Aligns the circle with the cap height of the label beside it, matching
     the checkbox's box alignment. */
  margin-top: 1px;
  border: 1px solid var(--border-input);
  border-radius: 50%;
  background: var(--bg-surface);
  place-items: center;
  transition: border-color var(--dur-fast) var(--ease-out);
}

.r-radios--sm .r-radios__circle {
  width: 14px;
  height: 14px;
}

.r-radios__glyph {
  display: grid;
  place-items: center;
}

.r-radios__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-fill);
}

/* Dot and circle must share parity: a 7px dot in a 14px circle centres on a
   half-pixel, and pixel snapping paints it visibly off-centre at common
   display scales. 6px keeps the gap a whole 4px per side. */
.r-radios--sm .r-radios__dot {
  width: 6px;
  height: 6px;
}

/* Driven off the ARIA state v0 already sets, so there is no parallel class to
   keep in step. */
.r-radios__control[aria-checked='true'] .r-radios__circle {
  border-color: var(--accent-fill);
}

.r-radios__control[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.55;
}

/* Names the static (disabled) group for assistive tech without drawing it —
   Radio.Group's own `label` is likewise not rendered visibly. */
.r-radios__group-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.r-radios__control[aria-disabled='true'] + .r-radios__text {
  opacity: 0.55;
}

.r-radios__label {
  font-size: var(--fs-base);
  line-height: var(--lh-snug);
  cursor: pointer;
}

.r-radios--sm .r-radios__label {
  font-size: var(--fs-sm);
}

.r-radios__description {
  margin: 2px 0 0;
  color: var(--ets-hint-text);
  font-size: var(--fs-xs);
}
</style>
