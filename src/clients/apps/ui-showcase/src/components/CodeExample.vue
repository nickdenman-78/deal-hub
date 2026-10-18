<script setup lang="ts">
/**
 * Showcase-only usage snippet. Plain monospace — no highlighter dependency;
 * these are short enough that token colour is noise.
 */
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    code: string;
    language?: string;
  }>(),
  { title: 'Example', language: 'vue' },
);

const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const normalised = computed(() => props.code.replace(/^\n+/, '').replace(/\n+$/, '') + '\n');

async function copy() {
  try {
    await navigator.clipboard.writeText(normalised.value);
    copied.value = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch {
    /* clipboard may be unavailable in some embed contexts */
  }
}
</script>

<template>
  <section class="sb__section sb__code">
    <div class="sb__code-head">
      <h3>{{ title }}</h3>
      <button type="button" class="sb__code-copy" @click="copy">
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <pre class="sb__code-pre"><code :class="`language-${language}`">{{ normalised }}</code></pre>
  </section>
</template>
