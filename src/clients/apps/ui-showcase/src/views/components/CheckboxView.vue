<script setup lang="ts">
import { Checkbox } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { checkboxExample } from '../../apiExamples';
import { checkboxProps } from '../../apiDocs';

const publish = ref(true);
const archive = ref(false);
// A parent whose children are partly selected: `indeterminate` is a third
// visual state, kept separate from the boolean, so it has to be derived.
const childA = ref(true);
const childB = ref(false);
</script>

<template>
  <Specimen
    title="Checkbox"
    note="The root is a button[role=checkbox], so it is labelled by aria-labelledby rather than a <label for> — which would silently associate with nothing."
  >
    <div class="sb__stack">
      <Checkbox v-model="publish" label="Publish on save" />
      <Checkbox v-model="archive" label="Archive instead of deleting" description="Recoverable for 30 days." />
      <Checkbox model-value disabled label="Enforced by policy" />
    </div>
  </Specimen>

  <Specimen
    title="Checkbox — read-only vs disabled"
    note="Disabled is refusing you, so it dims. Read-only is reporting a fact, so it does not: the tick keeps full contrast because it IS the value, and only the label mutes — the same move a read-only .r-field makes. It stays a tab stop, and it is a static role=checkbox rather than a suppressed one, so there is no handler left to lose a race with."
  >
    <div class="sb__stack">
      <Checkbox model-value readonly label="GreenPower" />
      <Checkbox :model-value="false" readonly label="Embedded network" />
      <Checkbox readonly indeterminate label="Partly metered" />
      <Checkbox model-value disabled label="Enforced by policy" />
    </div>
  </Specimen>

  <Specimen
    title="Checkbox — indeterminate"
    note="A third visual state, kept distinct from checked because a parent that is partly selected is neither. It is derived, never stored: toggle a child and watch the parent."
  >
    <div class="sb__stack">
      <Checkbox
        :model-value="childA && childB"
        :indeterminate="childA !== childB"
        label="Trading"
        @update:model-value="
          (v: boolean | undefined) => {
            childA = !!v;
            childB = !!v;
          }
        "
      />
      <div class="sb__indent">
        <Checkbox v-model="childA" label="pricing-api" />
        <Checkbox v-model="childB" label="deals-sync" />
      </div>
    </div>
  </Specimen>
  <CodeExample :code="checkboxExample" />

  <PropsTable :rows="checkboxProps" />
</template>

<style scoped>
.sb__indent {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding-left: var(--sp-5);
}
</style>
