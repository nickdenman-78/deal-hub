<script setup lang="ts">
import { Dropzone } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dropzoneExample } from '../../apiExamples';
import { dropzoneProps } from '../../apiDocs';

const picked = ref<string[]>([]);

function onSelect(files: File[]) {
  picked.value = files.map((f) => f.name);
}
</script>

<template>
  <Specimen
    title="Dropzone"
    note="Click-to-browse plus drag-and-drop file intake. Stateless by design: it emits the picked files and holds nothing, because what a chosen file looks like belongs to the caller — and the zone stays a drop target throughout, so a second drop replaces the pick. The zone is a single tab stop; Enter or Space opens the same hidden input a click does."
  >
    <div class="sb__stack">
      <Dropzone accept=".json,.csbak" multiple label="Add configuration documents" @select="onSelect" />
      <p class="sb__state">
        Picked: <code>{{ picked.length > 0 ? picked.join(', ') : 'nothing yet' }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen title="Disabled" note="A disabled zone leaves the tab order and ignores drops.">
    <Dropzone disabled hint="Uploads are unavailable while a backup is running" />
  </Specimen>
  <CodeExample :code="dropzoneExample" />

  <PropsTable :rows="dropzoneProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
