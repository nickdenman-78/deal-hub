<script setup lang="ts">
import { Icon, Menu, useToast, type MenuItem } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { menuExample } from '../../apiExamples';
import { menuProps, menuItemProps } from '../../apiDocs';

const toast = useToast();

const menuItems: MenuItem[] = [
  { label: 'Rename', icon: 'square-pen', action: () => toast.info('Rename', 'Not wired up in the harness.') },
  { label: 'Duplicate', icon: 'copy', action: () => toast.success('Duplicated') },
  { separator: true },
  { label: 'Archive', icon: 'folder', disabled: true, action: () => {} },
  {
    label: 'Delete',
    icon: 'trash-2',
    destructive: true,
    action: () => toast.error('Delete failed', 'HTTP 409 — the key is in use by 3 services.'),
  },
];
</script>

<template>
  <Specimen
    title="Menu"
    note="v0 has no Menu component, so the roles and keyboard handling are ours: menu/menuitem, arrows with wrap, Home/End, and Escape marked handled so a blade behind does not also close. Closes and flushes BEFORE running the action."
  >
    <!--
      The slot holds an ICON, not a Button, and the label goes to the activator.
      v0 renders the activator as a <button>; a Button inside it is a button
      inside a button — invalid markup, two tab stops for one control, and an
      aria-label on an element that names nothing. trigger-class styles the real
      button instead.
    -->
    <Menu :items="menuItems" trigger-class="sb__menu-trigger" trigger-label="Row actions">
      <template #trigger>
        <Icon name="ellipsis-vertical" :size="16" />
      </template>
    </Menu>
  </Specimen>
  <CodeExample :code="menuExample" />

  <PropsTable :rows="menuProps" />
  <PropsTable :rows="menuItemProps" title="MenuItem" note="Shape of each entry in `items`." />
</template>

<style scoped>
/* The activator is Menu's element, so this must not be scoped away from it. */
:global(.sb__menu-trigger) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border-input);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-primary);
  cursor: pointer;
}
</style>
