<script setup lang="ts">
/**
 * Renders whatever `confirm()` last asked for. Mount one in the app shell.
 *
 * Separate from ConfirmDialog so that component stays a plain controlled
 * dialog usable on its own — the blade stack's discard prompt drives one
 * directly, with its own open state, and must not go through this queue.
 */
import ConfirmDialog from './ConfirmDialog.vue';
import { useConfirm } from '../composables/useConfirm';

const { open, request, respond } = useConfirm();
</script>

<template>
  <ConfirmDialog
    v-if="request"
    :open="open"
    :title="request.title"
    :confirm-label="request.confirmLabel ?? 'Confirm'"
    :cancel-label="request.cancelLabel ?? 'Cancel'"
    :destructive="request.destructive"
    @confirm="respond(true)"
    @cancel="respond(false)"
  >
    {{ request.message }}
  </ConfirmDialog>
</template>
