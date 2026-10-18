<script setup lang="ts">
import { Button, Tooltip } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { tooltipExample } from '../../apiExamples';
import { tooltipProps } from '../../apiDocs';
</script>

<template>
  <Specimen title="Tooltip" note="Supplementary only — unreachable on touch, so never the sole copy of anything.">
    <div class="sb__row">
      <Tooltip text="Rotates the signing key and re-encrypts every slot file.">
        <Button variant="text" icon="circle-help" aria-label="About key rotation" />
      </Tooltip>
      <Tooltip text="Disabled because the environment is locked by another operator.">
        <span><Button variant="outlined" disabled>Publish</Button></span>
      </Tooltip>
    </div>
  </Specimen>
  <CodeExample :code="tooltipExample" />

  <PropsTable :rows="tooltipProps" />
</template>
