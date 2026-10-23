<script setup lang="ts">
import { CreditCardInput } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { creditCardInputExample } from '../../apiExamples';
import { creditCardInputProps } from '../../apiDocs';

/** Well-known Visa test number (Luhn-valid). */
const card = ref('4111111111111111');
const maskedCard = ref('4111111111111111');
const noAutofillCard = ref('4111111111111111');
</script>

<template>
  <Specimen
    title="CreditCardInput"
    note="Single field: contiguous digits in v-model, groups of four when resting. Luhn when the number is long enough. Blur an incomplete or bad checksum to see the rule."
  >
    <div class="sb__stack">
      <CreditCardInput
        v-model="card"
        label="Card number"
        description="Test Visa 4111 1111 1111 1111 — change a digit to fail Luhn. Paste and password managers work via autocomplete=cc-number."
      />
      <p class="sb__state">
        Model: <code>{{ card || 'empty' }}</code>
      </p>
      <CreditCardInput
        v-model="maskedCard"
        label="Masked card number"
        description="`masked` shows asterisks + last four when resting; model stays full digits."
        masked
      />
      <p class="sb__state">
        Model: <code>{{ maskedCard || 'empty' }}</code>
      </p>
      <CreditCardInput
        v-model="noAutofillCard"
        label="Without password managers"
        description="autofill=false — managers are asked not to offer or fill this field."
        :autofill="false"
      />
      <p class="sb__state">
        Model: <code>{{ noAutofillCard || 'empty' }}</code>
      </p>
    </div>
  </Specimen>
  <CodeExample :code="creditCardInputExample" />
  <PropsTable :rows="creditCardInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
