<script setup lang="ts">
import { Ipv4Editor } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { ipv4EditorExample } from '../../apiExamples';
import { ipv4EditorProps } from '../../apiDocs';

const hostAddress = ref('10.24.6.19');
const allowedRange = ref('10.24.0.0/16');
const interfaceAddress = ref('192.168.1.57/24');
const readonlyAddress = ref('10.24.6.19');
</script>

<template>
  <Specimen
    title="Ipv4Editor — address"
    note="Four boxes, not one text field: the last octet is what gets edited, and in a plain input that means clicking precisely between two dots. Type a dot to advance, backspace out of an empty box to go back, and paste a whole address into any box to fill the lot. showSubnetInfo adds an (i) with the model string and a copy control."
  >
    <div class="sb__stack">
      <Ipv4Editor v-model="hostAddress" label="Host address" format="address" show-subnet-info />
      <p class="sb__state">
        Model: <code>{{ hostAddress }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Ipv4Editor — CIDR, with derived subnet"
    note="Prefix required. Period and a completed octet advance the same way as address mode — including into the prefix box. showSubnetInfo puts an (i) on the right with subnet arithmetic plus the model string and copy (disabled while invalid); Alt+Down opens it from any focused box when valid."
  >
    <div class="sb__stack">
      <Ipv4Editor
        v-model="allowedRange"
        label="Allowed range"
        description="Clients outside this range are refused at the gateway."
        format="cidr"
        show-subnet
        show-subnet-info
        required
      />
      <p class="sb__state">
        Model: <code>{{ allowedRange }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Ipv4Editor — host bits, and what is not an error"
    note="192.168.1.57/24 is a perfectly good interface address and only wrong when the field means a network — which the component cannot know. So it says so and carries on. Clear a box to see the validation message; type 010 in one to see the leading-zero rule, which exists because 010 is octal 8 to inet_aton and decimal 10 to everything else."
  >
    <div class="sb__stack">
      <Ipv4Editor v-model="interfaceAddress" label="Interface address" show-subnet show-subnet-info />
      <p class="sb__state">
        Model: <code>{{ interfaceAddress }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Ipv4Editor — readonly"
    note="Boxes stay visible but cannot be edited. The tint is suppressed; the info popover still opens so the value can be copied."
  >
    <div class="sb__stack">
      <Ipv4Editor v-model="readonlyAddress" label="Assigned host" format="address" show-subnet-info readonly />
      <p class="sb__state">
        Model: <code>{{ readonlyAddress }}</code>
      </p>
    </div>
  </Specimen>

  <CodeExample :code="ipv4EditorExample" />

  <PropsTable :rows="ipv4EditorProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
