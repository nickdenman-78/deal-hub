<script setup lang="ts">
/**
 * The way out of a stack that was entered from somewhere else — a list page,
 * a dashboard card.
 *
 * Belongs in a root blade's `actions` slot, which is precisely where the ✕
 * cannot help: a root blade has no parent blade to close back to, so without
 * this there is no route out except the browser's back button.
 */
import { RouterLink, type RouteLocationRaw } from 'vue-router';
import Icon from '../components/Icon.vue';

defineProps<{ to: RouteLocationRaw }>();
</script>

<template>
  <RouterLink :to="to" class="r-blade-back">
    <Icon class="r-blade-back__icon" name="chevron-left" :size="14" />
    <span><slot /></span>
  </RouterLink>
</template>
