<script setup lang="ts">
/*
 * What a product code means, shown under the code as the trader types: region, profile, payoff, term and contract
 * size, and whether ASX lists it. Domain vocabulary, so it belongs to the deals module, not @ets/ui.
 */
import { DefinitionList, Skeleton, Tag, type DefinitionItem } from '@ets/ui';
import { computed } from 'vue';
import type { AsxProduct } from '../api';
import { formatDate, formatExpiry, formatNumber } from '../format';

const props = defineProps<{ product?: AsxProduct | undefined; checking?: boolean }>();

const name = computed(() => {
  const p = props.product;
  if (!p) return '';
  const payoff = p.strike !== null ? ` ${p.payoff}` : '';
  return `${p.region} ${p.loadProfile.toLowerCase()}${payoff} ${p.term}`;
});

const items = computed<DefinitionItem[]>(() => {
  const p = props.product;
  if (!p) return [];
  return [
    { key: 'region', label: 'Region', value: `${p.region} · ${p.regionDescription}` },
    { key: 'profile', label: 'Profile', value: `${p.loadProfile} · ${p.loadProfileDescription}` },
    { key: 'payoff', label: 'Payoff', value: p.payoff },
    { key: 'period', label: 'Period', value: `${p.period} · expires ${formatExpiry(p.expiryMonth, p.expiryYear)}` },
    { key: 'term', label: 'Term', value: `${formatDate(p.termStart)} – ${formatDate(p.termEnd)}` },
    {
      key: 'size',
      label: 'Contract size',
      value:
        p.contractSize !== null ? `${formatNumber(p.contractSize)} MWh per lot · ${p.contractDays ?? '–'} days` : null,
    },
  ];
});
</script>

<template>
  <div class="decode" aria-live="polite">
    <template v-if="checking">
      <Skeleton variant="subtitle" width="60%" />
      <Skeleton variant="line" />
      <Skeleton variant="line" width="80%" />
    </template>
    <p v-else-if="!product" class="decode__legend">
      Family + region + expiry month + year, e.g. BNH27. B base quarter, H base strip, E base month, P/D peak, G/R $300
      cap; N NSW, V VIC, Q QLD, S SA.
    </p>
    <template v-else>
      <div class="decode__head">
        <span class="decode__name">{{ name }}</span>
        <Tag v-if="product.listed" severity="success" icon="circle-check">Listed by ASX</Tag>
        <Tag v-else severity="warning" icon="triangle-alert">Not listed</Tag>
      </div>
      <DefinitionList v-if="product.listed" :items="items" :columns="1" />
      <p v-else class="decode__legend">
        The code decodes, but ASX's contract schedule has no such product, so there is no contract size.
      </p>
    </template>
  </div>
</template>

<style scoped>
.decode {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface-2);
}

.decode__head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.decode__name {
  flex: 1 1 auto;
  font-weight: var(--fw-semibold);
}

.decode__legend {
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}
</style>
