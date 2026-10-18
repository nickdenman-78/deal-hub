<script setup lang="ts">
import { Input, MaskedInput, idNameRule, normalizeIdName } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { inputExample } from '../../apiExamples';
import { inputProps } from '../../apiDocs';

const name = ref('rdcs-pricing');
const search = ref('');
const rate = ref('42.50');
const required = ref('');
const notEmpty = [(v: unknown) => (typeof v === 'string' && v.length > 0) || 'This field is required.'];
</script>

<template>
  <Specimen
    title="Input"
    note="The visible label is ours; v0's label prop feeds aria-label only. For live character masks (service names, digit runs), use MaskedInput."
  >
    <div class="sb__stack">
      <MaskedInput
        v-model="name"
        label="Service name"
        description="Lowercase, start with a letter; spaces become hyphens."
        :mask="normalizeIdName"
        :rules="[idNameRule()]"
      />
      <Input v-model="search" label="Search" icon="search" placeholder="Filter services…" />
    </div>
  </Specimen>

  <Specimen title="Input sizes">
    <div class="sb__stack">
      <Input label="Small" size="sm" placeholder="sm" />
      <Input label="Medium" size="md" placeholder="md" />
      <Input label="Large" size="lg" placeholder="lg" />
    </div>
  </Specimen>

  <Specimen
    title="Read-only"
    note="An editable field is just a field. The treatment belongs to the state worth marking: a read-only field takes the muted fill, keeps its value at full contrast because it is real data, and takes no opacity or not-allowed cursor — nothing is refusing you, it simply is not an input. Every field control takes this prop, not just Input."
  >
    <div class="sb__stack">
      <Input v-model="rate" label="Peak rate ($/MWh)" />
      <Input label="Contract ID" model-value="RD-4471-QLD" readonly />
      <Input label="Superseded by" model-value="" readonly placeholder="—" />
    </div>
  </Specimen>

  <Specimen
    title="Validation"
    note="Blur the empty field to trigger the rule. The error region is always rendered but collapsed — an aria-live region inserted at the same moment as its content is not reliably announced."
  >
    <div class="sb__stack">
      <Input v-model="required" label="Environment" :rules="notEmpty" required />
      <Input label="Owner" error error-messages="No such user in the directory." model-value="a.nonymous" />
    </div>
  </Specimen>

  <Specimen title="Disabled">
    <div class="sb__stack">
      <Input label="Managed by Key Vault" model-value="(secret)" disabled />
    </div>
  </Specimen>
  <CodeExample :code="inputExample" />

  <PropsTable :rows="inputProps" />
</template>
