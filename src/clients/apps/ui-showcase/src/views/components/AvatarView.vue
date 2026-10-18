<script setup lang="ts">
import { Avatar } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';

import PropsTable from '../../components/PropsTable.vue';

import CodeExample from '../../components/CodeExample.vue';
import { avatarExample } from '../../apiExamples';
import { avatarProps } from '../../apiDocs';
</script>

<template>
  <Specimen title="Avatar" note="Falls back to initials derived from the name, which is also the accessible name.">
    <div class="sb__row">
      <Avatar name="Trading Desk" size="sm" />
      <Avatar name="Platform Engineering" />
      <Avatar name="Finance Operations" size="lg" />
    </div>
  </Specimen>
  <CodeExample :code="avatarExample" />

  <PropsTable :rows="avatarProps" />
</template>
