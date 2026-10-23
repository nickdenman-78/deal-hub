<script setup lang="ts">
import { hubHighlights, hubSections } from '../nav';
</script>

<template>
  <div class="hub">
    <p class="hub__lede">
      Dev harness for <code>@ets/ui</code> and <code>@ets/editor</code>. Every control in light and dark. Not deployed.
    </p>

    <section class="hub__block">
      <p class="hub__eyebrow">Browse</p>
      <div class="hub__grid">
        <RouterLink v-for="section in hubSections" :key="section.path" class="hub__card" :to="section.path">
          <strong>{{ section.title }}</strong>
          <span>{{ section.note }}</span>
        </RouterLink>
      </div>
    </section>

    <section class="hub__block">
      <p class="hub__eyebrow">Start here</p>
      <div class="hub__grid">
        <RouterLink v-for="item in hubHighlights" :key="item.path" class="hub__card hub__card--quiet" :to="item.path">
          <strong>{{ item.title }}</strong>
          <span>{{ item.note }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hub {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  align-self: center;
  width: 100%;
  max-width: var(--blade-lg);
  min-height: 0;
}

.hub__lede {
  max-width: 56ch;
  margin-bottom: var(--sp-8);
  color: var(--fg-secondary);
  font-size: var(--fs-md);
}

.hub__block {
  margin-bottom: var(--sp-8);
}

.hub__eyebrow {
  margin: 0 0 var(--sp-3);
  color: var(--fg-muted);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--tr-caps);
  text-transform: uppercase;
}

.hub__grid {
  display: grid;
  gap: var(--sp-3);
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}

.hub__card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-4);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  color: inherit;
  text-decoration: none;
}

.hub__card:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.hub__card strong {
  color: var(--fg-primary);
  font-size: var(--fs-md);
}

.hub__card span {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.hub__card--quiet {
  background: transparent;
}
</style>
