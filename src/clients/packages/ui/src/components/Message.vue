<script setup lang="ts">
import { computed } from 'vue';
import Icon from './Icon.vue';
import type { StatusSeverity } from '../severity';

export type MessageSeverity = StatusSeverity;

const props = withDefaults(
  defineProps<{
    severity?: MessageSeverity;
    /** Optional bold first line. Without it the body carries the whole message. */
    title?: string;
    /** Overrides the severity's default glyph. */
    icon?: string;
    closable?: boolean;
  }>(),
  { severity: 'info', title: undefined, icon: undefined },
);

defineEmits<{ close: [] }>();

const DEFAULT_ICONS: Record<MessageSeverity, string> = {
  info: 'info',
  success: 'circle-check',
  warning: 'triangle-alert',
  error: 'circle-alert',
};

const glyph = computed(() => props.icon ?? DEFAULT_ICONS[props.severity]);

/*
 * Errors and warnings are announced assertively — they usually report that
 * something the operator just did did not work, and waiting for a natural
 * pause is too late. Info and success use `status`, which is polite.
 */
const live = computed(() => (props.severity === 'error' || props.severity === 'warning' ? 'assertive' : 'polite'));
const role = computed(() => (props.severity === 'error' || props.severity === 'warning' ? 'alert' : 'status'));
</script>

<template>
  <div class="r-message" :class="`r-message--${severity}`" :role="role" :aria-live="live">
    <Icon class="r-message__icon" :name="glyph" :size="16" />

    <div class="r-message__body">
      <p v-if="title" class="r-message__title">{{ title }}</p>
      <div class="r-message__content"><slot /></div>
    </div>

    <button v-if="closable" class="r-message__close" type="button" aria-label="Dismiss" @click="$emit('close')">
      <Icon name="x" :size="14" />
    </button>
  </div>
</template>

<style>
.r-message {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border: 1px solid;
  border-radius: var(--r-sm);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  line-height: var(--lh-snug);
}

.r-message--info {
  border-color: color-mix(in srgb, var(--info) 35%, transparent);
  background: var(--info-soft);
  color: var(--info-ink);
}

.r-message--success {
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
  background: var(--success-soft);
  color: var(--success-ink);
}

.r-message--warning {
  border-color: color-mix(in srgb, var(--warning) 35%, transparent);
  background: var(--warning-soft);
  color: var(--warning-ink);
}

.r-message--error {
  border-color: color-mix(in srgb, var(--error) 35%, transparent);
  background: var(--error-soft);
  color: var(--error-ink);
}

.r-message__icon {
  /* Nudges the glyph onto the first line's optical centre. Without it the
       icon rides high against a multi-line body. */
  margin-top: 1px;
}

.r-message__body {
  flex: 1;
  min-width: 0;
}

.r-message__title {
  margin: 0 0 2px;
  color: inherit;
  font-weight: var(--fw-semibold);
}

/* Inherit, so a <p> or <a> in the slot picks up the severity ink rather than
     falling back to the global element colour and washing out on the tint. */
.r-message__content,
.r-message__content p,
.r-message__content a {
  color: inherit;
}

.r-message__close {
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

.r-message__close:hover {
  opacity: 1;
}
</style>
