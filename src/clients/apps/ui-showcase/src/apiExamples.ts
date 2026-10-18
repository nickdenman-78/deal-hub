/** Canonical usage snippets for showcase leaves. Keep short and copy-pasteable. */

export const buttonExample = `<script setup lang="ts">
import { Button } from '@ets/ui';
</script>

<template>
  <Button severity="primary" icon="plus">Add service</Button>
  <Button variant="text" :busy="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</Button>
  <Button variant="outlined" icon="x" aria-label="Close" />
</template>`;

export const themeToggleExample = `<script setup lang="ts">
import { ThemeToggle } from '@ets/ui';
</script>

<template>
  <ThemeToggle />
  <ThemeToggle labeled show-resolved />
</template>`;

export const inputExample = `<script setup lang="ts">
import { Input } from '@ets/ui';
import { ref } from 'vue';

const search = ref('');
</script>

<template>
  <Input v-model="search" label="Search" icon="search" placeholder="Filter services…" />
</template>`;

export const maskedInputExample = `<script setup lang="ts">
import {
  MaskedInput,
  idNameRule,
  maskAuIntlPhone,
  maskAuLandline,
  maskAuMobile,
  normalizeIdName,
  unformatAuIntlPhone,
  unformatAuLandline,
  unformatAuMobile,
} from '@ets/ui';
import { ref } from 'vue';

const name = ref('rdcs-pricing');
const mobile = ref('0491570159');
const landline = ref('0255504321');
const intl = ref('+61491570159');
</script>

<template>
  <MaskedInput
    v-model="name"
    label="Service name"
    :mask="normalizeIdName"
    :rules="[idNameRule()]"
  />
  <MaskedInput
    v-model="mobile"
    label="AU mobile"
    :mask="unformatAuMobile"
    :blur-mask="maskAuMobile"
  />
  <MaskedInput
    v-model="landline"
    label="AU landline"
    :mask="unformatAuLandline"
    :blur-mask="maskAuLandline"
  />
  <MaskedInput
    v-model="intl"
    label="AU mobile (international)"
    :mask="unformatAuIntlPhone"
    :blur-mask="maskAuIntlPhone"
  />
</template>`;

export const abnAcnInputExample = `<script setup lang="ts">
import { AbnAcnInput, type AbnAcnKind } from '@ets/ui';
import { ref } from 'vue';

const abn = ref('51824753556');
const value = ref('51824753556');
const kind = ref<AbnAcnKind>('abn');
</script>

<template>
  <AbnAcnInput v-model="abn" label="ABN" />
  <AbnAcnInput
    v-model="value"
    v-model:kind="kind"
    kind-selector
    label="Business identifier"
  />
</template>`;

export const creditCardInputExample = `<script setup lang="ts">
import { CreditCardInput } from '@ets/ui';
import { ref } from 'vue';

/** Contiguous digits in v-model; grouped display when resting. */
const card = ref('4111111111111111');
</script>

<template>
  <CreditCardInput v-model="card" label="Card number" />
  <CreditCardInput v-model="card" label="Masked" masked />
  <CreditCardInput v-model="card" label="No password managers" :autofill="false" />
</template>`;

export const nmiInputExample = `<script setup lang="ts">
import { NmiInput } from '@ets/ui';
import { ref } from 'vue';

const nmi = ref('NCCC0043026');
</script>

<template>
  <NmiInput v-model="nmi" label="NMI" />
</template>`;

export const numberInputExample = `<script setup lang="ts">
import { NumberInput } from '@ets/ui';
import { ref } from 'vue';

const certs = ref('1000');
const rate = ref('178.45');
</script>

<template>
  <NumberInput
    v-model="certs"
    label="Certificate volume"
    suffix-unit="certs"
    :fraction-digits="0"
    locale="en-AU"
  />
  <NumberInput
    v-model="rate"
    label="Capacity charge"
    prefix-unit="$"
    suffix-unit="/MW"
    locale="en-AU"
  />
</template>`;

export const textareaExample = `<script setup lang="ts">
import { Textarea } from '@ets/ui';
import { ref } from 'vue';

const notes = ref('');
</script>

<template>
  <Textarea v-model="notes" label="Notes" :rows="6" mono />
</template>`;

export const checkboxExample = `<script setup lang="ts">
import { Checkbox } from '@ets/ui';
import { ref } from 'vue';

const includeArchived = ref(false);
</script>

<template>
  <Checkbox v-model="includeArchived" label="Include archived" />
</template>`;

export const switchExample = `<script setup lang="ts">
import { Switch } from '@ets/ui';
import { ref } from 'vue';

const enabled = ref(true);
</script>

<template>
  <Switch v-model="enabled" label="Enabled" />
</template>`;

export const selectExample = `<script setup lang="ts">
import { Select, type SelectOption } from '@ets/ui';
import { ref } from 'vue';

const options: SelectOption<string>[] = [
  { value: 'test', label: 'Test' },
  { value: 'prod', label: 'Production' },
];
const environment = ref<string | undefined>('test');
</script>

<template>
  <Select v-model="environment" :options="options" label="Environment" />
</template>`;

export const multiSelectExample = `<script setup lang="ts">
import { MultiSelect, type SelectOption } from '@ets/ui';
import { ref } from 'vue';

const options: SelectOption<string>[] = [
  { value: 'desk', label: 'Desk' },
  { value: 'ops', label: 'Ops' },
];
const owners = ref<string[]>(['desk']);
</script>

<template>
  <MultiSelect v-model="owners" :options="options" label="Owners" :max-chips="3" />
</template>`;

export const comboboxExample = `<script setup lang="ts">
import { Combobox } from '@ets/ui';
import { ref } from 'vue';

const owner = ref<string | undefined>();
</script>

<template>
  <Combobox
    v-model="owner"
    :options="['desk', 'ops', 'finance']"
    label="Owner"
    placeholder="Type or pick…"
  />
</template>`;

export const toggleGroupExample = `<script setup lang="ts">
import { ToggleGroup } from '@ets/ui';
import { ref } from 'vue';

const density = ref('standard');
</script>

<template>
  <ToggleGroup
    v-model="density"
    label="Row density"
    mandatory
    :options="[
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'comfortable', label: 'Comfortable' },
    ]"
  />
</template>`;

export const radioGroupExample = `<script setup lang="ts">
import { RadioGroup } from '@ets/ui';
import { ref } from 'vue';

const delivery = ref<'immediate' | 'digest'>('immediate');
</script>

<template>
  <RadioGroup
    v-model="delivery"
    label="Delivery"
    :options="[
      { value: 'immediate', label: 'Immediately', description: 'Send each alert as it happens.' },
      { value: 'digest', label: 'Daily digest', description: 'Bundle alerts into one morning email.' },
    ]"
  />
</template>`;

export const monthPickerExample = `<script setup lang="ts">
import { MonthPicker, monthOfDate } from '@ets/ui';
import { ref } from 'vue';

// The model is an ISO \`yyyy-MM\` string, never a Date.
const term = ref<string | undefined>('2026-08');

// Billing runs in arrears, so a future month has no run to report on.
const lastMonth = monthOfDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
</script>

<template>
  <MonthPicker v-model="term" label="Billing term" :max="lastMonth" clearable />
</template>`;

export const datePickerExample = `<script setup lang="ts">
import { DatePicker, WEEKEND_DAYS } from '@ets/ui';
import { ref } from 'vue';

const day = ref<string | undefined>('2026-07-03');
const holidays = ['2026-12-25', '2026-12-26', '2027-01-01'];
</script>

<template>
  <DatePicker
    v-model="day"
    label="Business day"
    :disabled-weekdays="WEEKEND_DAYS"
    :disabled-dates="holidays"
  />
</template>`;

export const dropzoneExample = `<script setup lang="ts">
import { Dropzone } from '@ets/ui';
import { ref } from 'vue';

const names = ref<string[]>([]);
</script>

<template>
  <Dropzone
    accept=".json"
    multiple
    label="Add configuration documents"
    @select="(files) => (names = files.map((f) => f.name))"
  />
  <ul>
    <li v-for="name in names" :key="name">{{ name }}</li>
  </ul>
</template>`;

export const timePickerExample = `<script setup lang="ts">
import { TimePicker } from '@ets/ui';
import { ref } from 'vue';

const start = ref<string | undefined>('09:00');
</script>

<template>
  <TimePicker v-model="start" label="Start time" min="09:00" max="17:00" />
</template>`;

export const dateTimePickerExample = `<script setup lang="ts">
import { DateTimePicker } from '@ets/ui';
import { ref } from 'vue';

const effective = ref<string | undefined>('2026-07-01T09:30');
</script>

<template>
  <DateTimePicker v-model="effective" label="Effective from" />
</template>`;

export const dateRangePickerExample = `<script setup lang="ts">
import { DateRangePicker, type DateRange } from '@ets/ui';
import { ref } from 'vue';

const range = ref<DateRange>({ from: '2026-07-01', to: '2026-07-31' });
</script>

<template>
  <DateRangePicker v-model="range" label="Audit period" />
</template>`;

export const dateRangeSelectorExample = `<script setup lang="ts">
import {
  DateRangeSelector,
  addLocalDays,
  lastNDaysRange,
  type DateRange,
  type DateRangePreset,
} from '@ets/ui';
import { ref } from 'vue';

const range = ref<DateRange>({});

/** Replace the default catalog — each preset snapshots into a DateRange for today. */
const WINDOW_PRESETS: DateRangePreset[] = [
  {
    id: 'yesterday',
    label: 'Yesterday',
    resolve: ({ today }) => {
      const day = addLocalDays(today, -1);
      return { from: day, to: day };
    },
  },
  {
    id: 'last-7',
    label: 'Last 7 days',
    resolve: ({ today }) => lastNDaysRange(today, 7),
  },
];
</script>

<template>
  <DateRangeSelector
    v-model="range"
    label="Date range"
    clearable
    size="sm"
    :presets="WINDOW_PRESETS"
  />
</template>`;

export const messageExample = `<script setup lang="ts">
import { Message } from '@ets/ui';
</script>

<template>
  <Message severity="warning" title="Clients still cache the old key" closable>
    Propagation can take up to five minutes.
  </Message>
</template>`;

export const tagExample = `<script setup lang="ts">
import { Tag } from '@ets/ui';
</script>

<template>
  <Tag severity="success">active</Tag>
  <Tag severity="warning" variant="outline">draft</Tag>
</template>`;

export const badgeExample = `<script setup lang="ts">
import { Badge, Button } from '@ets/ui';
import { ref } from 'vue';

const unread = ref(120);
</script>

<template>
  <Badge :content="unread" :max="99" label="Unread messages">
    <Button variant="text" icon="inbox" aria-label="Messages" />
  </Badge>
  <Badge dot severity="primary">
    <Button variant="text" icon="book" aria-label="Docs" />
  </Badge>
</template>`;

export const spinnerExample = `<script setup lang="ts">
import { Spinner } from '@ets/ui';
</script>

<template>
  <Spinner label="Loading services" centered />
</template>`;

export const gradientDividerExample = `<script setup lang="ts">
import { GradientDivider } from '@ets/ui';
</script>

<template>
  <div style="display: flex; align-items: center; gap: 1.5rem">
    <span>ETS</span>
    <GradientDivider />
    <span>Solutions</span>
  </div>

  <GradientDivider orientation="horizontal" />

  <GradientDivider orientation="vertical" :thickness="3" length="auto" />
</template>`;

export const skeletonExample = `<script setup lang="ts">
import { Skeleton } from '@ets/ui';
</script>

<template>
  <Skeleton variant="circle" />
  <Skeleton variant="title" />
  <Skeleton variant="subtitle" />
  <Skeleton variant="line" width="92%" />
  <Skeleton variant="line" width="61%" />
</template>`;

export const emptyStateExample = `<script setup lang="ts">
import { Button, EmptyState } from '@ets/ui';
</script>

<template>
  <EmptyState
    icon="inbox"
    title="No services yet"
    description="Services appear here once a project registers one."
  >
    <template #actions>
      <Button severity="primary" icon="plus">Add service</Button>
    </template>
  </EmptyState>
</template>`;

export const progressBarExample = `<script setup lang="ts">
import { ProgressBar } from '@ets/ui';
</script>

<template>
  <ProgressBar :value="72" label="Publish progress" show-value />
</template>`;

export const cardExample = `<script setup lang="ts">
import { Card, Button } from '@ets/ui';
</script>

<template>
  <Card title="Signing key" subtitle="Rotated 3 days ago">
    <p>RSA 4096 · expires 2027-01-01</p>
    <template #actions>
      <Button size="sm">Rotate</Button>
    </template>
  </Card>
</template>`;

export const pageHeaderExample = `<script setup lang="ts">
import { Button, PageHeader, Tag } from '@ets/ui';
</script>

<template>
  <PageHeader title="pricing-api" subtitle="trading/pricing-api/_base.json" subtitle-mono>
    <template #meta>
      <Tag severity="success">active</Tag>
    </template>
    <template #actions>
      <Button size="sm" severity="primary" icon="plus">New key</Button>
    </template>
  </PageHeader>
</template>`;

export const commandRailExample = `<script setup lang="ts">
import { Button, CommandRail, CommandRailGroup, Input } from '@ets/ui';
</script>

<template>
  <CommandRail aria-label="Service commands">
    <CommandRailGroup>
      <Button severity="primary" variant="link" weight="regular" size="sm" icon="plus">New service</Button>
    </CommandRailGroup>
    <CommandRailGroup>
      <Input size="sm" placeholder="Filter…" label="Filter" clearable />
    </CommandRailGroup>
    <CommandRailGroup end>
      <Button severity="primary" variant="link" weight="regular" size="sm" icon="refresh-cw">Refresh</Button>
    </CommandRailGroup>
  </CommandRail>
</template>`;

export const dialogExample = `<script setup lang="ts">
import { Button, Dialog } from '@ets/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Button @click="open = true">Open</Button>

  <Dialog v-model:open="open" title="Rotate signing key" description="Re-encrypts every slot file.">
    <p>Clients cache the old key for up to five minutes.</p>
    <template #footer>
      <Button variant="outlined" @click="open = false">Cancel</Button>
      <Button severity="primary" @click="open = false">Rotate</Button>
    </template>
  </Dialog>
</template>`;

export const confirmExample = `<script setup lang="ts">
import { Button, confirm } from '@ets/ui';

async function onDelete() {
  if (!(await confirm({
    title: 'Delete key?',
    message: 'This cannot be undone.',
    destructive: true,
  }))) return;
  // …
}
</script>

<template>
  <Button severity="error" @click="onDelete">Delete</Button>
</template>`;

export const drawerExample = `<script setup lang="ts">
import { Button, Drawer, Input } from '@ets/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Button @click="open = true">Filters</Button>

  <Drawer v-model:open="open" title="Filters">
    <Input label="Service name" icon="search" />
    <template #footer>
      <Button severity="primary" @click="open = false">Apply</Button>
    </template>
  </Drawer>
</template>`;

export const menuExample = `<script setup lang="ts">
import { Icon, Menu, type MenuItem } from '@ets/ui';

const items: MenuItem[] = [
  { label: 'Rename', icon: 'square-pen', action: () => {} },
  { separator: true },
  { label: 'Delete', icon: 'trash-2', destructive: true, action: () => {} },
];
</script>

<template>
  <Menu :items="items" trigger-label="Row actions" trigger-class="row-menu">
    <template #trigger>
      <Icon name="ellipsis-vertical" :size="16" />
    </template>
  </Menu>
</template>`;

export const megaMenuExample = `<script setup lang="ts">
import { chunkColumns, MegaMenu, type MegaMenuEntry } from '@ets/ui';
import { useRoute } from 'vue-router';

const route = useRoute();

const refs = [
  { title: 'Networks', path: '/reference/networks' },
  { title: 'Tariffs', path: '/reference/tariffs' },
];

const model: MegaMenuEntry[] = [
  {
    label: 'Trading',
    icon: 'zap',
    columns: [
      [{ label: 'Positions', items: [{ label: 'Open positions', to: '/positions' }] }],
      [{ label: 'Curves', items: [{ label: 'Forward curve', to: '/curves' }] }],
    ],
  },
  {
    // One long list, chunked into columns of six — DOM columns match the eye's.
    label: 'Reference data',
    columns: chunkColumns(
      refs.map((item) => ({ label: item.title, to: item.path, active: route.path === item.path })),
      6,
    ),
  },
  { label: 'Docs', href: '/docs' },
];
</script>

<template>
  <MegaMenu :model="model" label="Main navigation" />
</template>`;

export const contextMenuExample = `<script setup lang="ts">
import { ContextMenu, type MenuItem } from '@ets/ui';

const items: MenuItem[] = [
  { label: 'Open', action: () => {} },
  { label: 'Delete', destructive: true, action: () => {} },
];
</script>

<template>
  <ContextMenu :items="items">
    <div class="target">Right-click me</div>
  </ContextMenu>
</template>`;

export const popoverExample = `<script setup lang="ts">
import { Button, Checkbox, Popover } from '@ets/ui';
</script>

<template>
  <!-- Leave uncontrolled when Specimen (or any host) mounts twice —
       a shared v-model:open across two popover="auto" instances deadlocks. -->
  <Popover label="Columns" position-area="bottom span-right">
    <template #trigger="{ open }">
      <Button icon-end="chevron-down" :aria-expanded="open">Columns</Button>
    </template>
    <template #default="{ close }">
      <Checkbox model-value label="Name" />
      <Button size="sm" @click="close">Done</Button>
    </template>
  </Popover>
</template>`;

export const tooltipExample = `<script setup lang="ts">
import { Button, Tooltip } from '@ets/ui';
</script>

<template>
  <Tooltip text="Supplementary only — unreachable on touch.">
    <Button variant="text" icon="info" aria-label="About" />
  </Tooltip>
</template>`;

export const toastExample = `<script setup lang="ts">
import { Button, useToast } from '@ets/ui';

const toast = useToast();
</script>

<template>
  <Button @click="toast.success('Saved', 'Config published to test.')">Save</Button>
  <Button @click="toast.error('Publish failed', 'HTTP 409')">Fail</Button>
</template>`;

export const dataTableExample = `<script setup lang="ts">
import { DataTable, Input, Select, Tag, type DataTableColumn, type SelectOption } from '@ets/ui';
import { computed, ref } from 'vue';

interface Row {
  name: string;
  status: 'active' | 'draft';
}

const columns: DataTableColumn<Row>[] = [
  { id: 'name', header: 'Name', field: 'name', sortable: true, filterable: true },
  { id: 'status', header: 'Status', field: 'status', sortable: true },
];

const rows: Row[] = [
  { name: 'pricing-api', status: 'active' },
  { name: 'deals-sync', status: 'draft' },
];

const nameFilter = ref('');
const statusFilter = ref<string | undefined>();
const statusOptions: SelectOption<string>[] = [
  { value: 'active', label: 'active' },
  { value: 'draft', label: 'draft' },
];

const filtered = computed(() =>
  rows.filter((row) => {
    if (nameFilter.value && !row.name.includes(nameFilter.value)) return false;
    if (statusFilter.value !== undefined && row.status !== statusFilter.value) return false;
    return true;
  }),
);
</script>

<template>
  <DataTable :rows="filtered" :columns="columns" :row-id="(row) => row.name" striped>
    <template #filters>
      <Input v-model="nameFilter" size="sm" placeholder="Name…" label="Name" clearable focus-shortcut />
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        size="sm"
        placeholder="Status"
        label="Status"
        clearable
        focus-shortcut
      />
    </template>
    <template #cell-status="{ row }">
      <Tag :severity="row.status === 'active' ? 'success' : 'warning'">{{ row.status }}</Tag>
    </template>
  </DataTable>
</template>`;

export const paginationExample = `<script setup lang="ts">
import { Pagination } from '@ets/ui';
import { ref } from 'vue';

const page = ref(0);
const pageSize = ref(25);
</script>

<template>
  <Pagination
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="101"
  />
  <!-- Override presets / lock out Custom… per table:
  <Pagination
    v-model:page="page"
    v-model:page-size="pageSize"
    :total="101"
    :page-size-options="[10, 25, 50]"
    :allow-custom-page-size="false"
  />
  -->
</template>`;

export const treeExample = `<script setup lang="ts">
import { Tree, type TreeItem } from '@ets/ui';
import { ref } from 'vue';

const items: TreeItem[] = [
  {
    id: 'trading',
    label: 'Trading',
    icon: 'folder',
    children: [
      { id: 'pricing-api', label: 'pricing-api', icon: 'file-json' },
      { id: 'deals-sync', label: 'deals-sync', icon: 'file-json' },
    ],
  },
];
const selected = ref<string[]>(['deals-sync']);
</script>

<template>
  <Tree
    v-model="selected"
    :items="items"
    label="Files to publish"
    multiple
    checkboxes
    select-mode="toggle"
    open-all
  />
</template>`;

export const accordionExample = `<script setup lang="ts">
import { Accordion, AccordionItem } from '@ets/ui';
import { ref } from 'vue';

const open = ref('billing');
</script>

<template>
  <Accordion v-model="open">
    <AccordionItem value="billing">
      <template #header>Billing</template>
      Invoice cadence and payment methods.
    </AccordionItem>
    <AccordionItem value="access">
      <template #header>Access</template>
      Groups and operators with publish rights.
    </AccordionItem>
  </Accordion>

  <Accordion v-model="open" orientation="horizontal" style="min-height: 14rem">
    <AccordionItem value="billing">
      <template #header>Billing</template>
      Invoice cadence and payment methods.
    </AccordionItem>
    <AccordionItem value="access">
      <template #header>Access</template>
      Groups and operators with publish rights.
    </AccordionItem>
  </Accordion>
</template>`;

export const tabsExample = `<script setup lang="ts">
import { Tabs, TabList, Tab, TabPanel } from '@ets/ui';
import { ref } from 'vue';

const tab = ref('overview');
</script>

<template>
  <Tabs v-model="tab">
    <TabList label="Service detail">
      <Tab value="overview" icon="info">Overview</Tab>
      <Tab value="keys" icon="key">Keys</Tab>
    </TabList>
    <TabPanel value="overview">Twelve keys across four environments.</TabPanel>
    <TabPanel value="keys">Keys resolve through merge precedence.</TabPanel>
  </Tabs>
</template>`;

export const stepperExample = `<script setup lang="ts">
import { Button, Stepper, StepperPanel, type StepperStep } from '@ets/ui';
import { ref } from 'vue';

type Step = 'archive' | 'review' | 'confirm';
const step = ref<Step>('archive');

const steps: StepperStep<Step>[] = [
  { value: 'archive', label: 'Archive', description: 'File and password' },
  { value: 'review', label: 'Review', description: 'Choose what to import' },
  { value: 'confirm', label: 'Confirm', description: 'Type RESTORE' },
];
</script>

<template>
  <Stepper v-model="step" :steps="steps" label="Restore steps">
    <StepperPanel value="archive">…</StepperPanel>
    <StepperPanel value="review">…</StepperPanel>
    <StepperPanel value="confirm">…</StepperPanel>

    <!-- One footer for the whole flow: the buttons change, their place does not.
         Forward moves live here, never on a marker — that is what linear means. -->
    <template #actions="{ isFirst, prev }">
      <Button v-if="!isFirst" variant="outlined" icon="arrow-left" @click="prev">Back</Button>
      <Button v-if="step === 'archive'" severity="primary" @click="compare">Compare</Button>
    </template>
  </Stepper>
</template>`;

export const editorTabsExample = `<script setup lang="ts">
import { EditorTabs, type EditorTab } from '@ets/ui';
import { ref } from 'vue';

const tabs = ref<EditorTab[]>([
  { id: 'base', label: '_base.json', title: 'trading/pricing-api/_base.json' },
  { id: 'test', label: 'test.json', dirty: true },
]);
const active = ref<string | undefined>('test');

function close(id: string) {
  tabs.value = tabs.value.filter((t) => t.id !== id);
  if (active.value === id) active.value = tabs.value[0]?.id;
}

function reorder(ids: string[]) {
  tabs.value = ids.map((id) => tabs.value.find((t) => t.id === id)!);
}
</script>

<template>
  <EditorTabs v-model="active" :tabs="tabs" mono @close="close" @reorder="reorder" />
</template>`;

export const breadcrumbsExample = `<script setup lang="ts">
import { Breadcrumbs } from '@ets/ui';
</script>

<template>
  <Breadcrumbs
    :items="[
      { label: 'Groups', to: '/groups' },
      { label: 'Trading', to: '/groups/trading' },
      { label: 'pricing-api' },
    ]"
  />
</template>`;

export const avatarExample = `<script setup lang="ts">
import { Avatar } from '@ets/ui';
</script>

<template>
  <Avatar name="Anna Bell" size="md" />
  <Avatar name="Ops Bot" src="/avatars/ops.png" />
</template>`;

export const timelineExample = `<script setup lang="ts">
import { Timeline, type TimelineItem } from '@ets/ui';
import { ref } from 'vue';

const items: TimelineItem[] = [
  { id: 'v14', title: 'Published to prod', meta: '2 hours ago', trailing: 'a.operator', icon: 'upload' },
  { id: 'v13', title: 'Signing key rotated', meta: 'yesterday', trailing: 'ops-bot', icon: 'key' },
];
const version = ref<string | null>('v14');
</script>

<template>
  <!-- Read-only feed -->
  <Timeline :items="items" label="Recent activity" />

  <!-- Selectable version picker -->
  <Timeline v-model="version" :items="items" selectable mono label="Version history" />
</template>`;

export const splitterExample = `<script setup lang="ts">
import { Splitter, SplitterPanel } from '@ets/ui';
</script>

<template>
  <Splitter style="height: 240px">
    <SplitterPanel :default-size="30" :min-size="15">Nav</SplitterPanel>
    <SplitterPanel :default-size="70" handle>Main</SplitterPanel>
  </Splitter>
</template>`;

export const iconExample = `<script setup lang="ts">
import { Icon } from '@ets/ui';
</script>

<template>
  <Icon name="search" :size="16" />
  <Icon name="triangle-alert" :size="20" label="Warning" />
</template>`;

export const cronEditorExample = `<script setup lang="ts">
import { CronEditor } from '@ets/ui';
import { ref } from 'vue';

const schedule = ref('0 6 * * 1-5');
</script>

<template>
  <CronEditor v-model="schedule" label="Publish schedule" />
</template>`;

export const ipv4EditorExample = `<script setup lang="ts">
import { Ipv4Editor } from '@ets/ui';
import { ref } from 'vue';

const cidr = ref('10.0.0.0/24');
</script>

<template>
  <Ipv4Editor v-model="cidr" label="Network" format="cidr" show-subnet-info />
</template>`;

export const durationInputExample = `<script setup lang="ts">
import { DurationInput } from '@ets/ui';
import { ref } from 'vue';

const ttl = ref('2h30m');
</script>

<template>
  <DurationInput
    v-model="ttl"
    label="TTL"
    :presets="['30s', '5m', '1h']"
  />
</template>`;

export const keyValueEditorExample = `<script setup lang="ts">
import { KeyValueEditor } from '@ets/ui';
import { ref } from 'vue';

const labels = ref<Record<string, string>>({ team: 'trading' });
</script>

<template>
  <KeyValueEditor
    v-model="labels"
    label="Labels"
    key-placeholder="key"
    value-placeholder="value"
    :rules="{ pattern: /^[a-z][a-z0-9_-]*$/, patternMessage: 'Lower case, digits, hyphens and underscores.' }"
    sortable
  />
</template>`;

export const scheduleEditorExample = `<script setup lang="ts">
import { ScheduleEditor, type ScheduleValue } from '@ets/ui';
import { ref } from 'vue';

const schedule = ref<ScheduleValue>();
</script>

<template>
  <ScheduleEditor
    v-model="schedule"
    label="Report schedule"
    description="When the settlement report is generated."
  />
</template>`;

export const useClockExample = `<script setup lang="ts">
import { useClock } from '@ets/ui';
import { computed } from 'vue';

// One shared, refcounted timer app-wide. This subscription wakes the
// page once a minute; unmounting releases it automatically.
const minute = useClock('minute');
const hhmm = computed(() =>
  minute.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
);
</script>

<template>
  <span>{{ hhmm }}</span>
</template>`;

export const tagsInputExample = `<script setup lang="ts">
import { TagsInput } from '@ets/ui';
import { ref } from 'vue';

const owners = ref(['desk', 'ops']);
</script>

<template>
  <TagsInput
    v-model="owners"
    label="Owners"
    :suggestions="['desk', 'ops', 'finance']"
  />
</template>`;

export const bladeExample = `<script setup lang="ts">
import { Blade, BladeLink, BladeStack } from '@ets/ui';
</script>

<template>
  <BladeStack>
    <Blade title="Deals" size="sm" :closable="false">
      <BladeLink to="/deals/d-1">LFBB QLD 2026</BladeLink>
      <RouterView />
    </Blade>
  </BladeStack>
</template>`;

export const jsonEditorExample = `<script setup lang="ts">
import { JsonEditor } from '@ets/editor';
import { ref } from 'vue';

const value = ref('{ "retries": 3 }');
</script>

<template>
  <JsonEditor v-model="value" language="json" :is-dark="null" />
</template>`;

export const diffViewerExample = `<script setup lang="ts">
import { DiffViewer } from '@ets/editor';
</script>

<template>
  <DiffViewer
    original='{ "retries": 2 }'
    modified='{ "retries": 3 }'
    language="json"
  />
</template>`;

export const mergeEditorExample = `<script setup lang="ts">
import { MergeEditor } from '@ets/editor';
</script>

<template>
  <MergeEditor
    base='{ "retries": 2 }'
    theirs='{ "retries": 3 }'
    mine='{ "retries": 4 }'
    language="json"
  />
</template>`;

export const markdownEditorExample = `<script setup lang="ts">
import { MarkdownEditor } from '@ets/editor';
import { ref } from 'vue';

const doc = ref('# Title\\n\\nBody');
</script>

<template>
  <MarkdownEditor v-model="doc" min-height="12rem" />
</template>`;

export const markdownViewExample = `<script setup lang="ts">
import { MarkdownView } from '@ets/editor';
</script>

<template>
  <MarkdownView source="**Bold** and a [link](https://example.com)." />
</template>`;

export const markdownExcerptExample = `<script setup lang="ts">
import { MarkdownExcerpt } from '@ets/editor';
</script>

<template>
  <MarkdownExcerpt source="# Long doc\\n\\nFirst paragraph…" :max-chars="80" />
</template>`;

export const simpleMarkdownEditorExample = `<script setup lang="ts">
import { SimpleMarkdownEditor } from '@ets/editor';
import { ref } from 'vue';

const notes = ref('Supports **bold** and lists.');
</script>

<template>
  <SimpleMarkdownEditor
    v-model="notes"
    label="Description"
    menu="toolbar"
  />
</template>`;

export const appLayoutExample = `<script setup lang="ts">
import {
  AppLayout,
  AppNavItem,
  AppSidebar,
  AppSidebarBrand,
  AppTopbar,
  Avatar,
  Menu,
  ThemeToggle,
} from '@ets/ui';
import { ref } from 'vue';

const collapsed = ref(false);
</script>

<template>
  <!-- chrome: 'both' | 'topbar' | 'sidebar' -->
  <AppLayout v-model:collapsed="collapsed" chrome="both">
    <template #sidebar>
      <AppSidebar>
        <template #brand>
          <AppSidebarBrand to="/" />
        </template>
        <template #nav>
          <AppNavItem to="/inbox" icon="inbox" label="Inbox" />
          <AppNavItem to="/settings" icon="settings" label="Settings" />
        </template>
        <template #footer>
          <ThemeToggle />
          <Menu :items="[{ label: 'Profile', action: goProfile }]" trigger-label="Account">
            <Avatar name="Alex Operator" size="sm" />
          </Menu>
        </template>
      </AppSidebar>
    </template>

    <template #topbar>
      <AppTopbar>
        <template #start>Inbox</template>
      </AppTopbar>
    </template>

    <template #submenu>
      <!-- Context-specific secondary nav; omit the slot when unused. -->
      <nav aria-label="Section">…</nav>
    </template>

    <RouterView />
  </AppLayout>
</template>`;

export const definitionListExample = `<script setup lang="ts">
import { DefinitionList, type DefinitionItem } from '@ets/ui';

const items: DefinitionItem[] = [
  { key: 'ref', label: 'Deal ref', value: 'ETS-D-24017', mono: true },
  { key: 'region', label: 'Region', value: 'NSW1', mono: true },
  { key: 'price', label: 'Price', value: '$138.50 /MWh' },
  { key: 'notes', label: 'Notes', value: null, wide: true },
];
</script>

<template>
  <DefinitionList :items="items" />
</template>`;

export const columnPickerExample = `<script setup lang="ts">
import { ColumnPicker, type DataTableColumn } from '@ets/ui';
import { ref } from 'vue';

const columns: DataTableColumn<Deal>[] = [
  { id: 'ref', header: 'Ref', field: 'ref' },
  { id: 'region', header: 'Region', field: 'region' },
  { id: 'price', header: 'Price $/MWh', field: 'price', align: 'end' },
];
const visible = ref(['ref', 'price']);
</script>

<template>
  <ColumnPicker v-model="visible" :all-columns="columns" :required-ids="['ref']" />
</template>`;

export const confirmDialogExample = `<script setup lang="ts">
import { ConfirmDialog } from '@ets/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <ConfirmDialog
    :open="open"
    title="Cancel deal?"
    confirm-label="Cancel deal"
    destructive
    @confirm="cancelDeal(); open = false"
    @cancel="open = false"
  >
    Settlement and Risk will drop this deal from their positions.
  </ConfirmDialog>
</template>`;

export const idleLogoutDialogExample = `<script setup lang="ts">
import { IdleLogoutDialog, useIdleTimeout } from '@ets/ui';

const { warningActive, secondsRemaining, reset } = useIdleTimeout({
  timeoutSeconds: 15 * 60,
  warningSeconds: 60,
  onTimeout: () => signOut(),
});
</script>

<template>
  <IdleLogoutDialog
    :open="warningActive"
    :seconds="secondsRemaining"
    :warning-seconds="60"
    @stay="reset"
  />
</template>`;
