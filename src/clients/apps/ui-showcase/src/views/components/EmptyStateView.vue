<script setup lang="ts">
import { Button, EmptyState } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { emptyStateExample } from '../../apiExamples';
import { emptyStateProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="EmptyState"
    note="The page-level empty form — room to say why the surface is empty and to offer the action that fills it. DataTable keeps its own emptyText for the in-table case. The component renders no button itself, because the label and handler are always the caller's — they go in #actions."
  >
    <EmptyState
      icon="inbox"
      title="No services yet"
      description="Services appear here once a project registers one against this group."
    >
      <template #actions>
        <Button severity="primary" icon="plus">Add service</Button>
      </template>
    </EmptyState>
  </Specimen>
  <CodeExample :code="emptyStateExample" />

  <PropsTable :rows="emptyStateProps" />
</template>
