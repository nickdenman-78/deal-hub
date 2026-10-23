<script setup lang="ts">
/**
 * The prompt the dirty guard raises: one dialog for the whole stack, naming
 * every blade that would lose work, rather than one dialog per blade.
 *
 * The only thing specific to it is the sentence, and that sentence is worth
 * getting right — it names the panels, so someone with two things
 * half-written knows which they are about to lose.
 */
import ConfirmDialog from '../components/ConfirmDialog.vue';

defineProps<{
  open: boolean;
  titles: readonly string[];
}>();

const emit = defineEmits<{ proceed: []; stay: [] }>();
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="Discard unsaved changes?"
    confirm-label="Discard changes"
    cancel-label="Stay"
    destructive
    @confirm="emit('proceed')"
    @cancel="emit('stay')"
  >
    <template v-if="titles.length === 1">“{{ titles[0] }}” has</template>
    <template v-else-if="titles.length > 1">“{{ titles.join('”, “') }}” have</template>
    <template v-else>This panel has</template>
    unsaved changes. Leaving will discard them.
  </ConfirmDialog>
</template>
