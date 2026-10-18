<script setup lang="ts">
/**
 * Navigation trail. Plain markup rather than v0's Breadcrumbs compound: that
 * one models the trail as a selection registry, which is the right shape when
 * the crumbs ARE the state, and the wrong one here — these crumbs are derived
 * from the route and only ever navigate.
 */
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import Icon from './Icon.vue';

export interface Crumb {
  label: string;
  /** Omit on the final crumb — the current page is not a link to itself. */
  to?: RouteLocationRaw;
  /**
   * Native tooltip. For a crumb whose label is a friendly display name — it
   * surfaces the canonical identifier the URL actually uses, which is the one
   * an operator needs when they go looking for the folder on disk.
   */
  title?: string;
}

defineProps<{ items: readonly Crumb[] }>();
</script>

<template>
  <nav class="r-crumbs" aria-label="Breadcrumb">
    <ol class="r-crumbs__list">
      <li v-for="(crumb, index) in items" :key="index" class="r-crumbs__item">
        <Icon v-if="index > 0" class="r-crumbs__sep" name="chevron-right" :size="12" />
        <RouterLink v-if="crumb.to" class="r-crumbs__link" :to="crumb.to" :title="crumb.title">{{
          crumb.label
        }}</RouterLink>
        <!-- aria-current marks where you are; without it a screen reader hears
             a list of links with no indication which one is the page. -->
        <span v-else class="r-crumbs__current" aria-current="page" :title="crumb.title">{{ crumb.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<style>
.r-crumbs__list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-crumbs__item {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  min-width: 0;
}

.r-crumbs__sep {
  color: var(--fg-faint);
}

.r-crumbs__link,
.r-crumbs__current {
  padding: 2px var(--sp-1);
  overflow: hidden;
  max-width: 16rem;
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.r-crumbs__link {
  border-radius: var(--r-xs);
  color: var(--fg-muted);
  text-decoration: none;
}

.r-crumbs__link:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-crumbs__current {
  color: var(--fg-primary);
  font-weight: var(--fw-medium);
}
</style>
