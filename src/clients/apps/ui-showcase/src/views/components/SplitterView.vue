<script setup lang="ts">
import { Splitter, SplitterPanel } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { splitterExample } from '../../apiExamples';
import { splitterProps, splitterPanelProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Splitter"
    note="Draggable panes with a real separator role, so the handle is keyboard-operable — focus it and use the arrow keys. EVERY panel needs a defaultSize adding up to 100: v0 registers a panel without one at 0%, which looks like a broken splitter rather than a missing prop, so the component warns in dev. The handle goes on every panel except the first."
  >
    <div class="sb__splitter">
      <Splitter>
        <SplitterPanel :default-size="30" :min-size="15">
          <div class="sb__pane">Tree</div>
        </SplitterPanel>
        <SplitterPanel :default-size="70" handle handle-label="Resize editor">
          <div class="sb__pane">Editor</div>
        </SplitterPanel>
      </Splitter>
    </div>
  </Specimen>

  <Specimen title="Splitter — vertical">
    <div class="sb__splitter">
      <Splitter orientation="vertical">
        <SplitterPanel :default-size="60"><div class="sb__pane">Results</div></SplitterPanel>
        <SplitterPanel :default-size="40" handle handle-label="Resize log"
          ><div class="sb__pane">Log</div></SplitterPanel
        >
      </Splitter>
    </div>
  </Specimen>
  <CodeExample :code="splitterExample" />

  <PropsTable :rows="splitterProps" title="Splitter" />
  <PropsTable :rows="splitterPanelProps" title="SplitterPanel" />
</template>

<style scoped>
/* Splitter fills its host, so the host is what sets the height. */
.sb__splitter {
  height: 14rem;
}
.sb__pane {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
