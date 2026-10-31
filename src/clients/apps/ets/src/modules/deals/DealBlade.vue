<script setup lang="ts">
/*
 * One deal, read-only: what was traded, the ASX product as it stood when captured, and its history. No actions yet,
 * because the domain has no amend or cancel.
 */
import {
  Blade,
  Button,
  DefinitionList,
  EmptyState,
  Message,
  Skeleton,
  Timeline,
  type DefinitionItem,
  type TimelineItem,
} from '@ets/ui';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { getDeal, type AsxFuturesDeal } from './api';
import DirectionTag from './components/DirectionTag.vue';
import { formatDate, formatExpiry, formatInstant, formatNumber } from './format';

const route = useRoute();
const router = useRouter();

const deal = ref<AsxFuturesDeal>();
const state = ref<'loading' | 'loaded' | 'not-found' | 'error'>('loading');

async function load() {
  state.value = 'loading';
  try {
    deal.value = await getDeal(route.params.id as string);
    state.value = 'loaded';
  } catch (error) {
    state.value = error instanceof ApiError && error.status === 404 ? 'not-found' : 'error';
  }
}

onMounted(load);

const title = computed(() => {
  if (deal.value) return `${deal.value.direction} ${deal.value.volume} MW ${deal.value.product.productCode}`;
  if (state.value === 'not-found') return 'Deal not found';
  if (state.value === 'error') return 'Deal';
  return 'Loading deal';
});

const subtitle = computed(() => {
  const d = deal.value;
  if (!d) return undefined;
  const p = d.product;
  const payoff = p.strike !== null ? ` ${p.payoff}` : '';
  return `${p.region} ${p.loadProfile.toLowerCase()}${payoff} ${p.term} · captured ${formatInstant(d.capturedAt)}`;
});

const trade = computed<DefinitionItem[]>(() => {
  const d = deal.value;
  if (!d) return [];
  return [
    { key: 'direction', label: 'Direction', value: d.direction },
    { key: 'price', label: 'Price', value: `${formatNumber(d.price, 2)} $/MWh`, mono: true },
    { key: 'volume', label: 'Volume', value: `${formatNumber(d.volume)} MW (${d.volume} lots)`, mono: true },
    { key: 'energy', label: 'Contracted energy', value: `${formatNumber(d.contractedEnergy)} MWh`, mono: true },
    { key: 'captured', label: 'Captured at', value: `${formatInstant(d.capturedAt)} AEST` },
  ];
});

const product = computed<DefinitionItem[]>(() => {
  const p = deal.value?.product;
  if (!p) return [];
  return [
    { key: 'code', label: 'Product code', value: p.productCode, mono: true },
    { key: 'region', label: 'Region', value: `${p.region} · ${p.regionDescription}` },
    { key: 'profile', label: 'Load profile', value: `${p.loadProfile} · ${p.loadProfileDescription}` },
    {
      key: 'payoff',
      label: 'Payoff',
      value: p.strike !== null ? `${p.payoff} · strike $${formatNumber(p.strike, 2)}/MWh` : p.payoff,
    },
    { key: 'period', label: 'Period', value: p.period },
    { key: 'expiry', label: 'Expiry', value: formatExpiry(p.expiryMonth, p.expiryYear) },
    { key: 'term', label: 'Term', value: `${p.term} · ${formatDate(p.termStart)} – ${formatDate(p.termEnd)}` },
    {
      key: 'size',
      label: 'Contract size',
      value:
        p.contractSize !== null
          ? `${formatNumber(p.contractSize)} MWh per lot · ${p.contractDays ?? '–'} days, as listed when captured`
          : null,
    },
  ];
});

const history = computed<TimelineItem[]>(() =>
  deal.value
    ? [{ id: 'captured', title: 'Captured', meta: `${formatInstant(deal.value.capturedAt)} AEST`, icon: 'plus' }]
    : [],
);
</script>

<template>
  <Blade :title="title" :subtitle="subtitle" size="md">
    <template v-if="deal" #titleEnd>
      <DirectionTag :direction="deal.direction" />
    </template>

    <div v-if="state === 'loading'" class="deal" aria-busy="true">
      <Skeleton v-for="n in 3" :key="n" height="8rem" />
    </div>

    <EmptyState
      v-else-if="state === 'not-found'"
      icon="file-question"
      title="This deal does not exist"
      description="The link may be out of date. Pick a deal from the list."
    >
      <template #actions>
        <Button size="sm" variant="outlined" @click="router.push('/deals')">Back to deals</Button>
      </template>
    </EmptyState>

    <Message v-else-if="state === 'error'" severity="error">
      The deal could not be loaded.
      <Button size="sm" variant="text" @click="load">Retry</Button>
    </Message>

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
