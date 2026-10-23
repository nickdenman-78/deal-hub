<script setup lang="ts">
import { Spinner } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { spinnerExample } from '../../apiExamples';
import { spinnerProps } from '../../apiDocs';
</script>

<template>
  <Specimen title="Spinner" note="Announces itself, so a loading page is not silent to a screen reader.">
    <div class="sb__row">
      <Spinner :size="16" />
      <Spinner :size="24" />
      <Spinner :size="40" />
    </div>
  </Specimen>
  <CodeExample :code="spinnerExample" />

  <PropsTable :rows="spinnerProps" />
</template>
