<script setup lang="ts">
/*
 * One deal, read-only: what was traded, the ASX product as it stood when captured, and its history. No actions yet,
 * because the domain has no amend or cancel.
 */
import { Blade, DefinitionList, EmptyState, Timeline, type DefinitionItem, type TimelineItem } from '@ets/ui';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import DirectionTag from './DirectionTag.vue';
import { contractedEnergy, findDeal, formatCaptured, formatDate, formatNumber, productName } from './dealsData';

const route = useRoute();
const deal = computed(() => findDeal(route.params.id as string));

const title = computed(() =>
  deal.value ? `${deal.value.direction} ${deal.value.volume} MW ${deal.value.product.code}` : 'Deal not found',
);
const subtitle = computed(() =>
  deal.value ? `${productName(deal.value.product)} · captured ${formatCaptured(deal.value.capturedAt)}` : undefined,
);

const trade = computed<DefinitionItem[]>(() => {
  const d = deal.value;
  if (!d) return [];
  return [
    { key: 'direction', label: 'Direction', value: d.direction },
    { key: 'price', label: 'Price', value: `${formatNumber(d.price, 2)} $/MWh`, mono: true },
    { key: 'volume', label: 'Volume', value: `${formatNumber(d.volume)} MW (${d.volume} lots)`, mono: true },
    { key: 'energy', label: 'Contracted energy', value: `${formatNumber(contractedEnergy(d))} MWh`, mono: true },
    { key: 'captured', label: 'Captured at', value: `${formatCaptured(d.capturedAt)} AEST` },
  ];
});

const product = computed<DefinitionItem[]>(() => {
  const p = deal.value?.product;
  if (!p) return [];
  const size = p.contractSize;
  return [
    { key: 'code', label: 'Product code', value: p.code, mono: true },
    { key: 'region', label: 'Region', value: `${p.region} · ${p.regionDescription}` },
    { key: 'profile', label: 'Load profile', value: `${p.profile.name} · ${p.profile.window}` },
    { key: 'payoff', label: 'Payoff', value: p.payoff === '$300 cap' ? '$300 cap · strike $300/MWh' : 'Standard' },
    { key: 'period', label: 'Period', value: p.period },
    { key: 'expiry', label: 'Expiry', value: p.expiry },
    { key: 'term', label: 'Term', value: `${p.term} · ${formatDate(p.termStart)} – ${formatDate(p.termEnd)}` },
    {
      key: 'size',
      label: 'Contract size',
      value: size ? `${formatNumber(size.mwhPerLot)} MWh per lot · ${size.days} days, as listed when captured` : null,
    },
  ];
});

const history = computed<TimelineItem[]>(() =>
  deal.value
    ? [{ id: 'captured', title: 'Captured', meta: `${formatCaptured(deal.value.capturedAt)} AEST`, icon: 'plus' }]
    : [],
);
</script>

<template>
  <Blade :title="title" :subtitle="subtitle" size="md">
    <template v-if="deal" #titleEnd>
      <DirectionTag :direction="deal.direction" />
    </template>

    <EmptyState
      v-if="!deal"
      icon="file-question"
      title="This deal does not exist"
      description="The link may be out of date. Pick a deal from the list."
    />
    <div v-else class="deal">
      <section>
        <h3 class="deal__heading">Trade</h3>
        <DefinitionList :items="trade" :columns="1" />
      </section>
      <section>
        <h3 class="deal__heading">Product</h3>
        <DefinitionList :items="product" :columns="1" />
      </section>
      <section>
        <h3 class="deal__heading">History</h3>
        <Timeline :items="history" label="Deal history" />
      </section>
    </div>
  </Blade>
</template>

<style scoped>
.deal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.deal__heading {
  margin: 0 0 var(--sp-2);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--tr-caps);
  text-transform: uppercase;
}
</style>
