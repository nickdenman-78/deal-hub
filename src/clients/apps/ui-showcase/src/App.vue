<script setup lang="ts">
/**
 * Composition root: toast/confirm hosts and the layout RouterView.
 * Which chrome wraps a page is decided by nested layout routes — see
 * layouts/DefaultLayout.vue and layouts/BlankLayout.vue (ATS ADR-0014).
 */
import { ConfirmHost, ToastHost } from '@ets/ui';
</script>

<template>
  <RouterView />
  <ToastHost />
  <ConfirmHost />
</template>
