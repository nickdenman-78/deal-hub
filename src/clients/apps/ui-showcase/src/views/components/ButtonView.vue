<script setup lang="ts">
import { Button } from '@ets/ui';
import type { ButtonSeverity, ButtonVariant } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { buttonExample } from '../../apiExamples';
import { buttonProps } from '../../apiDocs';

const acting = ref(false);
function act() {
  acting.value = true;
  window.setTimeout(() => (acting.value = false), 3000);
}

const severities: ButtonSeverity[] = ['primary', 'secondary', 'success', 'info', 'warning', 'error'];
const variants: ButtonVariant[] = ['basic', 'raised', 'raisedText', 'outlined', 'text', 'link'];
</script>

<template>
  <Specimen
    title="Severity × variant"
    note="Severity is colour/intent; variant is treatment. basic (the default) is always filled. secondary is the default severity — a screen of primaries has no primary."
  >
    <div class="btn-matrix">
      <div class="btn-matrix__head" />
      <div v-for="variant in variants" :key="variant" class="btn-matrix__head">{{ variant }}</div>
      <template v-for="severity in severities" :key="severity">
        <div class="btn-matrix__label">{{ severity }}</div>
        <Button v-for="variant in variants" :key="variant" :severity="severity" :variant="variant">{{
          variant === 'link' ? 'Learn more' : 'Action'
        }}</Button>
      </template>
    </div>
  </Specimen>

  <Specimen title="Sizes" note="Heights sit on the 4px grid so buttons line up with inputs in a toolbar.">
    <div class="sb__row">
      <Button variant="outlined" size="sm">Small</Button>
      <Button variant="outlined" size="md">Medium</Button>
      <Button variant="outlined" size="lg">Large</Button>
    </div>
  </Specimen>

  <Specimen
    title="With icons"
    note="Icon-only is inferred from an icon with no label — and then aria-label is required."
  >
    <div class="sb__row">
      <Button icon="plus" severity="primary">Add service</Button>
      <Button variant="outlined" icon-end="chevron-down">Options</Button>
      <Button variant="outlined" icon="external-link" icon-end="chevron-right">Both</Button>
      <Button variant="outlined" icon="x" aria-label="Close" />
      <Button icon="trash-2" severity="error" aria-label="Delete" />
    </div>
  </Specimen>

  <Specimen title="Weight" note="regular is for quiet chrome (command rails); medium remains the default.">
    <div class="sb__row">
      <Button variant="outlined" weight="medium">Medium</Button>
      <Button variant="outlined" weight="regular">Regular</Button>
      <Button severity="primary" variant="link" weight="regular" icon="plus">New key</Button>
    </div>
  </Specimen>

  <Specimen title="Disabled" note="Removed from the tab order too — a focusable disabled control is a keyboard trap.">
    <div class="sb__row">
      <Button severity="primary" disabled>Save</Button>
      <Button variant="outlined" disabled>Cancel</Button>
      <Button severity="error" disabled>Delete</Button>
    </div>
  </Specimen>

  <Specimen
    title="Busy (action running)"
    note="The house style for an action button. The button disables and its label and icon fade in and out — no spinner, so it still reads under Windows' 'Animation effects: off', and the operator can see which action is running. Swap the label to a present participle. Click to see it."
  >
    <div class="sb__row">
      <Button severity="primary" icon="search" :busy="acting" @click="act">
        {{ acting ? 'Searching…' : 'Search' }}
      </Button>
      <Button variant="outlined" icon="save" :busy="acting" @click="act">
        {{ acting ? 'Saving…' : 'Save' }}
      </Button>
      <Button variant="text" icon="refresh-cw" :busy="acting" aria-label="Refresh" @click="act" />
    </div>
  </Specimen>

  <Specimen title="Block" note="Full width, for stacked dialog footers on narrow panels.">
    <div class="sb__stack">
      <Button severity="primary" block>Confirm</Button>
      <Button variant="outlined" block>Cancel</Button>
    </div>
  </Specimen>
  <CodeExample :code="buttonExample" />

  <PropsTable :rows="buttonProps" />
</template>

<style scoped>
.btn-matrix {
  display: grid;
  grid-template-columns: 6.5rem repeat(6, minmax(0, auto));
  align-items: center;
  gap: var(--sp-3) var(--sp-4);
}

.btn-matrix__head,
.btn-matrix__label {
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}

.btn-matrix__label {
  text-align: right;
}
</style>
