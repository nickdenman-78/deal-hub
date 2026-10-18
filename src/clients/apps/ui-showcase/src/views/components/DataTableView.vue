<script setup lang="ts">
import {
  Button,
  Checkbox,
  CommandRail,
  CommandRailGroup,
  DataTable,
  Input,
  MultiSelect,
  Select,
  TableDensityMenu,
  Tag,
  usePersistedRowGroups,
  type DataTableColumn,
  type DataTableDensity,
  type SelectOption,
} from '@ets/ui';
import { computed, ref, watch } from 'vue';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { dataTableExample } from '../../apiExamples';
import { dataTableProps, dataTableColumnProps, tableDensityMenuProps } from '../../apiDocs';

const density = ref<DataTableDensity>('standard');

interface Service extends Record<string, unknown> {
  name: string;
  bucket: string;
  owner: string;
  keys: number;
  status: 'active' | 'draft' | 'retired';
}

const SERVICES: Service[] = [
  { name: 'pricing-api', bucket: 'Trading', owner: 'desk', keys: 12, status: 'active' },
  { name: 'deals-sync', bucket: 'Trading', owner: 'ops', keys: 3, status: 'active' },
  { name: 'robotrader', bucket: 'Trading', owner: 'desk', keys: 21, status: 'draft' },
  { name: 'billing-run', bucket: 'Billing', owner: 'finance', keys: 47, status: 'active' },
  { name: 'invoice-gen', bucket: 'Billing', owner: 'finance', keys: 8, status: 'retired' },
  { name: 'holiday-svc', bucket: 'Reference', owner: 'platform', keys: 2, status: 'active' },
];

const columns: DataTableColumn<Service>[] = [
  { id: 'name', header: 'Name', field: 'name', sortable: true, filterable: true },
  { id: 'owner', header: 'Owner', field: 'owner', sortable: true, filterable: true, width: '9rem' },
  { id: 'status', header: 'Status', field: 'status', sortable: true, width: '7rem' },
  { id: 'keys', header: 'Keys', field: 'keys', sortable: true, align: 'end', width: '5rem' },
  { id: 'actions', header: '', align: 'end', width: '3rem' },
];

const TONES = { active: 'success', draft: 'warning', retired: 'secondary' } as const;

const search = ref('');
const selected = ref('billing-run');

const nameFilter = ref('');
const ownerFilter = ref<string[]>([]);
const statusFilter = ref<string | undefined>(undefined);
const activeOnly = ref(false);

const ownerOptions: SelectOption<string>[] = [
  { value: 'desk', label: 'desk' },
  { value: 'ops', label: 'ops' },
  { value: 'finance', label: 'finance' },
  { value: 'platform', label: 'platform' },
];

const statusOptions: SelectOption<string>[] = [
  { value: 'active', label: 'active' },
  { value: 'draft', label: 'draft' },
  { value: 'retired', label: 'retired' },
];

const columnFiltered = computed(() =>
  SERVICES.filter((row) => {
    if (nameFilter.value && !row.name.toLowerCase().includes(nameFilter.value.toLowerCase())) return false;
    if (ownerFilter.value.length > 0 && !ownerFilter.value.includes(row.owner)) return false;
    if (statusFilter.value !== undefined && row.status !== statusFilter.value) return false;
    if (activeOnly.value && row.status !== 'active') return false;
    return true;
  }),
);

/*
 * DataTable exposes openGroups as a MODEL rather than keeping it private, so
 * the app decides where expansion state lives. usePersistedRowGroups is the
 * answer to "where", offered once so every table remembers itself the same way.
 *
 * No storagePrefix here, so it writes under the default `ets.`. config-admin
 * passes `retail-config-server.` because that is what it already wrote under —
 * omitting it there would silently reset every operator's saved expansion on
 * first load.
 */
const { expanded: openGroups, reconcile } = usePersistedRowGroups('showcase-services');

// The rows are static here, but a real view loads them, so the reconcile call
// is wired the way a real view wires it: on the data, not on mount. The first
// call is deliberately deferred inside the composable — reconciling against an
// empty Set before an async load resolves would trim every restored entry as
// "no longer present" and wipe the state it just read.
const rows = ref<Service[]>([]);
watch(rows, (next) => reconcile(new Set(next.map((row) => row.bucket))), { immediate: true });
setTimeout(() => (rows.value = SERVICES), 300);

const storageKey = 'ets.expanded-row-groups.showcase-services';
const persisted = computed(() => JSON.stringify(openGroups.value));

const selectedRows = ref<Array<string | number>>(['pricing-api']);
const expandedRows = ref<Array<string | number>>(['billing-run']);
</script>

<template>
  <Specimen
    title="Plain table"
    note="Sortable headers are real buttons inside the th, so sorting is reachable by keyboard. The actions column declares no field, so it offers no sort control — there would be nothing to compare."
  >
    <DataTable :rows="SERVICES" :columns="columns" :row-id="(row: Service) => row.name" striped>
      <template #cell-status="{ row }">
        <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
      </template>
      <template #cell-actions>
        <Button variant="text" size="sm" icon="ellipsis-vertical" aria-label="Row actions" />
      </template>
    </DataTable>
  </Specimen>

  <Specimen
    title="Row density"
    note="compact / standard / comfortable — pad the cells. On a CommandRail, TableDensityMenu is the control: a ⋮ menu of the three options with a check on the current one. ToggleGroup still works when you want all three visible at once."
  >
    <div class="tbl-demo">
      <CommandRail aria-label="Table commands">
        <CommandRailGroup end aria-label="View">
          <TableDensityMenu v-model="density" />
        </CommandRailGroup>
      </CommandRail>
      <DataTable :rows="SERVICES" :columns="columns" :row-id="(row: Service) => row.name" :density="density" striped>
        <template #cell-status="{ row }">
          <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
        </template>
      </DataTable>
    </div>
  </Specimen>

  <Specimen title="Search" note="Filters across filterable columns only — name and owner here, not keys.">
    <div class="tbl-demo">
      <Input v-model="search" label="Filter" icon="search" placeholder="Try “finance” or “trading”" size="sm" />
      <DataTable
        v-model:search="search"
        :rows="SERVICES"
        :columns="columns"
        :row-id="(row: Service) => row.name"
        empty-text="No services match the current filter."
      >
        <template #cell-status="{ row }">
          <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
        </template>
      </DataTable>
    </div>
  </Specimen>

  <Specimen
    title="Filters"
    note="The #filters slot is a sticky bar above the headers — free-form, not column-aligned. Compose any controls; the table owns chrome and sticky stacking, you own values and how rows are filtered. Field labels are omitted by default (keep passing label for a11y; placeholders carry the cue) — set showFilterLabels to show them. Thead stays mounted when the body is empty so clearing a filter that emptied the list does not remove the controls. Fields with focusShortcut join Ctrl/Cmd+K and /, which cycle between them."
  >
    <div class="tbl-demo tbl-demo--scroll">
      <DataTable
        :rows="columnFiltered"
        :columns="columns"
        :row-id="(row: Service) => row.name"
        empty-text="No services match the filters."
        striped
      >
        <template #filters>
          <Input v-model="nameFilter" size="sm" placeholder="Name…" label="Name" clearable focus-shortcut />
          <MultiSelect
            v-model="ownerFilter"
            :options="ownerOptions"
            size="sm"
            placeholder="Owner"
            label="Owner"
            :max-chips="1"
            focus-shortcut
          />
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            size="sm"
            placeholder="Status"
            label="Status"
            clearable
            focus-shortcut
          />
          <Checkbox v-model="activeOnly" label="Active only" />
        </template>

        <template #cell-status="{ row }">
          <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
        </template>
      </DataTable>
    </div>
  </Specimen>

  <Specimen
    title="Grouped, collapsible — the ServicesView shape"
    note="One tbody, one flat render list: a group collapses by simply not emitting its rows. No colspan arithmetic, which is exactly the hack PrimeVue's row-group mode needed a pt override for. Open groups are a v-model, and usePersistedRowGroups is what the app binds to it."
  >
    <div class="tbl-demo">
      <p class="tbl-demo__state">
        <code>{{ storageKey }}</code> = <code>{{ persisted }}</code>
        <br />
        Expand a group and reload the page — the state comes back. Rows arrive 300ms late here on purpose, which is the
        case the composable's deferred first reconcile exists for.
      </p>
      <DataTable
        v-model:open-groups="openGroups"
        :rows="rows"
        :columns="columns"
        :row-id="(row: Service) => row.name"
        group-by="bucket"
        density="compact"
        striped
      >
        <template #cell-status="{ row }">
          <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
        </template>
      </DataTable>
    </div>
  </Specimen>

  <Specimen
    title="Row drill-down — the blade contract"
    note="rowHref and rowActive take ONE predicate between them so they cannot disagree about which row is open. The table never navigates itself: it emits rowActivate and the blade decides. Ctrl/cmd-click opens rowHref in a new tab; arrow keys move within one tab stop."
  >
    <DataTable
      :rows="SERVICES"
      :columns="columns"
      :row-id="(row: Service) => row.name"
      :row-href="(row: Service) => `/services/${row.name}`"
      :row-active="(row: Service) => row.name === selected"
      striped
      @row-activate="(row: Service) => (selected = row.name)"
    >
      <template #cell-status="{ row }">
        <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
      </template>
    </DataTable>
  </Specimen>

  <Specimen
    title="Selection and expansion"
    note="selectable adds a leading checkbox column with a select-all header; selection is kept in the table rather than v0's selectStrategy so ids of filtered-out rows survive a filter — a bulk action must not silently shrink because the operator narrowed the view after ticking. expandable adds a chevron column that toggles a full-width row rendered from the #expanded slot; both sets are v-models of row ids."
  >
    <div class="tbl-demo">
      <p class="tbl-demo__state">
        Selected: <code>{{ JSON.stringify(selectedRows) }}</code>
        <br />
        Expanded: <code>{{ JSON.stringify(expandedRows) }}</code>
      </p>
      <DataTable
        v-model:selected="selectedRows"
        v-model:expanded="expandedRows"
        :rows="SERVICES"
        :columns="columns"
        :row-id="(row: Service) => row.name"
        selectable
        expandable
        striped
      >
        <template #cell-status="{ row }">
          <Tag :severity="TONES[(row as Service).status]">{{ (row as Service).status }}</Tag>
        </template>
        <template #expanded="{ row }">
          <p class="tbl-demo__detail">
            <code>{{ (row as Service).bucket }}/{{ (row as Service).name }}</code> is owned by
            {{ (row as Service).owner }} and holds {{ (row as Service).keys }} keys.
          </p>
        </template>
      </DataTable>
    </div>
  </Specimen>

  <Specimen title="Loading and empty">
    <div class="tbl-demo">
      <DataTable :rows="[]" :columns="columns" :row-id="(row: Service) => row.name" loading />
      <DataTable :rows="[]" :columns="columns" :row-id="(row: Service) => row.name" empty-text="No services yet." />
    </div>
  </Specimen>
  <CodeExample :code="dataTableExample" />

  <PropsTable :rows="dataTableProps" />
  <PropsTable :rows="dataTableColumnProps" title="DataTableColumn" note="Column definition passed in `columns`." />
  <PropsTable :rows="tableDensityMenuProps" title="TableDensityMenu" />
</template>

<style scoped>
.tbl-demo {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.tbl-demo--scroll {
  max-height: 16rem;
  overflow: auto;
  border: 1px solid var(--border-subtle);
}

.tbl-demo__state {
  font-size: var(--fs-xs);
}

.tbl-demo__detail {
  margin: 0;
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
