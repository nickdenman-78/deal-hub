<script setup lang="ts">
import { AVAILABLE_ICONS, Icon, Input } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { iconExample } from '../../apiExamples';
import { iconProps } from '../../apiDocs';

const iconFilter = ref('');
</script>

<template>
  <Specimen
    title="Icon"
    note="Lucide, bundled OFFLINE as a subset — a name outside it renders nothing at all, with no error and no network request to hint at why. This list is that subset, so it is also the answer to “is this name available?”."
  >
    <div class="sb__stack">
      <div class="sb__row">
        <Icon name="folder" :size="16" />
        <Icon name="folder" :size="24" />
        <Icon name="folder" :size="32" />
        <Icon name="triangle-alert" :size="24" label="Warning" />
      </div>
      <Input
        v-model="iconFilter"
        label="Filter"
        icon="search"
        size="sm"
        :placeholder="`${AVAILABLE_ICONS.length} icons`"
        focus-shortcut
      />
      <ul class="sb__icons">
        <li v-for="icon in AVAILABLE_ICONS.filter((i) => i.includes(iconFilter))" :key="icon" :title="icon">
          <Icon :name="icon" :size="18" />
          <code>{{ icon }}</code>
        </li>
      </ul>
    </div>
  </Specimen>
  <CodeExample :code="iconExample" />

  <PropsTable :rows="iconProps" />
</template>

<style scoped>
.sb__icons {
  display: grid;
  gap: var(--sp-2);
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  max-height: 22rem;
  margin: 0;
  padding: var(--sp-2);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  list-style: none;
  overflow-y: auto;
}
.sb__icons li {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
}
.sb__icons code {
  font-size: var(--fs-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
