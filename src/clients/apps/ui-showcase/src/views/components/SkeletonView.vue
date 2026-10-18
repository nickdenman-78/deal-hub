<script setup lang="ts">
import { Skeleton } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { skeletonExample } from '../../apiExamples';
import { skeletonProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Skeleton"
    note="A fake detail pane: a circle standing in for an Avatar, title and subtitle bars, and body lines whose widths the caller varies so the block reads as ragged prose rather than a barcode. Width and height are plain CSS lengths, not a utility scale — the caller knows what the placeholder is impersonating."
  >
    <div class="sk-demo">
      <div class="sk-demo__head">
        <Skeleton variant="circle" />
        <div class="sk-demo__titles">
          <Skeleton variant="title" />
          <Skeleton variant="subtitle" />
        </div>
      </div>
      <Skeleton variant="line" />
      <Skeleton variant="line" width="92%" />
      <Skeleton variant="line" width="97%" />
      <Skeleton variant="line" width="61%" />
    </div>
  </Specimen>
  <CodeExample :code="skeletonExample" />

  <PropsTable :rows="skeletonProps" />
</template>

<style scoped>
.sk-demo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  max-width: 24rem;
}

.sk-demo__head {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-2);
}

.sk-demo__titles {
  flex: 1;
  min-width: 0;
}
</style>
