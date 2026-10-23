<script setup lang="ts">
import Icon from './Icon.vue';

/*
 * "Nothing here yet / no results" block for pages, blades and cards. No v0
 * primitive — an empty state has no behaviour, only a message and (usually)
 * one way out.
 *
 * DataTable keeps its own `emptyText` prop for the in-table case; this is the
 * page-level form, where there is room to say why the surface is empty and to
 * offer the action that fills it. The #actions slot is where that action goes —
 * the component does not render a button itself because the label and handler
 * are always the caller's.
 */
withDefaults(
  defineProps<{
    /** Lucide icon name (from the offline subset). Omit for text-only. */
    icon?: string;
    title: string;
    description?: string;
  }>(),
  { icon: undefined, description: undefined },
);
</script>

<template>
  <div class="r-empty-state">
    <Icon v-if="icon" :name="icon" :size="32" class="r-empty-state__icon" />
    <p class="r-empty-state__title">{{ title }}</p>
    <p v-if="description" class="r-empty-state__description">{{ description }}</p>
    <slot />
    <div v-if="$slots.actions" class="r-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style>
.r-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  padding: var(--sp-8) var(--sp-4);
  text-align: center;
  font-family: var(--font-ui);
}

.r-empty-state__icon {
  color: var(--fg-faint);
  margin-bottom: var(--sp-2);
}

.r-empty-state__title {
  margin: 0;
  color: var(--fg-secondary);
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}

.r-empty-state__description {
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
  max-width: 36rem;
}

.r-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}
</style>
