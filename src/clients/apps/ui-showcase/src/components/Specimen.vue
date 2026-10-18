<script setup lang="ts">
/*
 * Renders its slot twice — once forced light, once forced dark — so a
 * contrast failure in one theme cannot hide while you happen to be looking at
 * the other. That is the single most useful thing this harness does.
 *
 * The forcing works because @ets/brand scopes its dark block to
 * `:where([data-theme='dark'], …)` rather than `:root`, so the attribute
 * re-themes any subtree, not just the document.
 */
defineProps<{ title: string; note?: string }>();
</script>

<template>
  <section class="sb__section">
    <h3>{{ title }}</h3>
    <p v-if="note">{{ note }}</p>

    <div class="sb__modes">
      <div class="sb__mode" data-theme="light">
        <h4>Light</h4>
        <slot />
      </div>
      <div class="sb__mode" data-theme="dark">
        <h4>Dark</h4>
        <slot />
      </div>
    </div>
  </section>
</template>
