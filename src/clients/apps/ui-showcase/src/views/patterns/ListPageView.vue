<script setup lang="ts">
/*
 * List page pattern: table fills the body; pager lives in the page footer.
 * Filters sit in DataTable's sticky `#filters` bar — free-form, caller-owned.
 * Placeholder data only — swap for a real config-admin-shaped example later.
 */
import {
  Checkbox,
  DataTable,
  Input,
  MultiSelect,
  Pagination,
  Select,
  Tag,
  type DataTableColumn,
  type SelectOption,
} from '@ets/ui';
import { computed, ref, watch } from 'vue';

interface Row extends Record<string, unknown> {
  name: string;
  owner: string;
  status: 'active' | 'draft' | 'retired';
  keys: number;
}

const ALL: Row[] = Array.from({ length: 101 }, (_, i) => ({
  name: `service-${String(i + 1).padStart(3, '0')}`,
  owner: ['desk', 'ops', 'finance', 'platform'][i % 4]!,
  status: (['active', 'draft', 'retired'] as const)[i % 3]!,
  keys: (i * 3) % 40,
}));

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', field: 'name', sortable: true },
  { id: 'owner', header: 'Owner', field: 'owner', sortable: true, width: '9rem' },
  { id: 'status', header: 'Status', field: 'status', sortable: true, width: '7rem' },
  { id: 'keys', header: 'Keys', field: 'keys', sortable: true, align: 'end', width: '5rem' },
];

const TONES = { active: 'success', draft: 'warning', retired: 'secondary' } as const;

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

const filtered = computed(() =>
  ALL.filter((row) => {
    if (nameFilter.value && !row.name.toLowerCase().includes(nameFilter.value.toLowerCase())) return false;
    if (ownerFilter.value.length > 0 && !ownerFilter.value.includes(row.owner)) return false;
    if (statusFilter.value !== undefined && row.status !== statusFilter.value) return false;
    if (activeOnly.value && row.status !== 'active') return false;
    return true;
  }),
);

const PAGE_SIZE_STORAGE_KEY = 'ets-ui-showcase.list-page.page-size';
const DEFAULT_PAGE_SIZE = 10;

function readPersistedPageSize(): number {
  try {
    const raw = window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && Number.isInteger(n) && n >= 1) return n;
    }
  } catch {
    // localStorage disabled / quota / corrupt — fall through to default.
  }
  return DEFAULT_PAGE_SIZE;
}

function writePersistedPageSize(value: number) {
  try {
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(value));
  } catch {
    // Persistence is best-effort; silently drop.
  }
}

const page = ref(0);
const pageSize = ref(readPersistedPageSize());

// Filters change the result set; stay on page 0 so the pager cannot point past
// the last page of a narrower list.
watch([nameFilter, ownerFilter, statusFilter, activeOnly, pageSize], () => {
  page.value = 0;
});

// Cross-session + in-session preference: remount (navigating away and back) and
// new tabs both re-read localStorage on setup.
watch(pageSize, (value) => {
  writePersistedPageSize(value);
});

const pageRows = computed(() => {
  const start = page.value * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});
</script>

<template>
  <div class="list-page">
    <header class="list-page__header">
      <div>
        <h2 class="list-page__title">Services</h2>
        <p class="list-page__note">
          Pattern shell: sticky filter bar with the table headers, scrollable body, pagination pinned in the page
          footer. Filters are caller-owned — the table only supplies the chrome. Field labels are omitted by default.
          Ctrl/Cmd+K (or /) cycles focus across fields marked with focusShortcut.
        </p>
      </div>
    </header>

    <div class="list-page__body">
      <DataTable
        :rows="pageRows"
        :columns="columns"
        :row-id="(row: Row) => row.name"
        empty-text="No services match the current filters."
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
          <Tag :severity="TONES[(row as Row).status]">{{ (row as Row).status }}</Tag>
        </template>
      </DataTable>
    </div>

    <footer class="list-page__footer">
      <!--
        v-model (not an arrow that assigns in the template): inline
        `(v) => (pageSize = v)` does not write through the ref proxy, so the
        Select could change while the slice stayed stuck at 10.
      -->
      <Pagination v-model:page="page" v-model:page-size="pageSize" :total="filtered.length" />
    </footer>
  </div>
</template>

<style scoped>
.list-page {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  /* Fill the flush view so the body gets a real height budget; otherwise the
     page grows and `.sb__view` (or nothing useful) scrolls instead of the body. */
  height: 100%;
  min-height: 0;
}

.list-page__header {
  flex: none;
  margin-bottom: var(--sp-4);
  padding-inline: var(--sp-4);
}

.list-page__title {
  margin: 0 0 var(--sp-1);
}

.list-page__note {
  max-width: 62ch;
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.list-page__body {
  flex: 1 1 auto;
  min-height: 0;
  /* Sole vertical scrollport for the table — sticky headers attach here. */
  overflow: auto;
  padding-inline: var(--sp-4);
}

.list-page__footer {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--border-default);
  background: var(--bg-surface);
}
</style>
