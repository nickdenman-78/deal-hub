<script setup lang="ts">
import { Button, PageHeader, Tag } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { pageHeaderExample } from '../../apiExamples';
import { pageHeaderProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="PageHeader"
    note="Title row with inline metadata hugging the title and a trailing action cluster pushed to the end — two slots rather than one because that gap is the design. subtitleMono signals the subtitle is an exact identifier (a path, a slug, a key) rather than prose."
  >
    <PageHeader title="pricing-api" subtitle="trading/pricing-api/_base.json" subtitle-mono>
      <template #meta>
        <Tag severity="success">active</Tag>
      </template>
      <template #actions>
        <Button size="sm" variant="outlined" icon="square-pen">Edit</Button>
        <Button size="sm" severity="primary" icon="plus">New key</Button>
      </template>
    </PageHeader>
  </Specimen>

  <Specimen
    title="Section heading"
    note="as picks the heading element — pass h2 when the header titles a section inside a page that already has an h1 (blades, cards), so the outline stays honest. Prose subtitles are legitimate too; mono is opt-in."
  >
    <PageHeader as="h2" title="Signing keys" subtitle="Twelve keys across four environments." />
  </Specimen>
  <CodeExample :code="pageHeaderExample" />

  <PropsTable :rows="pageHeaderProps" />
</template>
