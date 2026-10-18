<script setup lang="ts">
/**
 * Mobile only. With one blade on screen at a time, this is how you get back
 * to an ancestor.
 *
 * Focusing deliberately does not navigate: an ancestor's URL often redirects
 * straight back to a leaf, so navigating to it would bounce you forward
 * again. This moves which panel is visible and nothing else.
 */
import type { BladeEntry } from '../blade/context';

defineProps<{
  blades: readonly BladeEntry[];
  focusedId: string | null;
}>();

defineEmits<{ focus: [id: string | null] }>();
</script>

<template>
  <nav class="r-blade-crumbs" aria-label="Open panels">
    <template v-for="(blade, index) in blades" :key="blade.id">
      <span v-if="index > 0" class="r-blade-crumbs__sep" aria-hidden="true">›</span>
      <button
        type="button"
        class="r-blade-crumbs__item"
        :class="{ 'is-focused': blade.id === focusedId }"
        :aria-current="blade.id === focusedId ? 'true' : undefined"
        @click="$emit('focus', blade.id)"
      >
        {{ blade.title }}
      </button>
    </template>
  </nav>
</template>
