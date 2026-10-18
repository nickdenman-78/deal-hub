<script setup lang="ts">
import { Tag } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { tagExample } from '../../apiExamples';
import { tagProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Tags"
    note="soft is the default: in a table column, solid chips fight the data for attention. The ink colours are darkened until they measure past 4.5:1 on their own tint."
  >
    <div class="sb__stack">
      <div class="sb__row">
        <Tag>Draft</Tag>
        <Tag severity="primary">Primary</Tag>
        <Tag severity="success" icon="circle-check">Active</Tag>
        <Tag severity="warning" icon="triangle-alert">Pending</Tag>
        <Tag severity="error" icon="circle-x">Expired</Tag>
        <Tag severity="info">Filled</Tag>
      </div>
      <div class="sb__row">
        <Tag variant="solid">Draft</Tag>
        <Tag severity="primary" variant="solid">Primary</Tag>
        <Tag severity="success" variant="solid">Active</Tag>
        <Tag severity="warning" variant="solid">Pending</Tag>
        <Tag severity="error" variant="solid">Expired</Tag>
        <Tag severity="info" variant="solid">Filled</Tag>
      </div>
      <div class="sb__row">
        <Tag variant="outline">Draft</Tag>
        <Tag severity="primary" variant="outline">Primary</Tag>
        <Tag severity="success" variant="outline">Active</Tag>
        <Tag severity="warning" variant="outline">Pending</Tag>
        <Tag severity="error" variant="outline">Expired</Tag>
        <Tag severity="info" variant="outline">Filled</Tag>
      </div>
    </div>
  </Specimen>
  <CodeExample :code="tagExample" />

  <PropsTable :rows="tagProps" />
</template>
