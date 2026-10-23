<script setup lang="ts">
import { ref } from 'vue';
import Icon from './Icon.vue';

/*
 * Click-to-browse + drag-and-drop file intake. No v0 primitive — the DataTransfer
 * dance and the keyboard fallback are the whole component.
 *
 * Stateless by design: it EMITS the picked files and holds nothing, because
 * what "a file is chosen" looks like (name chip, replace affordance, clearing
 * on upload) belongs to the caller — the default slot renders that state, and
 * the zone stays a drop target throughout so a second drop replaces the pick.
 *
 * Keyboard path mirrors the pointer path exactly: the zone is a single tab
 * stop; Enter/Space opens the same hidden input the click does. The input is
 * the only thing the browser lets us delegate to, so it stays in the DOM,
 * visually hidden rather than display:none (some engines refuse .click() on a
 * non-rendered input).
 */
const props = withDefaults(
  defineProps<{
    /** Forwarded to the hidden input, e.g. `.csbak` or `image/*,.pdf`. */
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    /** Accessible name for the zone. */
    label?: string;
    /** Fallback hint when the default slot is not used. */
    hint?: string;
  }>(),
  {
    accept: undefined,
    multiple: false,
    disabled: false,
    label: 'Choose a file or drop one here',
    hint: 'Drop a file here, or click to browse',
  },
);

const emit = defineEmits<{ (e: 'select', files: File[]): void }>();

const inputEl = ref<HTMLInputElement | null>(null);
const over = ref(false);

function take(list: FileList | null | undefined) {
  if (props.disabled) return;
  const files = [...(list ?? [])];
  if (files.length === 0) return;
  emit('select', props.multiple ? files : files.slice(0, 1));
}

function onPick(event: Event) {
  const input = event.target as HTMLInputElement;
  take(input.files);
  // Same file picked twice must fire twice — a cleared input re-emits change.
  input.value = '';
}

function browse() {
  if (props.disabled) return;
  inputEl.value?.click();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    browse();
  }
}

function onDrop(event: DragEvent) {
  over.value = false;
  take(event.dataTransfer?.files);
}
</script>

<template>
  <div
    class="r-dropzone"
    :class="{ 'r-dropzone--over': over, 'r-dropzone--disabled': disabled }"
    role="button"
    :tabindex="disabled ? undefined : 0"
    :aria-label="label"
    :aria-disabled="disabled || undefined"
    @click="browse"
    @keydown="onKeydown"
    @dragover.prevent="over = !disabled"
    @dragenter.prevent="over = !disabled"
    @dragleave.prevent="over = false"
    @drop.prevent="onDrop"
  >
    <slot :over="over">
      <Icon name="upload" :size="20" class="r-dropzone__icon" />
      <span class="r-dropzone__hint">{{ hint }}</span>
    </slot>
    <input
      ref="inputEl"
      type="file"
      class="r-dropzone__input"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @change="onPick"
    />
  </div>
</template>

<style>
.r-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-6) var(--sp-4);
  border: 1px dashed var(--border-strong);
  border-radius: var(--r-md);
  background: var(--bg-surface);
  color: var(--fg-muted);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  text-align: center;
  cursor: pointer;
}

.r-dropzone:hover,
.r-dropzone:focus-visible {
  border-color: var(--accent);
  color: var(--fg-secondary);
}

.r-dropzone--over {
  border-color: var(--accent);
  border-style: solid;
  background: var(--accent-soft);
  color: var(--accent-ink);
}

.r-dropzone--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-dropzone__icon {
  color: var(--fg-faint);
}

.r-dropzone--over .r-dropzone__icon {
  color: var(--accent-ink);
}

/* Rendered but invisible: some engines refuse .click() on display:none. */
.r-dropzone__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
</style>
