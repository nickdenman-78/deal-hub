<script setup lang="ts">
import { Tag, Timeline, type TimelineItem } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { timelineExample } from '../../apiExamples';
import { timelineProps, timelineItemProps } from '../../apiDocs';

const FEED: TimelineItem[] = [
  { id: 'publish', title: 'Published to prod', meta: '2 hours ago', trailing: 'a.operator', icon: 'upload' },
  { id: 'rotate', title: 'Signing key rotated', meta: 'yesterday', trailing: 'ops-bot', icon: 'key' },
  { id: 'draft', title: 'Draft saved', meta: '3 days ago', trailing: 'a.operator' },
  { id: 'create', title: 'Service created', meta: 'last week', trailing: 'a.operator' },
];

const VERSIONS: TimelineItem[] = [
  { id: 'v14', title: '2026-08-11 09:14 · v14', trailing: 'a.operator' },
  { id: 'v13', title: '2026-08-10 17:02 · v13', trailing: 'ops-bot' },
  { id: 'v12', title: '2026-08-08 11:45 · v12', trailing: 'a.operator' },
];

const version = ref<string | null>('v14');
</script>

<template>
  <Specimen
    title="Timeline — read-only feed"
    note="A rail of dots, one entry per event, newest first by convention — the caller owns the order. The title/meta/trailing trio is deliberately flat (what, when, who); an entry with an icon gets a ring marker, one without gets a plain dot."
  >
    <Timeline :items="FEED" label="Recent activity" />
  </Specimen>

  <Specimen
    title="Timeline — selectable version picker"
    note="selectable renders every entry as a button: clicking emits select and records the selection in the v-model. mono is for timestamps and identifiers, not prose. #item-end sits outside the button, so per-entry extras stay clickable-separate."
  >
    <div class="sb__stack">
      <Timeline v-model="version" :items="VERSIONS" selectable mono label="Version history">
        <template #item-end="{ item }">
          <Tag v-if="item.id === 'v14'" severity="primary">head</Tag>
        </template>
      </Timeline>
      <p class="sb__state">
        Selected: <code>{{ JSON.stringify(version) }}</code>
      </p>
    </div>
  </Specimen>
  <CodeExample :code="timelineExample" />

  <PropsTable :rows="timelineProps" />
  <PropsTable :rows="timelineItemProps" title="TimelineItem" note="Entry shape for `items`." />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
