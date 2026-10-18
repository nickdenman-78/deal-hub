<script setup lang="ts">
import { Blade, BladeLink } from '@ets/ui';
import { useRoute } from 'vue-router';

const route = useRoute();

const DEALS = [
  { id: 'd-1', name: 'LFBB QLD 2026', region: 'QLD' },
  { id: 'd-2', name: 'Peak Swap NSW', region: 'NSW' },
  { id: 'd-3', name: 'Baseload VIC 2027', region: 'VIC' },
  { id: 'd-4', name: 'Cap 300 QLD', region: 'QLD' },
];
</script>

<template>
  <!-- Root blade: closable={false} because there is nowhere to close back to.
       Declaring it also lets Escape fall through to a blade that can close. -->
  <Blade title="Deals" subtitle="4 open" size="sm" :closable="false">
    <p class="deals-note">
      The URL <strong>is</strong> the stack. Pick a deal, then a section — each nested route adds a panel. Deep-link to
      <code>/patterns/blade-stack/d-2/terms</code> and all three rehydrate; close a middle one and its descendants
      unmount.
    </p>

    <nav>
      <BladeLink v-for="deal in DEALS" :key="deal.id" :to="`/patterns/blade-stack/${deal.id}`">
        {{ deal.name }}
      </BladeLink>
    </nav>

    <!-- INSIDE the default slot, not a sibling. This is what makes depth
         increment — see context.ts. -->
    <RouterView :key="route.params.id as string" />

    <hr class="deals-sep" />

    <nav>
      <BladeLink to="/patterns/blade-stack/api">Blade API — props &amp; example</BladeLink>
    </nav>
  </Blade>
</template>

<style scoped>
.deals-note {
  margin: 0 0 var(--sp-4);
  color: var(--fg-muted);
  font-size: var(--fs-sm);
  line-height: var(--lh-snug);
}

.deals-note code {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.deals-sep {
  margin: var(--sp-5) 0 var(--sp-4);
  border: 0;
  border-top: 1px solid var(--border-default);
}
</style>
