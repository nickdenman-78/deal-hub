<script setup lang="ts">
import { EmptyState, PageHeader } from '@ets/ui';
</script>

<template>
  <PageHeader title="Settlement" icon="receipt" />
  <EmptyState
    icon="construction"
    title="Nothing here yet"
    description="Settlement runs, approvals and invoices land here."
  />
</template>
