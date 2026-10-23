<script setup lang="ts">
import { NmiInput } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { nmiInputExample } from '../../apiExamples';
import { nmiInputProps } from '../../apiDocs';

/** Domain test vector — body + matching AEMO checksum. */
const nmi = ref('NCCC0043026');
</script>

<template>
  <Specimen
    title="NmiInput"
    note="Raw uppercase alnum in v-model; optional checksum digit shown after a space when resting. Uses the AEMO Luhn-10 algorithm. 10 characters is enough; 11 must match the check digit."
  >
    <div class="sb__stack">
      <NmiInput
        v-model="nmi"
        label="NMI"
        description="10 characters, or 11 with checksum. Try changing the last digit to see the checksum fail."
      />
      <p class="sb__state">
        Model: <code>{{ nmi || 'empty' }}</code>
      </p>
    </div>
  </Specimen>
  <CodeExample :code="nmiInputExample" />
  <PropsTable :rows="nmiInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
