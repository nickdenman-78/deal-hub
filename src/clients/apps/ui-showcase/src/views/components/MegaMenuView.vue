<script setup lang="ts">
import { chunkColumns, MegaMenu, useToast, type MegaMenuEntry } from '@ets/ui';
import CodeExample from '../../components/CodeExample.vue';
import PropsTable from '../../components/PropsTable.vue';
import Specimen from '../../components/Specimen.vue';
import { megaMenuEntryProps, megaMenuGroupProps, megaMenuItemProps, megaMenuProps } from '../../apiDocs';
import { megaMenuExample } from '../../apiExamples';

const toast = useToast();

function pick(label: string) {
  return () => toast.info(label, 'Not wired up in the harness.');
}

const model: MegaMenuEntry[] = [
  {
    label: 'Trading',
    icon: 'zap',
    columns: [
      [
        {
          label: 'Positions',
          items: [
            { label: 'Open positions', icon: 'list', action: pick('Open positions'), active: true },
            { label: 'Settled', icon: 'check', action: pick('Settled') },
            { label: 'Reconciliation', icon: 'calculator', action: pick('Reconciliation') },
          ],
        },
      ],
      [
        {
          label: 'Curves',
          items: [
            { label: 'Forward curve', action: pick('Forward curve') },
            { label: 'Spot history', action: pick('Spot history') },
            { label: 'Volatility', action: pick('Volatility'), disabled: true },
          ],
        },
      ],
    ],
  },
  {
    // One long list, chunked into columns of six — the panel fills down, then
    // across, and the DOM columns match what the eye sees.
    label: 'Reference data',
    icon: 'database',
    columns: chunkColumns(
      [
        'Networks',
        'Tariffs',
        'Loss factors',
        'Calendars',
        'Holidays',
        'Regions',
        'Meters',
        'Generators',
        'Participants',
      ].map((label) => ({ label, action: pick(label) })),
      6,
    ),
  },
  { label: 'Docs', icon: 'book', href: 'https://example.invalid/docs' },
];

const railModel: MegaMenuEntry[] = model.slice(0, 2);
</script>

<template>
  <Specimen
    title="MegaMenu"
    note="A menubar whose entries open multi-column panels. v0 has no menubar, so the roles and keyboard handling are ours: roving tabindex across the bar, left/right across columns (clamped when the next is shorter), Home/End, and Escape back onto the trigger. Up/down follow the model — Trading's columns are labelled groups, so they wrap inside the column; Reference data is one chunked list, so they run on into the next column. Hover switches between panels once one is open — it never opens the first."
  >
    <MegaMenu :model="model" label="Trading navigation" />
  </Specimen>
  <CodeExample :code="megaMenuExample" />

  <Specimen
    title="Vertical"
    note="Orientation swaps which arrows walk the bar (up/down) and which opens a panel (right), and the panels anchor to the side."
  >
    <div class="sb__mega-rail">
      <MegaMenu :model="railModel" orientation="vertical" label="Sidebar navigation" />
    </div>
  </Specimen>

  <PropsTable :rows="megaMenuProps" />
  <PropsTable :rows="megaMenuEntryProps" title="MegaMenuEntry" note="Shape of each entry in `model`." />
  <PropsTable :rows="megaMenuGroupProps" title="MegaMenuGroup" note="A labelled run of items inside a column." />
  <PropsTable :rows="megaMenuItemProps" title="MegaMenuItem" note="Shape of each entry in a group's `items`." />
</template>

<style scoped>
.sb__mega-rail {
  width: 12rem;
}
</style>
