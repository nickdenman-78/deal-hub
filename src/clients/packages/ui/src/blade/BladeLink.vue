<script setup lang="ts">
/**
 * A row that opens a child blade.
 *
 * A RouterLink whose active state shows which child is currently open — the
 * Azure behaviour where the row you picked stays lit while you work in the
 * panel it opened. That highlight is the only thing tying a deep blade back
 * to where it came from, so it is not decoration.
 *
 * `activeMatch` covers the workbench case: `to` is a default tab
 * (`…/workbench/files`) but the row must stay lit on sibling tabs
 * (`…/workbench/configuration`). Vue Router's own active check cannot do
 * that — and linking to a redirect-only parent (`…/workbench`) matches
 * neither tab, because the redirect record is not in the current matched
 * stack once you have landed on `:tab`.
 */
import { computed } from 'vue';
import { RouterLink, useRoute, type RouteLocationRaw } from 'vue-router';
import Icon from '../components/Icon.vue';

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw;
    /** Match the path exactly, for a link whose target is a prefix of others. */
    exact?: boolean;
    /**
     * How many things are behind the link, shown before the chevron.
     *
     * A count, not a badge: it answers "is it worth opening" without opening,
     * which on a record whose children live one panel deeper is the difference
     * between a link and a guess. `0` renders — "none" is an answer, and
     * hiding it would make an empty relationship look like a missing one.
     */
    count?: number;
    /**
     * Path prefix that keeps the row lit (exact or with further segments).
     * When set, replaces RouterLink's active / exact-active classes.
     */
    activeMatch?: string;
  }>(),
  { exact: false, activeMatch: undefined, count: undefined },
);

const route = useRoute();

const matchActive = computed(() => {
  if (!props.activeMatch) return false;
  const prefix = props.activeMatch.replace(/\/$/, '');
  const path = route.path;
  return path === prefix || path.startsWith(`${prefix}/`);
});
</script>

<template>
  <RouterLink v-slot="{ href, navigate, isActive, isExactActive }" :to="to" custom>
    <a
      :href="href"
      class="r-blade-link"
      :class="
        activeMatch
          ? { 'is-active': matchActive }
          : exact
            ? { 'is-active': isActive }
            : { 'is-active': isActive, 'is-exact': isExactActive }
      "
      @click="navigate"
    >
      <span class="r-blade-link__label"><slot /></span>
      <span v-if="count !== undefined" class="r-blade-link__count">{{ count }}</span>
      <Icon class="r-blade-link__chevron" name="chevron-right" :size="14" />
    </a>
  </RouterLink>
</template>
