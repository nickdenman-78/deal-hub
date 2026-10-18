<script setup lang="ts">
import { ContextMenu, useToast, type MenuItem } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { contextMenuExample } from '../../apiExamples';
import { contextMenuProps } from '../../apiDocs';

const toast = useToast();

const ROW_ACTIONS: MenuItem[] = [
  { label: 'Open in editor', icon: 'pencil', action: () => toast.info('Opened') },
  { label: 'Copy path', icon: 'copy', action: () => toast.info('Copied') },
  { separator: true },
  { label: 'Publish', icon: 'upload', disabled: true },
  { label: 'Delete', icon: 'trash-2', destructive: true, action: () => toast.warn('Deleted') },
];
</script>

<template>
  <Specimen
    title="ContextMenu"
    note="Right-click the panel. It takes the same MenuItem list as Menu — separators, icons, disabled and destructive items. Setting disabled suppresses ours and leaves the browser's own menu alone, which is the right fallback for a target with no actions."
  >
    <div class="sb__stack">
      <ContextMenu :items="ROW_ACTIONS">
        <div class="sb__ctx">Right-click me</div>
      </ContextMenu>
      <ContextMenu :items="ROW_ACTIONS" disabled>
        <div class="sb__ctx sb__ctx--off">Disabled — you get the browser menu</div>
      </ContextMenu>
    </div>
  </Specimen>
  <CodeExample :code="contextMenuExample" />

  <PropsTable :rows="contextMenuProps" />
</template>

<style scoped>
.sb__ctx {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-6);
  border: 1px dashed var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  font-size: var(--fs-sm);
}
.sb__ctx--off {
  color: var(--fg-muted);
}
</style>
