<script setup lang="ts">
import Button from './Button.vue';
import Dialog from './Dialog.vue';
import ProgressBar from './ProgressBar.vue';
import { computed } from 'vue';

/*
 * The inactivity warning, shown while useIdleTimeout is inside its warning
 * window. Ships WITH that composable rather than being left to each app,
 * because the hint line below documents the composable most surprising
 * decision: moving the mouse does NOT count as activity. An app re-authoring
 * this dialog would have to rediscover that, and would probably write
 * "move the mouse to stay signed in", which is wrong.
 *
 * "Stay signed in" emits `stay` so the caller can reset the timer. In practice
 * clicking it already counts as activity via the global listeners; the button
 * is the obvious affordance, not the only path.
 */
const props = defineProps<{
  open: boolean;
  seconds: number;
  warningSeconds: number;
}>();
const emit = defineEmits<{ stay: [] }>();

const pct = computed(() => {
  if (props.warningSeconds <= 0) return 0;
  return Math.max(0, Math.min(100, (props.seconds / props.warningSeconds) * 100));
});
</script>

<template>
  <Dialog :open="open" :closable="false" :close-on-escape="false" title="Still there?" width="26rem">
    <div class="r-idle-body">
      <p>
        You'll be signed out in
        <strong>{{ seconds }}</strong>
        second{{ seconds === 1 ? '' : 's' }} due to inactivity.
      </p>
      <ProgressBar :value="pct" :show-value="false" class="r-idle-bar" />
      <p class="r-idle-hint">Click, scroll, or type to stay signed in (moving the mouse alone won't).</p>
    </div>

    <template #footer>
      <Button severity="primary" icon="check" @click="emit('stay')">Stay signed in</Button>
    </template>
  </Dialog>
</template>

<style>
/* Prefixed and unscoped, matching every other component here: these classes are
   part of the package's global namespace, not a component-private one. */
.r-idle-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.r-idle-body p {
  margin: 0;
}

.r-idle-bar {
  height: var(--sp-2);
}

.r-idle-hint {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
