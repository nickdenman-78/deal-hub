<script setup lang="ts">
/*
 * The root blade: every captured deal, newest first. Selecting a row opens the deal beside the list; N opens
 * Capture deal. "Preview state" is showcase-only, for the states the design does not draw.
 */
import {
  Blade,
  Button,
  DataTable,
  DateRangePicker,
  EmptyState,
  Input,
  Message,
  MultiSelect,
  Pagination,
  Select,
  Tag,
  ToggleGroup,
  type DataTableColumn,
  type DataTableSort,
  type DateRange,
  type SelectOption,
  type ToggleOption,
} from '@ets/ui';
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import DirectionTag from './DirectionTag.vue';
import {
  DEALS_BASE,
  capturedDay,
  contractedEnergy,
  deals,
  formatCaptured,
  formatNumber,
  isTyping,
  type Deal,
  type Direction,
  type Payoff,
  type Region,
} from './dealsData';

interface Row extends Record<string, unknown> {
  id: string;
  deal: Deal;
  captured: number;
  direction: Direction;
  code: string;
  region: Region;
  profile: string;
  payoff: Payoff;
  term: string;
  volume: number;
  price: number;
  energy: number;
  period: string;
  expiry: string;
  size: number;
}

const route = useRoute();
const router = useRouter();

const columns: DataTableColumn<Row>[] = [
  { id: 'captured', header: 'Captured', field: 'captured', sortable: true, width: '10rem' },
  { id: 'direction', header: 'Direction', field: 'direction', sortable: true, width: '6rem' },
  { id: 'code', header: 'Product code', field: 'code', sortable: true, width: '7rem' },
  { id: 'region', header: 'Region', field: 'region', sortable: true, width: '5rem' },
  { id: 'profile', header: 'Profile', field: 'profile', sortable: true },
  { id: 'payoff', header: 'Payoff', field: 'payoff', sortable: true, width: '6rem' },
  { id: 'term', header: 'Term', field: 'term', sortable: true },
  { id: 'volume', header: 'Volume (MW)', field: 'volume', sortable: true, align: 'end' },
  { id: 'price', header: 'Price ($/MWh)', field: 'price', sortable: true, align: 'end' },
  { id: 'energy', header: 'Contracted energy (MWh)', field: 'energy', sortable: true, align: 'end' },
];

const sort = ref<DataTableSort>({ id: 'captured', direction: 'desc' });

const codeFilter = ref('');
const regionFilter = ref<Region[]>([]);
const profileFilter = ref<string[]>([]);
const payoffFilter = ref<Payoff | undefined>(undefined);
const directionFilter = ref<string | string[] | undefined>('All');
const capturedRange = ref<DateRange>({});

const regionOptions: SelectOption<Region>[] = (['NSW', 'VIC', 'QLD', 'SA'] as const).map((r) => ({
  value: r,
  label: r,
}));
const profileOptions: SelectOption<string>[] = ['Base load', 'Peak load', 'Morning peak', 'Evening peak'].map((p) => ({
  value: p,
  label: p,
}));
const payoffOptions: SelectOption<Payoff>[] = [
  { value: 'Standard', label: 'Standard' },
  { value: '$300 cap', label: '$300 cap' },
];
const directionOptions: ToggleOption<string>[] = [
  { value: 'All', label: 'All' },
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
];

type PreviewState = 'live' | 'loading' | 'empty' | 'error';
const previewState = ref<PreviewState | undefined>('live');
const previewOptions: SelectOption<PreviewState>[] = [
  { value: 'live', label: 'Deals' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'No deals yet' },
  { value: 'error', label: 'Load error' },
];

const allRows = computed<Row[]>(() =>
  previewState.value === 'live'
    ? deals.map((deal) => ({
        id: deal.id,
        deal,
        captured: deal.capturedAt.getTime(),
        direction: deal.direction,
        code: deal.product.code,
        region: deal.product.region,
        profile: deal.product.profile.name,
        payoff: deal.product.payoff,
        term: deal.product.term,
        volume: deal.volume,
        price: deal.price,
        energy: contractedEnergy(deal),
        period: deal.product.period,
        expiry: deal.product.expiry,
        size: deal.product.contractSize?.mwhPerLot ?? 0,
      }))
    : [],
);

const filtersActive = computed(
  () =>
    codeFilter.value !== '' ||
    regionFilter.value.length > 0 ||
    profileFilter.value.length > 0 ||
    payoffFilter.value !== undefined ||
    directionFilter.value !== 'All' ||
    capturedRange.value.from !== undefined ||
    capturedRange.value.to !== undefined,
);

const filtered = computed(() =>
  allRows.value.filter((row) => {
    if (codeFilter.value && !row.code.includes(codeFilter.value.trim().toUpperCase())) return false;
    if (regionFilter.value.length > 0 && !regionFilter.value.includes(row.region)) return false;
    if (profileFilter.value.length > 0 && !profileFilter.value.includes(row.profile)) return false;
    if (payoffFilter.value !== undefined && row.payoff !== payoffFilter.value) return false;
    if (directionFilter.value !== 'All' && row.direction !== directionFilter.value) return false;
    const day = capturedDay(row.deal.capturedAt);
    if (capturedRange.value.from && day < capturedRange.value.from) return false;
    if (capturedRange.value.to && day > capturedRange.value.to) return false;
    return true;
  }),
);

function clearFilters() {
  codeFilter.value = '';
  regionFilter.value = [];
  profileFilter.value = [];
  payoffFilter.value = undefined;
  directionFilter.value = 'All';
  capturedRange.value = {};
}

const page = ref(0);
const pageSize = ref(50);
watch([filtered, pageSize], () => {
  page.value = 0;
});
// Sort is controlled (v-model:sort), so the table leaves ordering to us and the page is cut after sorting.
const sorted = computed(() => {
  const s = sort.value;
  if (!s) return filtered.value;
  const factor = s.direction === 'asc' ? 1 : -1;
  return [...filtered.value].sort((a, b) => {
    const x = a[s.id] as string | number;
    const y = b[s.id] as string | number;
    return (x < y ? -1 : x > y ? 1 : 0) * factor;
  });
});
const pageRows = computed(() => sorted.value.slice(page.value * pageSize.value, (page.value + 1) * pageSize.value));

const subtitle = computed(() => `ASX futures · ${deals.length} deals`);

function openDeal(row: Row) {
  void router.push(`${DEALS_BASE}/${row.id}`);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== 'n' || event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
  event.preventDefault();
  void router.push(`${DEALS_BASE}/new`);
}
</script>

<template>
  <Blade title="Deals" :subtitle="subtitle" size="fill" :closable="false" @keydown="onKeydown">
    <template #actions>
      <Button size="sm" severity="primary" icon="plus" :as="RouterLink" :to="`${DEALS_BASE}/new`">
        Capture deal
      </Button>
    </template>

    <Message v-if="previewState === 'error'" severity="error" title="Deals could not be loaded">
      The server did not answer.
      <Button size="sm" variant="outlined" icon="refresh-cw" @click="previewState = 'live'">Retry</Button>
    </Message>

    <DataTable
      v-model:sort="sort"
      :rows="pageRows"
      :columns="columns"
      :row-id="(row: Row) => row.id"
      :row-href="(row: Row) => `${DEALS_BASE}/${row.id}`"
      :row-active="(row: Row) => route.params.id === row.id"
      :loading="previewState === 'loading'"
      aria-label="Deals"
      show-filter-labels
      @row-activate="openDeal"
    >
      <template #filters>
        <Input
          v-model="codeFilter"
          size="sm"
          label="Product code"
          placeholder="e.g. BNH27"
          icon="search"
          clearable
          focus-shortcut
        />
        <MultiSelect
          v-model="regionFilter"
          :options="regionOptions"
          size="sm"
          label="Region"
          placeholder="All regions"
          :max-chips="2"
        />
        <MultiSelect
          v-model="profileFilter"
          :options="profileOptions"
          size="sm"
          label="Profile"
          placeholder="All profiles"
          :max-chips="1"
        />
        <Select
          v-model="payoffFilter"
          :options="payoffOptions"
          size="sm"
          label="Payoff"
          placeholder="Any payoff"
          clearable
        />
        <ToggleGroup v-model="directionFilter" :options="directionOptions" label="Direction" size="sm" mandatory />
        <DateRangePicker v-model="capturedRange" size="sm" label="Captured" />
        <Select v-model="previewState" :options="previewOptions" size="sm" label="Preview state (showcase)" />
      </template>

      <template #cell-captured="{ row }">
        <span class="deals-muted">{{ formatCaptured((row as Row).deal.capturedAt) }}</span>
      </template>
      <template #cell-direction="{ row }">
        <DirectionTag :direction="(row as Row).direction" />
      </template>
      <template #cell-code="{ row }">
        <span class="deals-code">{{ (row as Row).code }}</span>
      </template>
      <template #cell-payoff="{ row }">
        <Tag v-if="(row as Row).payoff === '$300 cap'" severity="warning">$300 cap</Tag>
      </template>
      <template #cell-price="{ row }">{{ formatNumber((row as Row).price, 2) }}</template>
      <template #cell-volume="{ row }">{{ formatNumber((row as Row).volume) }}</template>
      <template #cell-energy="{ row }">{{ formatNumber((row as Row).energy) }}</template>

      <template #empty>
        <EmptyState
          v-if="previewState === 'empty'"
          icon="inbox"
          title="No deals captured yet"
          description="Capture an ASX futures deal from its product code."
        >
          <template #actions>
            <Button size="sm" severity="primary" icon="plus" :as="RouterLink" :to="`${DEALS_BASE}/new`">
              Capture deal
            </Button>
          </template>
        </EmptyState>
        <div v-else-if="filtersActive" class="deals-nomatch">
          <span>No deals match these filters.</span>
          <Button size="sm" variant="outlined" icon="filter-x" @click="clearFilters">Clear filters</Button>
        </div>
      </template>
    </DataTable>

    <RouterView :key="(route.params.id as string | undefined) ?? route.path" />

    <template #footer>
      <Pagination v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </template>
  </Blade>
</template>

<style scoped>
.deals-muted {
  color: var(--fg-secondary);
}

.deals-code {
  font-family: var(--font-mono);
  font-weight: var(--fw-medium);
}

.deals-nomatch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  padding: var(--sp-6);
  color: var(--fg-muted);
}
</style>
