<script setup lang="ts">
import { Badge, Button, Icon } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { badgeExample } from '../../apiExamples';
import { badgeProps } from '../../apiDocs';

const unread = ref(3);
const overflow = ref(120);
</script>

<template>
  <Specimen
    title="Badge"
    note="Wrap a control to pin a corner mark (unread count on a messages icon). Numbers honour max (120 with max 99 → 99+). Zero hides the mark unless dot is set. Default severity is error — a count badge is usually a call to action."
  >
    <div class="sb__stack">
      <div class="sb__row">
        <Badge :content="unread" label="3 unread messages">
          <Button variant="text" icon="inbox" aria-label="Messages" />
        </Badge>
        <Badge :content="overflow" :max="99" severity="error">
          <Button variant="text" icon="circle-alert" aria-label="Alerts" />
        </Badge>
        <Badge dot severity="primary">
          <Button variant="text" icon="book" aria-label="Docs" />
        </Badge>
        <Badge :content="2" severity="success" position="bottom-end">
          <Button variant="outlined" icon="user" aria-label="Profile" />
        </Badge>
      </div>
      <div class="sb__row">
        <Badge :content="1" severity="secondary" />
        <Badge :content="12" severity="primary" />
        <Badge :content="3" severity="success" />
        <Badge :content="4" severity="warning" />
        <Badge :content="5" severity="error" />
        <Badge :content="6" severity="info" />
        <Badge dot severity="error" />
      </div>
      <div class="sb__row sb__row--align">
        <Badge :content="8" severity="error">
          <Icon name="inbox" :size="22" label="Inbox" />
        </Badge>
        <span class="sb__hint">Icon host</span>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="badgeExample" />
  <PropsTable :rows="badgeProps" />
</template>

<style scoped>
.sb__row--align {
  align-items: center;
  gap: var(--sp-3);
}

.sb__hint {
  color: var(--fg-muted);
  font-size: var(--fs-xs);
}
</style>
