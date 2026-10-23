<script setup lang="ts">
import { PageHeader } from '@ets/ui';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '@/stores/session';

const { me } = storeToRefs(useSessionStore());
</script>

<template>
  <PageHeader title="Energy Trading System" icon="house" :subtitle="me ? `Signed in as ${me.name}` : undefined" />
  <p>Deal capture for ASX energy futures and OTC derivatives, with settlement and risk.</p>
</template>
