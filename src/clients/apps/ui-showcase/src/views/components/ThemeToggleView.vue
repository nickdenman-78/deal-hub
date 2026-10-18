<script setup lang="ts">
import { ThemeToggle } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { themeToggleExample } from '../../apiExamples';
import { themeToggleProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Icon-only"
    note="Default for toolbars. The tooltip names both the current preference and the next click."
  >
    <div class="sb__row">
      <ThemeToggle />
      <ThemeToggle size="sm" />
      <ThemeToggle size="lg" />
    </div>
  </Specimen>

  <Specimen
    title="Labeled"
    note="Preference name beside the icon. showResolved appends the live OS appearance when preference is System."
  >
    <div class="sb__row">
      <ThemeToggle labeled />
      <ThemeToggle labeled show-resolved />
    </div>
  </Specimen>

  <Specimen title="Variants" note="Text is the default — a theme control should not out-shout the page chrome.">
    <div class="sb__row">
      <ThemeToggle labeled variant="text" />
      <ThemeToggle labeled variant="outlined" />
    </div>
  </Specimen>
  <CodeExample :code="themeToggleExample" />

  <PropsTable :rows="themeToggleProps" />
</template>
