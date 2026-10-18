<script setup lang="ts">
import { Breadcrumbs } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { breadcrumbsExample } from '../../apiExamples';
import { breadcrumbsProps, crumbProps } from '../../apiDocs';

/*
 * The ancestors point at OTHER routes on purpose. Pointed at the current one,
 * vue-router stamps its own aria-current="page" on those RouterLinks and the
 * trail announces three current pages — which looked like a Breadcrumbs bug and
 * was unrealistic demo data. Worth knowing for real trails too: a crumb that
 * links to where you already are is a crumb that lies.
 */
const CRUMBS = [
  { label: 'Groups', to: '/foundations' },
  { label: 'Trading', to: '/components/data-table', title: 'trading' },
  { label: 'pricing-api' },
];
</script>

<template>
  <Specimen
    title="Breadcrumbs"
    note="The final crumb is a span with aria-current, not a link — a page does not link to itself. title surfaces the canonical identifier behind a friendly label, which is what an operator needs when they go looking on disk."
  >
    <Breadcrumbs :items="CRUMBS" />
  </Specimen>
  <CodeExample :code="breadcrumbsExample" />

  <PropsTable :rows="breadcrumbsProps" />
  <PropsTable :rows="crumbProps" title="Crumb" note="Shape of each entry in `items`." />
</template>
