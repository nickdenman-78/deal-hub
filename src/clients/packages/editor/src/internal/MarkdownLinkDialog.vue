<script setup lang="ts">
/**
 * The link editor, replacing `window.prompt`.
 *
 * prompt() was never only an aesthetic problem. It is modal to the whole tab,
 * it cannot be styled or themed, it announces itself as browser chrome rather
 * than as part of the application, it is suppressed outright in sandboxed
 * frames and by some enterprise policies — and it offers exactly one text field
 * and two buttons, so "remove this link" had to be expressed as "clear the box
 * and press OK", which nobody guesses.
 *
 * Validation happens here rather than being left to the Link extension. The
 * extension's `isAllowedUri` refuses a bad protocol by declining to create the
 * mark, silently; from the operator's side that looked like the Save button not
 * working. Same predicate, applied where it can say why.
 *
 * Chrome (Dialog / Input / Button) comes from `useEditorChrome()` when a host
 * plugin provides it; otherwise plain HTML so this package stays headless.
 */
import { computed, ref, watch } from 'vue';
import { useEditorChrome } from '../chrome';
import { isAllowedLinkUri } from '../markdown/tools';

const props = defineProps<{
  /** The href already on the selection, if the caret sits in a link. */
  initialHref?: string;
}>();

const open = defineModel<boolean>('open', { required: true });

const emit = defineEmits<{
  apply: [href: string];
  remove: [];
}>();

const chrome = useEditorChrome();
const href = ref('');

/*
 * Seeded when the dialog OPENS, not from a watcher on initialHref. The parent
 * reads the href off the editor at click time; re-seeding on every prop change
 * would overwrite what the operator has typed if a transaction happened to fire
 * while the dialog was open.
 */
watch(open, (isOpen) => {
  if (!isOpen) return;
  href.value = props.initialHref ?? '';
});

const isEditing = computed(() => (props.initialHref ?? '') !== '');
const trimmed = computed(() => href.value.trim());
const isValid = computed(() => trimmed.value !== '' && isAllowedLinkUri(trimmed.value));

/*
 * Live rather than on blur, and that is only reasonable because this predicate
 * is not picky: a bare `example.com` resolves against the default protocol and
 * passes, so a half-typed address is not flagged mid-keystroke. What it does
 * catch is `javascript:` and friends — which is exactly when the operator wants
 * telling, rather than after pressing a button that appears to do nothing.
 */
const error = computed(() =>
  trimmed.value === '' || isValid.value ? undefined : 'Use an http, https or mailto address.',
);

function save() {
  if (!isValid.value) return;
  emit('apply', trimmed.value);
  open.value = false;
}

function remove() {
  emit('remove');
  open.value = false;
}

function onNativeBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) open.value = false;
}
</script>

<template>
  <component
    :is="chrome.Dialog"
    v-if="chrome.Dialog"
    v-model:open="open"
    :title="isEditing ? 'Edit link' : 'Add link'"
    description="Links may point at http, https or mailto addresses."
    size="sm"
  >
    <form class="r-md-link" @submit.prevent="save">
      <component
        :is="chrome.Input"
        v-if="chrome.Input"
        v-model="href"
        label="URL"
        type="url"
        placeholder="https://example.com"
        icon="link"
        editable
        :error="error !== undefined"
        :error-messages="error"
      />
      <label v-else class="r-md-link__field">
        <span class="r-md-link__label">URL</span>
        <input v-model="href" type="url" placeholder="https://example.com" />
        <span v-if="error" class="r-md-link__error">{{ error }}</span>
      </label>
    </form>

    <template #footer>
      <component
        :is="chrome.Button"
        v-if="isEditing && chrome.Button"
        severity="error"
        variant="text"
        icon="link-2-off"
        @click="remove"
      >
        Remove link
      </component>
      <button v-else-if="isEditing" type="button" class="r-md-link__action" @click="remove">Remove link</button>
      <span class="r-md-link__spacer" />
      <component :is="chrome.Button" v-if="chrome.Button" variant="text" @click="open = false">Cancel</component>
      <button v-else type="button" class="r-md-link__action" @click="open = false">Cancel</button>
      <component :is="chrome.Button" v-if="chrome.Button" variant="outlined" :disabled="!isValid" @click="save">
        {{ isEditing ? 'Update' : 'Add link' }}
      </component>
      <button v-else type="button" class="r-md-link__action" :disabled="!isValid" @click="save">
        {{ isEditing ? 'Update' : 'Add link' }}
      </button>
    </template>
  </component>

  <div
    v-else-if="open"
    class="r-md-link-dialog"
    role="dialog"
    aria-modal="true"
    :aria-label="isEditing ? 'Edit link' : 'Add link'"
    @click="onNativeBackdropClick"
  >
    <div class="r-md-link-dialog__panel" @click.stop>
      <h2 class="r-md-link-dialog__title">{{ isEditing ? 'Edit link' : 'Add link' }}</h2>
      <p class="r-md-link-dialog__desc">Links may point at http, https or mailto addresses.</p>
      <form class="r-md-link" @submit.prevent="save">
        <label class="r-md-link__field">
          <span class="r-md-link__label">URL</span>
          <input v-model="href" type="url" placeholder="https://example.com" />
          <span v-if="error" class="r-md-link__error">{{ error }}</span>
        </label>
        <div class="r-md-link__actions">
          <button v-if="isEditing" type="button" class="r-md-link__action" @click="remove">Remove link</button>
          <span class="r-md-link__spacer" />
          <button type="button" class="r-md-link__action" @click="open = false">Cancel</button>
          <button type="submit" class="r-md-link__action" :disabled="!isValid">
            {{ isEditing ? 'Update' : 'Add link' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style>
.r-md-link {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.r-md-link__spacer {
  flex: 1;
}

.r-md-link__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.r-md-link__label {
  font-size: 0.875rem;
  font-weight: 600;
}

.r-md-link__error {
  font-size: 0.8125rem;
}

.r-md-link__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.r-md-link__action {
  font: inherit;
  cursor: pointer;
}

.r-md-link__action:disabled {
  cursor: default;
  opacity: 0.6;
}

.r-md-link-dialog {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 40%);
}

.r-md-link-dialog__panel {
  width: min(24rem, calc(100vw - 2rem));
  padding: 1rem;
  background: Canvas;
  color: CanvasText;
  border: 1px solid GrayText;
}

.r-md-link-dialog__title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.r-md-link-dialog__desc {
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
}
</style>
