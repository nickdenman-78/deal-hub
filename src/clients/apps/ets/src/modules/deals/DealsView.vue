<script setup lang="ts">
import { EmptyState, PageHeader } from '@ets/ui';
</script>

<template>
  <PageHeader title="Deals" icon="file-text" />
  <EmptyState
    icon="construction"
    title="Nothing here yet"
    description="Deal capture for ASX futures, swaps, caps and options lands here."
  />
</template>
