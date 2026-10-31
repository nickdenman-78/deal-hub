<script setup lang="ts">
/*
 * What a product code means, shown under the code as the trader types: region, profile, payoff, term and contract
 * size, and whether ASX lists it. Domain vocabulary, so it belongs to the deals module, not @ets/ui.
 */
import { DefinitionList, Tag, type DefinitionItem } from '@ets/ui';
import { computed } from 'vue';
import { CODE_LEGEND, formatDate, formatNumber, productName, type Product } from './dealsData';

const props = defineProps<{ product?: Product | undefined }>();

const listed = computed(() => props.product?.contractSize !== undefined);

const items = computed<DefinitionItem[]>(() => {
  const product = props.product;
  if (!product) return [];
  const size = product.contractSize;
  return [
    { key: 'region', label: 'Region', value: `${product.region} · ${product.regionDescription}` },
    { key: 'profile', label: 'Profile', value: `${product.profile.name} · ${product.profile.window}` },
    { key: 'payoff', label: 'Payoff', value: product.payoff },
    { key: 'period', label: 'Period', value: `${product.period} · expires ${product.expiry}` },
    { key: 'term', label: 'Term', value: `${formatDate(product.termStart)} – ${formatDate(product.termEnd)}` },
    {
      key: 'size',
      label: 'Contract size',
      value: size ? `${formatNumber(size.mwhPerLot)} MWh per lot · ${size.days} days` : null,
    },
  ];
});
</script>

<template>
  <div class="decode">
    <p v-if="!product" class="decode__legend">{{ CODE_LEGEND }}</p>
    <template v-else>
      <div class="decode__head">
        <span class="decode__name">{{ productName(product) }}</span>
        <Tag v-if="listed" severity="success" icon="circle-check">Listed by ASX</Tag>
        <Tag v-else severity="warning" icon="triangle-alert">Not listed</Tag>
      </div>
      <DefinitionList v-if="listed" :items="items" :columns="1" />
      <p v-else class="decode__legend">
        The code decodes, but ASX's contract schedule has no such product, so there is no contract size.
      </p>
    </template>
  </div>
</template>

<style scoped>
.decode {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-md);
  background: var(--bg-surface-2);
}

.decode__head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-1);
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
