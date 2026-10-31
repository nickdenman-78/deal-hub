<script setup lang="ts">
/*
 * The root blade: every ASX futures deal, newest first. Selecting a row opens the deal beside the list; N opens
 * Capture deal for a trader who may capture. Filtering, sorting and paging are client-side until the list moves to
 * a read model with server-side paging.
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
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { DealsPermissions } from '@/lib/permissions';
import { useSessionStore } from '@/stores/session';
import { dealsChanged, listDeals, type AsxFuturesDeal, type Direction } from './api';
import DirectionTag from './components/DirectionTag.vue';
import { aestDay, formatInstant, formatNumber } from './format';
import { isTyping } from './quote';

interface Row extends Record<string, unknown> {
  id: string;
  deal: AsxFuturesDeal;
  captured: number;
  direction: Direction;
  code: string;
  region: string;
  profile: string;
  payoff: string;
  term: string;
  volume: number;
  price: number;
  energy: number;
}

const route = useRoute();
const router = useRouter();
const session = useSessionStore();
const canCapture = computed(() => session.can(DealsPermissions.Capture));

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

const deals = ref<AsxFuturesDeal[]>([]);
const loading = ref(true);
const loadError = ref(false);

async function load() {
  loading.value = true;
  loadError.value = false;
  try {
    deals.value = await listDeals();
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(dealsChanged, load);

const sort = ref<DataTableSort>({ id: 'captured', direction: 'desc' });

const codeFilter = ref<string | undefined>('');
const regionFilter = ref<string[]>([]);
const profileFilter = ref<string[]>([]);
const payoffFilter = ref<string | undefined>(undefined);
const directionFilter = ref<string | string[] | undefined>('All');
const capturedRange = ref<DateRange>({});

const regionOptions: SelectOption<string>[] = ['NSW', 'VIC', 'QLD', 'SA'].map((r) => ({ value: r, label: r }));
const profileOptions: SelectOption<string>[] = ['Base load', 'Peak load', 'Morning peak', 'Evening peak'].map((p) => ({
  value: p,
  label: p,
}));
const payoffOptions: SelectOption<string>[] = [
  { value: 'Standard', label: 'Standard' },
  { value: '$300 cap', label: '$300 cap' },
];
const directionOptions: ToggleOption<string>[] = [
  { value: 'All', label: 'All' },
  { value: 'Buy', label: 'Buy' },
  { value: 'Sell', label: 'Sell' },
];

const allRows = computed<Row[]>(() =>
  deals.value.map((deal) => ({
    id: deal.id,
    deal,
    captured: new Date(deal.capturedAt).getTime(),
    direction: deal.direction,
    code: deal.product.productCode,
    region: deal.product.region,
    profile: deal.product.loadProfile,
    payoff: deal.product.payoff,
    term: deal.product.term,
    volume: deal.volume,
    price: deal.price,
    energy: deal.contractedEnergy,
  })),
);

const filtersActive = computed(
  () =>
    !!codeFilter.value ||
    regionFilter.value.length > 0 ||
    profileFilter.value.length > 0 ||
    payoffFilter.value !== undefined ||
    directionFilter.value !== 'All' ||
    capturedRange.value.from !== undefined ||
    capturedRange.value.to !== undefined,
);

const filtered = computed(() =>
  allRows.value.filter((row) => {
    const code = (codeFilter.value ?? '').trim().toUpperCase();
    if (code && !row.code.includes(code)) return false;
    if (regionFilter.value.length > 0 && !regionFilter.value.includes(row.region)) return false;
    if (profileFilter.value.length > 0 && !profileFilter.value.includes(row.profile)) return false;
    if (payoffFilter.value !== undefined && row.payoff !== payoffFilter.value) return false;
    if (directionFilter.value !== 'All' && row.direction !== directionFilter.value) return false;
    const day = aestDay(row.deal.capturedAt);
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

const subtitle = computed(() =>
  loading.value && deals.value.length === 0 ? 'ASX futures' : `ASX futures · ${deals.value.length} deals`,
);

function openDeal(row: Row) {
  void router.push(`/deals/${row.id}`);
}

function onKeydown(event: KeyboardEvent) {
  if (!canCapture.value) return;
  if (event.key.toLowerCase() !== 'n' || event.ctrlKey || event.metaKey || event.altKey || isTyping(event)) return;
  event.preventDefault();
  void router.push('/deals/new');
}
</script>

<template>
  <Blade title="Deals" :subtitle="subtitle" size="fill" :closable="false" @keydown="onKeydown">
    <template v-if="canCapture" #actions>
      <Button size="sm" severity="primary" icon="plus" :as="RouterLink" to="/deals/new">Capture deal</Button>
    </template>

    <Message v-if="loadError" severity="error" title="Deals could not be loaded">
      The server did not answer. Check your connection and try again.
      <Button size="sm" variant="outlined" icon="refresh-cw" @click="load">Retry</Button>
    </Message>

    <DataTable
      v-model:sort="sort"
      :rows="pageRows"
      :columns="columns"
      :row-id="(row: Row) => row.id"
      :row-href="(row: Row) => `/deals/${row.id}`"
      :row-active="(row: Row) => route.params.id === row.id"
      :loading="loading"
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
        <!-- ToggleGroup has no visible label of its own; this gives it one, styled like the fields beside it, so
             it lines up with them instead of floating at the top of the bar. -->
        <div class="deals-filter">
          <span class="r-field__label" aria-hidden="true">Direction</span>
          <ToggleGroup v-model="directionFilter" :options="directionOptions" label="Direction" size="sm" mandatory />
        </div>
        <DateRangePicker v-model="capturedRange" size="sm" label="Captured" />
      </template>

      <template #cell-captured="{ row }">
        <span class="deals-muted">{{ formatInstant((row as Row).deal.capturedAt) }}</span>
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
        <div v-if="filtersActive" class="deals-nomatch">
          <span>No deals match these filters.</span>
          <Button size="sm" variant="outlined" icon="filter-x" @click="clearFilters">Clear filters</Button>
        </div>
        <EmptyState
          v-else-if="!loadError"
          icon="inbox"
          title="No deals captured yet"
          description="Capture an ASX futures deal from its product code."
        >
          <template v-if="canCapture" #actions>
            <Button size="sm" severity="primary" icon="plus" :as="RouterLink" to="/deals/new">Capture deal</Button>
          </template>
        </EmptyState>
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

.deals-filter {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-family: var(--font-ui);
}
</style>
