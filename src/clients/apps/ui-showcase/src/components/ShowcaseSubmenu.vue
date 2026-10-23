<script setup lang="ts">
/**
 * Submenu for the active top-level section.
 *
 * Grouped sections (Components) get a MegaMenu: one menubar entry per group,
 * each opening a multi-column panel of that group's leaves. Ungrouped sections
 * (Editors, Patterns) keep a flat row of leaf links. Foundations has no leaves
 * — the strip still shows so Search can sit on the right.
 */
import { chunkColumns, MegaMenu, type MegaMenuEntry } from '@ets/ui';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { leafMatches, type NavGroup, type NavLeaf, type NavTopLevel } from '../nav';
import ShowcaseSearch from './ShowcaseSearch.vue';

const props = defineProps<{
  section: NavTopLevel;
}>();

const route = useRoute();

const useMega = computed(() => props.section.groups.length > 0);
const hasNav = computed(() => props.section.leaves.length > 0 || props.section.groups.length > 0);

function groupActive(group: NavGroup): boolean {
  return group.children.some((item) => leafMatches(item, route.path));
}

function leafActive(item: NavLeaf): boolean {
  return leafMatches(item, route.path);
}

/*
 * Active state is computed here rather than left to RouterLink, because a
 * prefix-matched leaf (the blade stack) is current on its children too and
 * vue-router's exact-active class alone gets that wrong.
 */
const megaModel = computed<MegaMenuEntry[]>(() =>
  props.section.groups.map((group) => ({
    label: group.title,
    active: groupActive(group),
    // Up to 6 rows, then a new column — small groups stay single-column.
    columns: chunkColumns(
      group.children.map((item) => ({ label: item.title, to: item.path, active: leafActive(item) })),
      6,
    ),
  })),
);
</script>

<template>
  <div class="sb__submenu">
    <span class="sb__submenu-label">{{ section.title }}</span>

    <MegaMenu v-if="useMega" class="sb__submenu-nav" :model="megaModel" :label="`${section.title} groups`" />

    <nav v-else-if="hasNav" class="sb__submenu-nav" :aria-label="`${section.title} pages`">
      <RouterLink
        v-for="item in section.leaves"
        :key="item.path"
        class="sb__sublink"
        :class="{ 'is-active': leafActive(item) }"
        :to="item.path"
      >
        {{ item.title }}
      </RouterLink>
    </nav>

    <div class="sb__submenu-search">
      <ShowcaseSearch />
    </div>
  </div>
</template>
