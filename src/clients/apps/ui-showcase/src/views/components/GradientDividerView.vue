<script setup lang="ts">
import { GradientDivider } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { gradientDividerExample } from '../../apiExamples';
import { gradientDividerProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="GradientDivider"
    note="Brand gradient rule. Use sparingly — hero splits and KPI clusters, not routine list chrome."
  >
    <div class="gd-row">
      <span>Vertical</span>
      <GradientDivider />
      <span>default 2×60</span>
    </div>
  </Specimen>

  <Specimen title="Horizontal" note="Length defaults to auto (full width of the host).">
    <div class="gd-stack">
      <p>Above</p>
      <GradientDivider orientation="horizontal" />
      <p>Below</p>
    </div>
  </Specimen>

  <Specimen title="Sized" note="thickness is the thin axis; length is the long axis. Numbers are px.">
    <div class="gd-row">
      <GradientDivider :thickness="3" :length="120" />
      <GradientDivider orientation="horizontal" :thickness="3" length="12rem" />
    </div>
    <div class="gd-stretch">
      <span>Auto height</span>
      <GradientDivider length="auto" />
      <span>in a fixed host</span>
    </div>
  </Specimen>

  <CodeExample :code="gradientDividerExample" />
  <PropsTable :rows="gradientDividerProps" />
</template>

<style scoped>
.gd-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-6);
}

.gd-stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 28rem;
}

.gd-stack p {
  margin: 0;
  color: var(--fg-secondary);
  font-size: var(--fs-sm);
}

.gd-stretch {
  display: flex;
  align-items: stretch;
  gap: var(--sp-6);
  height: 6rem;
  margin-top: var(--sp-6);
  padding: var(--sp-3) var(--sp-4);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--r-md);
  color: var(--fg-secondary);
  font-size: var(--fs-sm);
}
</style>
