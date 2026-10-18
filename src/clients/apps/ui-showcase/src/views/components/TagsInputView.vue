<script setup lang="ts">
import { TagsInput } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { tagsInputExample } from '../../apiExamples';
import { tagsInputProps } from '../../apiDocs';

const owners = ref(['trading-desk', 'platform']);
const alertRoutes = ref<string[]>([]);
const manyTags = ref([
  'trading-desk',
  'platform',
  'sre',
  'data-platform',
  'billing',
  'settlements',
  'ops',
  'security',
  'customer-care',
  'market-ops',
  'ets-core',
  'config-server',
]);
</script>

<template>
  <Specimen
    title="TagsInput"
    note="For values with no fixed list. MultiSelect also shows chips, but its job is the opposite — it stops an operator inventing an option. Use that where the values are known; a free-text field is how “prd”, “prod” and “production” become three environments. Enter or comma commits, Backspace on an empty box removes the last chip, and a half-typed tag commits on blur — abandoning one in the box is the commonest way a tag goes missing."
  >
    <div class="sb__stack">
      <TagsInput
        v-model="owners"
        label="Owners"
        description="Paste a comma-separated list — duplicates are reported, not silently dropped."
        :suggestions="['sre', 'data-platform', 'trading-desk']"
      />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(owners) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="TagsInput — many tags"
    note="The control grows with its chips. Sized field rules fix a single-line height; without overriding that to auto, a second row of chips overflows the box."
  >
    <div class="sb__stack">
      <TagsInput v-model="manyTags" label="Teams" />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(manyTags) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="TagsInput — rules and a limit"
    note="Rules apply per tag, and a paste of thirty reports the four that were refused; without that, twenty-six arriving looks exactly like the paste not working. Note what is NOT split on: space. “east coast” and “needs review” are ordinary tags, and splitting on space shreds them with no way to type the original back."
  >
    <div class="sb__stack">
      <TagsInput
        v-model="alertRoutes"
        label="Alert routes"
        placeholder="e.g. pagerduty-primary"
        :max-tags="4"
        :rules="{ lowercase: true, pattern: /^[a-z0-9-]+$/, patternMessage: 'Lower case, digits and hyphens.' }"
      />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(alertRoutes) }}</code>
      </p>
    </div>
  </Specimen>
  <Specimen
    title="Read-only"
    note="Chips stay; the draft input, the remove buttons and the suggestion list are all withdrawn. The input is not rendered at all — a text cursor you cannot type into is a lie."
  >
    <div class="sb__stack">
      <TagsInput :model-value="['peak', 'shoulder', 'off-peak']" label="TOU periods" readonly />
      <TagsInput :model-value="[]" label="Exclusions" readonly />
    </div>
  </Specimen>

  <CodeExample :code="tagsInputExample" />

  <PropsTable :rows="tagsInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
