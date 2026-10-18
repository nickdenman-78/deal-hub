<script setup lang="ts">
/**
 * Type-to-filter selection on v0's Combobox, which owns the filtering, the
 * virtual focus (aria-activedescendant rather than real focus, so the caret
 * stays in the text field) and the listbox roles.
 *
 * `strict: false` — the typed text is a valid value even when it matches no
 * option. These fields are mostly free-text-with-suggestions: a service name
 * that does not exist yet is exactly what you are typing when you create one.
 */
import { Combobox } from '@vuetify/v0/components';
import ComboboxKeyboard from '../internal/ComboboxKeyboard.vue';
import { useId } from 'vue';
import Icon from './Icon.vue';
import FieldReadonly from './FieldReadonly.vue';

withDefaults(
  defineProps<{
    /** Suggestions. Plain strings — these fields suggest text, not records. */
    options: readonly string[];
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Show the current value as text; the menu is not rendered. */
    readonly?: boolean;
    /** Rejects anything not in `options`. */
    strict?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    /**
     * `focus` (default) opens the menu whenever the field gains focus.
     * `click` waits for a click, typing or ArrowDown — use it for a field that
     * may receive focus programmatically (a blade focuses its first control on
     * open), where an unasked-for menu would cover the rest of the form.
     */
    openOn?: 'focus' | 'click';
  }>(),
  { label: undefined, description: undefined, placeholder: undefined, size: 'md', openOn: 'focus' },
);

const model = defineModel<string | undefined>();

const fieldId = useId();

/*
 * EVERY option is rendered. Do not filter this list.
 *
 * v0 owns the filtering: Combobox.Item ends in `v-show="isFiltered"`, matching
 * against the query v0 keeps internally — the text the operator has typed,
 * which is NOT this component's model. The model only changes on select.
 *
 * Filtering here as well looked reasonable and was actively wrong: only
 * model-matching options were ever registered, so v0 could filter no wider than
 * that subset. With "finance" selected, typing "pl" left a list containing just
 * "finance", which v0 then filtered out — so the field showed "No matches" while
 * "platform" sat in `options`, unrendered.
 */
</script>

<template>
  <div
    class="r-field"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">{{ label }}</label>

    <!-- The hint is a Combobox.Description inside the root (see the note
         below), which is not rendered while read-only, so it is repeated here
         as a plain <p> rather than lost. -->
    <template v-if="readonly">
      <FieldReadonly :id="fieldId" :text="model" />
      <p v-if="description" class="r-field__hint">{{ description }}</p>
    </template>

    <!--
      No :aria-describedby here. Combobox.Root renders a FRAGMENT, so a stray
      attribute on it is dropped with a Vue warning and the description reaches
      nothing — the hint was invisible to a screen reader while looking correct
      on screen. v0 wires it itself when the description is a
      Combobox.Description inside the root, which is what the one below is.
    -->
    <Combobox.Root v-else :id="fieldId" v-slot="{ open }" v-model="model" :disabled="disabled" :strict="strict">
      <!--
        Combobox.Activator, NOT a plain div, and it is what anchors the panel.

        v0 positions the menu with the CSS anchor API: Combobox.Content gets
        `position-anchor: --v-N`, and the matching `anchor-name` comes from the
        ACTIVATOR. Without one rendered, that reference resolves to nothing —
        and a `position: fixed` element with an unresolvable anchor is not
        left where it was, it falls back to the viewport origin. The menu
        appeared in the top-left corner of the screen, nowhere near its field.

        It renders a div by default, so it simply IS the field control wrapper;
        no extra element. Select has always used Select.Activator, which is why
        that one positioned correctly and this one did not.
      -->
      <!-- openOn="click": v0's control knows only focus/input, so it is given
           `input` (typing still opens) and the click is wired here. -->
      <Combobox.Activator class="r-field__control" @click="openOn === 'click' && !disabled && open()">
        <Combobox.Control
          class="r-field__input"
          :placeholder="placeholder"
          :open-on="openOn === 'click' ? 'input' : 'focus'"
        />
        <Icon class="r-combobox__chevron" name="chevron-down" :size="14" />
      </Combobox.Activator>

      <!--
        `eager` is load-bearing, not an optimisation knob.

        Combobox.Content mounts its children through useLazy(isOpen), and v0
        derives the input's displayed text from the SELECTED TICKET while the
        field is pristine — not from the model. Lazily mounted, no item has
        registered on first render, so there is no ticket for the current
        value and a field with `modelValue: 'finance'` renders BLANK until the
        operator opens the menu. Worse than cosmetic: the field looks empty on
        a form loaded from an existing record.

        The list here is a plain string array, so mounting it up front costs
        nothing. A future virtualised or async-loaded variant would need the
        display resolved another way rather than dropping this.
      -->
      <Combobox.Content eager class="r-select__menu">
        <Combobox.Item v-for="option in options" :key="option" class="r-select__option" :value="option">
          {{ option }}
        </Combobox.Item>
        <!-- Rendered rather than collapsing the panel: a list that vanishes as
             you type reads as broken, where "no matches" reads as an answer. -->
        <Combobox.Empty class="r-combobox__empty">No matches</Combobox.Empty>
      </Combobox.Content>

      <Combobox.Description v-if="description" class="r-field__hint">{{ description }}</Combobox.Description>

      <!-- Renders nothing. Restores the arrow keys once the list is filtered —
           see the file for the v0 behaviour it works around. Must be INSIDE the
           root, which is where the combobox context lives. -->
      <ComboboxKeyboard />
    </Combobox.Root>
  </div>
</template>

<style>
.r-combobox__chevron {
  flex: none;
  color: var(--fg-faint);
}

.r-combobox__empty {
  padding: var(--sp-2);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
