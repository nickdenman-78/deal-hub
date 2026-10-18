<script setup lang="ts">
import { Tab, TabList, TabPanel, Tabs } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { tabsExample } from '../../apiExamples';
import { tabsProps, tabListProps, tabProps, tabPanelProps } from '../../apiDocs';

const tab = ref<string | number | undefined>('overview');
const verticalTab = ref<string | number | undefined>('keys');
</script>

<template>
  <Specimen
    title="Tabs"
    note="activation defaults to 'manual': arrow keys move focus, Enter or Space selects. Automatic activation selects as you arrow, which is wrong whenever a panel costs a fetch."
  >
    <Tabs v-model="tab">
      <TabList label="Service detail">
        <Tab value="overview" icon="info">Overview</Tab>
        <Tab value="keys" icon="key">Keys</Tab>
        <Tab value="history" icon="history">History</Tab>
        <Tab value="danger" disabled>Archived</Tab>
      </TabList>
      <TabPanel value="overview">Twelve configuration keys across four environments.</TabPanel>
      <TabPanel value="keys">Keys resolve through the merge precedence chain.</TabPanel>
      <TabPanel value="history">Last published 3 days ago by the trading desk.</TabPanel>
      <TabPanel value="danger">Nothing here.</TabPanel>
    </Tabs>
  </Specimen>

  <Specimen title="Tabs — vertical" note="Same component, orientation flipped; arrow keys follow the axis.">
    <Tabs v-model="verticalTab" orientation="vertical">
      <TabList label="Settings">
        <Tab value="keys" icon="key">Keys</Tab>
        <Tab value="access" icon="lock">Access</Tab>
        <Tab value="backup" icon="database">Backup</Tab>
      </TabList>
      <TabPanel value="keys">Twelve keys.</TabPanel>
      <TabPanel value="access">Two groups, four operators.</TabPanel>
      <TabPanel value="backup">Nightly, encrypted.</TabPanel>
    </Tabs>
  </Specimen>
  <CodeExample :code="tabsExample" />

  <PropsTable :rows="tabsProps" title="Tabs" />
  <PropsTable :rows="tabListProps" title="TabList" />
  <PropsTable :rows="tabProps" title="Tab" />
  <PropsTable :rows="tabPanelProps" title="TabPanel" />
</template>
