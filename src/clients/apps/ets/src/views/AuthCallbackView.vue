<script setup lang="ts">
import { EmptyState, Spinner } from '@ets/ui';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { completeSignIn } from '@/auth/oidc';

const router = useRouter();
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    await router.replace(await completeSignIn());
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
});
</script>

<template>
  <EmptyState v-if="error" icon="circle-alert" title="Sign-in failed" :description="error" />
  <div v-else class="ets-callback"><Spinner /></div>
</template>

<style scoped>
.ets-callback {
  display: grid;
  place-items: center;
  min-height: 50vh;
}
</style>
