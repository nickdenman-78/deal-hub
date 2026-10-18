<script setup lang="ts">
import { Blade } from '@ets/ui';

defineProps<{ title: string }>();
</script>

<template>
  <!-- A leaf: no <RouterView> inside, because nothing stacks beyond it. -->
  <Blade :title="title" size="md">
    <p>
      Leaf panel. Press <kbd>Esc</kbd> — it closes this one only, and only if nothing else has already handled the key.
    </p>
  </Blade>
</template>
