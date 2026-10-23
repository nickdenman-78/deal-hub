<script setup lang="ts">
/**
 * A blade whose content fails, at depth 2 (third panel in the stack).
 *
 * The point of the specimen: the failure is contained. This blade shows an
 * error panel, and the two blades to its left keep working — their data, their
 * close buttons, their drill-down links. One dead blade is a much smaller
 * event than a dead page, and that only holds because the stack lives in a
 * persistent layout rather than inside a route component that could be taken
 * down with it.
 *
 * vue-router has no route-level ErrorBoundary export to hang this on, so the
 * blade catches its own errors with onErrorCaptured and swaps in
 * BladeErrorPanel.
 */
import { Blade, BladeBackLink, BladeErrorPanel } from '@ets/ui';
import { onErrorCaptured, ref } from 'vue';
import BrokenSection from './BrokenSection.vue';

const failure = ref<Error | null>(null);
/** Bumping this remounts the child, which is what "Try again" means here. */
const attempt = ref(0);

onErrorCaptured((error) => {
  failure.value = error instanceof Error ? error : new Error(String(error));
  // Handled — stop it propagating to the app-level handler, or one broken
  // panel takes the whole page with it.
  return false;
});

function retry() {
  failure.value = null;
  attempt.value += 1;
}
</script>

<template>
  <Blade title="Settlement" subtitle="Fails on purpose" size="md">
    <template #actions>
      <BladeBackLink to="/patterns/blade-stack">All deals</BladeBackLink>
    </template>

    <BladeErrorPanel v-if="failure" title="Settlement" :message="failure.message" @retry="retry" />
    <BrokenSection v-else :key="attempt" />
  </Blade>
</template>
