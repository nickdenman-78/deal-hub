<script setup lang="ts">
import {
  MaskedInput,
  idNameRule,
  maskAuIntlPhone,
  maskAuLandline,
  maskAuMobile,
  normalizeIdName,
  unformatAuIntlPhone,
  unformatAuLandline,
  unformatAuMobile,
} from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { maskedInputExample } from '../../apiExamples';
import { maskedInputProps } from '../../apiDocs';

const serviceName = ref('rdcs-pricing');
/** Style Manual example shape — domestic mobile 04XX XXX XXX. */
const mobile = ref('0491570159');
/** NSW/ACT landline — 0A XXXX XXXX. */
const landline = ref('0255504321');
/** International dial code +61, trunk 0 dropped — +61 4XX XXX XXX. */
const intlMobile = ref('+61491570159');
const digits = ref('42');

/** Digits only — shows a custom sanitize beside the presets. */
function digitsOnly(raw: string): string {
  return raw.replace(/\D+/g, '').slice(0, 6);
}
</script>

<template>
  <Specimen
    title="MaskedInput"
    note="v-model stays raw (sanitize via mask). blurMask is display-only when resting — grouping spaces and thousands separators never enter the model. AU phone spacing follows the Style Manual. Amounts with unit chrome live on NumberInput; ABN/ACN, card, and NMI have specialised controls."
  >
    <div class="sb__stack">
      <div class="sb__stack">
        <MaskedInput
          v-model="serviceName"
          label="Service name"
          description="Lowercase, start with a letter; spaces become hyphens."
          placeholder="pricing-api"
          :mask="normalizeIdName"
          :rules="[idNameRule()]"
        />
        <p class="sb__state">
          Model: <code>{{ serviceName || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <MaskedInput
          v-model="mobile"
          label="AU mobile"
          description="Style Manual: 04XX XXX XXX. Digits only in the model."
          placeholder="0412 345 678"
          :mask="unformatAuMobile"
          :blur-mask="maskAuMobile"
        />
        <p class="sb__state">
          Model: <code>{{ mobile || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <MaskedInput
          v-model="landline"
          label="AU landline"
          description="Style Manual: 0A XXXX XXXX (area code + local number)."
          placeholder="02 5550 4321"
          :mask="unformatAuLandline"
          :blur-mask="maskAuLandline"
        />
        <p class="sb__state">
          Model: <code>{{ landline || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <MaskedInput
          v-model="intlMobile"
          label="AU mobile (international)"
          description="Style Manual: +61 4XX XXX XXX — dial code, trunk 0 dropped. Model keeps + and digits."
          placeholder="+61 412 345 678"
          :mask="unformatAuIntlPhone"
          :blur-mask="maskAuIntlPhone"
        />
        <p class="sb__state">
          Model: <code>{{ intlMobile || 'empty' }}</code>
        </p>
      </div>
      <div class="sb__stack">
        <MaskedInput v-model="digits" label="Meter digits" description="Digits only, max 6." :mask="digitsOnly" />
        <p class="sb__state">
          Model: <code>{{ digits || 'empty' }}</code>
        </p>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="maskedInputExample" />

  <PropsTable :rows="maskedInputProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
