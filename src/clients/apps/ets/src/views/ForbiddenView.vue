<script setup lang="ts">
import { EmptyState, PageHeader } from '@ets/ui';
</script>

<template>
  <PageHeader title="Not permitted" icon="lock" />
  <EmptyState
    icon="construction"
    title="Nothing here yet"
    description="Your roles do not include access to this screen. Ask an administrator if you need it."
  />
</template>
