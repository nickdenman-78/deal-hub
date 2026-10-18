<script setup lang="ts">
import { EmptyState, PageHeader } from '@ets/ui';
</script>

<template>
  <PageHeader title="Risk" icon="trending-up" />
  <EmptyState
    icon="construction"
    title="Nothing here yet"
    description="Positions, mark-to-market and exposure land here."
  />
</template>
