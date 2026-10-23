<script setup lang="ts">
/**
 * Renders the live toast queue. Mount one of these in the app shell.
 *
 * Teleported to <body> so the stack is never clipped by an ancestor's
 * `overflow: hidden` — a blade strip, a dialog body, a card. That is the usual
 * reason a toast "does not appear": it appeared, inside a box with its
 * overflow hidden.
 */
import Icon from './Icon.vue';
import { useToast, type ToastSeverity } from '../composables/useToast';

withDefaults(
  defineProps<{
    position?: 'bottom-center' | 'bottom-right' | 'top-center' | 'top-right';
  }>(),
  { position: 'bottom-center' },
);

const { toasts } = useToast();

const ICONS: Record<ToastSeverity, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  error: 'circle-alert',
};

/*
 * Errors and warnings interrupt (role="alert", assertive); info and success
 * wait for a pause (role="status", polite). A success toast that talks over
 * whatever the operator is reading is worse than one they never hear.
 */
const urgent = (severity: ToastSeverity) => severity === 'error' || severity === 'warning';
</script>

<template>
  <Teleport to="body">
    <div class="r-toasts" :class="`r-toasts--${position}`">
      <TransitionGroup name="r-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="r-toast"
          :class="`r-toast--${toast.severity}`"
          :role="urgent(toast.severity) ? 'alert' : 'status'"
          :aria-live="urgent(toast.severity) ? 'assertive' : 'polite'"
        >
          <Icon class="r-toast__icon" :name="ICONS[toast.severity]" :size="16" />
          <div class="r-toast__body">
            <p class="r-toast__summary">{{ toast.summary }}</p>
            <p v-if="toast.detail" class="r-toast__detail">{{ toast.detail }}</p>
          </div>
          <button class="r-toast__close" type="button" aria-label="Dismiss" @click="toast.dismiss()">
            <Icon name="x" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
.r-toasts {
  position: fixed;
  z-index: 80;
  display: flex;
  width: min(26rem, calc(100vw - var(--sp-6)));
  flex-direction: column;
  gap: var(--sp-2);
  /* The container spans a column of the screen at all times; without this,
       every click in that column would land here instead of on the page. The
       toasts themselves switch it back on. */
  pointer-events: none;
}

.r-toasts--top-right {
  top: var(--sp-4);
  right: var(--sp-4);
}

.r-toasts--top-center {
  top: var(--sp-4);
  left: 50%;
  transform: translateX(-50%);
}

.r-toasts--bottom-right {
  right: var(--sp-4);
  bottom: var(--sp-4);
  flex-direction: column-reverse;
}

/* `column-reverse` on both bottom variants so the newest toast appears
     closest to the screen edge and the older ones push upward, rather than the
     stack growing downward off-screen. */
.r-toasts--bottom-center {
  bottom: var(--sp-4);
  left: 50%;
  flex-direction: column-reverse;
  transform: translateX(-50%);
}

.r-toast {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid;
  border-radius: var(--r-sm);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  line-height: var(--lh-snug);
  pointer-events: auto;
}

.r-toast--info {
  border-color: color-mix(in srgb, var(--info) 35%, transparent);
  background: var(--info-soft);
  color: var(--info-ink);
}

.r-toast--success {
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
  background: var(--success-soft);
  color: var(--success-ink);
}

.r-toast--warning {
  border-color: color-mix(in srgb, var(--warning) 35%, transparent);
  background: var(--warning-soft);
  color: var(--warning-ink);
}

.r-toast--error {
  border-color: color-mix(in srgb, var(--error) 35%, transparent);
  background: var(--error-soft);
  color: var(--error-ink);
}

.r-toast__icon {
  margin-top: 1px;
}

.r-toast__body {
  flex: 1;
  min-width: 0;
}

.r-toast__summary {
  margin: 0;
  color: inherit;
  font-weight: var(--fw-semibold);
}

.r-toast__detail {
  margin: 2px 0 0;
  color: inherit;
  font-size: var(--fs-sm);
  /* Long detail (a stack trace, a config key path) must wrap rather than
       stretch the toast off-screen. Newlines from multi-issue validation
       lists should stack rather than collapse to spaces. */
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.r-toast__close {
  display: inline-flex;
  flex: none;
  padding: 2px;
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
}

.r-toast__close:hover {
  opacity: 1;
}

.r-toast-enter-active,
.r-toast-leave-active {
  transition:
    opacity var(--dur-base) var(--ease-out),
    transform var(--dur-base) var(--ease-out);
}

/* Edge-anchored stacks slide in from their edge; centred ones rise, because
     a horizontal slide reads as drifting when there is no edge to come from. */
.r-toast-enter-from,
.r-toast-leave-to {
  opacity: 0;
  transform: translateX(var(--sp-4));
}

.r-toasts--bottom-center .r-toast-enter-from,
.r-toasts--bottom-center .r-toast-leave-to,
.r-toasts--top-center .r-toast-enter-from,
.r-toasts--top-center .r-toast-leave-to {
  transform: translateY(var(--sp-4));
}

.r-toasts--top-center .r-toast-enter-from,
.r-toasts--top-center .r-toast-leave-to {
  transform: translateY(calc(var(--sp-4) * -1));
}

/* Keeps the survivors from jumping when one in the middle leaves. `width` is
     restated because an absolutely-positioned flex child no longer stretches to
     the container. */
.r-toast-leave-active {
  position: absolute;
  width: 100%;
}
</style>
