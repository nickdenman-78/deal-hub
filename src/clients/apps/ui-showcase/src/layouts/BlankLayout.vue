<script setup lang="ts">
/**
 * Minimal frame for landing / hub routes — no product sidebar. Search and
 * theme toggle stay reachable in a thin top bar; page content fills the rest.
 */
import { AppSidebarBrand, ThemeToggle } from '@ets/ui';
import ShowcaseSearch from '../components/ShowcaseSearch.vue';
</script>

<template>
  <div class="sb sb--blank">
    <header class="sb__blank-bar">
      <AppSidebarBrand to="/" label="ETS UI — home" />
      <div class="sb__blank-actions">
        <ShowcaseSearch />
        <ThemeToggle labeled show-resolved />
      </div>
    </header>
    <div class="sb__blank-main">
      <RouterView />
    </div>
  </div>
</template>
