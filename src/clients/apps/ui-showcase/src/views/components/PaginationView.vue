<script setup lang="ts">
import { Pagination } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { paginationExample } from '../../apiExamples';
import { paginationProps } from '../../apiDocs';

const page = ref(0);
const pageSize = ref(25);
const lockedPage = ref(0);
const lockedSize = ref(25);
</script>

<template>
  <Specimen
    title="Pagination"
    note="Zero-based page, server-reported total. Default row sizes are 10–100; Custom… accepts any integer ≥ 1. It is presentation only — it emits and lets the view fetch."
  >
    <div class="sb__stack">
      <Pagination v-model:page="page" v-model:page-size="pageSize" :total="248" />
      <p class="sb__state">
        page <code>{{ page }}</code
        >, size <code>{{ pageSize }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Fixed presets only"
    note="Override pageSizeOptions and set allowCustomPageSize to false when a table must not accept free-typed sizes."
  >
    <div class="sb__stack">
      <Pagination
        v-model:page="lockedPage"
        v-model:page-size="lockedSize"
        :total="248"
        :page-size-options="[10, 25, 50]"
        :allow-custom-page-size="false"
      />
      <p class="sb__state">
        page <code>{{ lockedPage }}</code
        >, size <code>{{ lockedSize }}</code>
      </p>
    </div>
  </Specimen>

  <CodeExample :code="paginationExample" />

  <PropsTable :rows="paginationProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
