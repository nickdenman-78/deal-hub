<script setup lang="ts">
/**
 * User avatar on v0's Avatar, which owns the image load state machine — the
 * fallback shows while loading AND on error, so a broken URL never leaves a
 * blank hole.
 */
import { Avatar } from '@vuetify/v0/components';
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    /** Used for the fallback initials and the accessible name. */
    name: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { src: undefined, size: 'md' },
);

/*
 * First letter of the first two words. Deliberately not "first two letters of
 * the name" — that gives "AN" for "Anonymous" where "AB" is wanted for
 * "Anna Bell" — and capped at two so a long name does not overflow the circle.
 */
const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join(''),
);
</script>

<template>
  <Avatar.Root class="r-avatar" :class="`r-avatar--${size}`" :aria-label="name" role="img">
    <Avatar.Image v-if="src" class="r-avatar__image" :src="src" :alt="name" />
    <Avatar.Fallback class="r-avatar__fallback">{{ initials }}</Avatar.Fallback>
  </Avatar.Root>
</template>

<style>
.r-avatar {
  position: relative;
  display: inline-grid;
  overflow: hidden;
  flex: none;
  border-radius: var(--r-pill);
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-family: var(--font-ui);
  font-weight: var(--fw-semibold);
  place-items: center;
  user-select: none;
}

.r-avatar--sm {
  width: 24px;
  height: 24px;
  font-size: var(--fs-xs);
}

.r-avatar--md {
  width: 32px;
  height: 32px;
  font-size: var(--fs-sm);
}

.r-avatar--lg {
  width: 44px;
  height: 44px;
  font-size: var(--fs-md);
}

.r-avatar__image {
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: cover;
}
</style>
