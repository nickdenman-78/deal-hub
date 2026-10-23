<script setup lang="ts">
import { Card } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { cardExample } from '../../apiExamples';
import { cardProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Cards"
    note="Borderline-flat by design: the border carries the boundary and shadow is reserved for things that genuinely float. There is no elevation prop — wanting a raised card usually means wanting a dialog."
  >
    <div class="sb__stack">
      <Card title="Pricing service" subtitle="12 configuration keys">
        Merged from the shared service layer, then overridden per environment.
      </Card>
      <Card title="Flush body" flush>
        <div style="padding: var(--sp-3); background: var(--bg-surface-2)">For a card whose whole body is a table.</div>
      </Card>
    </div>
  </Specimen>
  <CodeExample :code="cardExample" />

  <PropsTable :rows="cardProps" />
</template>
