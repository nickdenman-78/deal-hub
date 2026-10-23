<script setup lang="ts">
/*
 * Surface container. No v0 primitive — a card is a border and some padding.
 *
 * ETS keeps cards borderline-flat: the border carries the boundary and
 * shadow is reserved for things that genuinely float (menus, dialogs). That
 * is why there is no `elevation` prop — reaching for a raised card is almost
 * always a sign the layout wants a dialog instead.
 */
import { useSlots } from 'vue';

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    /** Removes body padding — for a card whose whole body is a table. */
    flush?: boolean;
  }>(),
  { title: undefined, subtitle: undefined },
);

/*
 * The body is the DEFAULT slot and the heading comes from `title` / #header.
 * PrimeVue's Card took `#title` and `#content`, and a card carried over from
 * that habit renders as an empty white box — Vue drops unknown slots without
 * a word. Say it out loud in dev rather than letting a whole page look like a
 * layout failure.
 */
if (import.meta.env?.DEV) {
  const slots = useSlots();
  for (const name of ['title', 'content', 'subtitle'] as const) {
    if (slots[name]) {
      // eslint-disable-next-line no-console
      console.warn(
        `[@ets/ui] <Card> has no #${name} slot — its content is being dropped. ` +
          `Use the \`${name === 'content' ? 'default slot' : name} prop\` (or #header) instead.`,
      );
    }
  }
}
</script>

<template>
  <section class="r-card">
    <header v-if="title || subtitle || $slots.header || $slots.actions" class="r-card__header">
      <div class="r-card__heading">
        <slot name="header">
          <h3 v-if="title" class="r-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="r-card__subtitle">{{ subtitle }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="r-card__actions"><slot name="actions" /></div>
    </header>

    <div class="r-card__body" :class="{ 'r-card__body--flush': flush }"><slot /></div>

    <footer v-if="$slots.footer" class="r-card__footer"><slot name="footer" /></footer>
  </section>
</template>

<style>
.r-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  box-shadow: var(--shadow-panel);
}

.r-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border-bottom: 1px solid var(--border-subtle);
}

.r-card__heading {
  min-width: 0;
}

.r-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: var(--fw-regular);
}

.r-card__subtitle {
  margin: 2px 0 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.r-card__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--sp-2);
}

.r-card__body {
  flex: 1;
  padding: var(--sp-4);
}

.r-card__body--flush {
  padding: 0;
}

.r-card__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
}
</style>
