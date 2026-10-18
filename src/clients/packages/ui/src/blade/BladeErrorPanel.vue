<script setup lang="ts">
/**
 * A failure contained inside its own blade: the title bar and ✕ keep working,
 * and every other panel in the stack stays interactive. One dead blade is a
 * much smaller event than a dead page.
 *
 * There is no route-level ErrorBoundary export in vue-router to hang this on.
 * It is rendered by the blade itself, from whichever error arrived first —
 * typically one caught by onErrorCaptured.
 */
import Button from '../components/Button.vue';
import Icon from '../components/Icon.vue';

defineProps<{
  /** What failed, lowercased into the sentence. */
  title: string;
  message: string;
}>();

defineEmits<{ retry: [] }>();

// Somewhere else to go, for a failure retrying cannot fix. A blade at the
// root of its stack has no ✕ and no panel beside it, so without this the only
// way out of one is the browser's back button.
defineSlots<{ default?(): unknown }>();
</script>

<template>
  <div class="r-blade-error">
    <Icon class="r-blade-error__mark" name="triangle-alert" :size="28" />
    <p class="r-blade-error__headline">Couldn't load {{ title.toLowerCase() }}</p>
    <p class="r-blade-error__detail">{{ message }}</p>
    <p class="r-blade-error__detail">The rest of the page is unaffected.</p>
    <div class="r-blade-error__actions">
      <Button variant="outlined" size="sm" icon="refresh-cw" @click="$emit('retry')">Try again</Button>
      <slot />
    </div>
  </div>
</template>
