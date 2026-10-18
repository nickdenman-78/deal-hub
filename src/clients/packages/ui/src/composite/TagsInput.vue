<script setup lang="ts">
/**
 * Free-text chips. For values with no fixed list to pick from — owners, labels,
 * alert routing keys.
 *
 * Distinct from `MultiSelect`, which also shows chips: that one is a CLOSED set
 * and its job is to stop an operator inventing an option. This one's job is the
 * opposite. Where the values are known, use MultiSelect; a text field that
 * accepts anything is how "prd", "prod" and "production" end up in the same
 * config as three different environments.
 *
 * The model is `string[]`, in the order added. Order is preserved rather than
 * sorted because in most of these fields it carries meaning — the first owner
 * is the primary one — and a field that reorders on save loses that silently.
 */
import { computed, ref, useId } from 'vue';
import Icon from '../components/Icon.vue';
import { addTags, removeTag, tagError, type TagRules } from './tags';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    /**
     * Chips stay readable; the draft input, the remove buttons and the
     * suggestion list are all withdrawn. A chip has nothing to activate, so
     * read-only costs it nothing but its remove control.
     */
    readonly?: boolean;
    required?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    /** Refuse anything past this count. */
    maxTags?: number;
    /** Per-tag rules: case folding, length, an allowed pattern. */
    rules?: TagRules;
    /** Offered under the field as one-click adds — recent or common values. */
    suggestions?: readonly string[];
  }>(),
  {
    label: undefined,
    description: undefined,
    placeholder: 'Type and press Enter',
    size: 'md',
    maxTags: undefined,
    rules: undefined,
    suggestions: undefined,
  },
);

const model = defineModel<string[]>({ default: () => [] });

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const ariaDescribedBy = computed(
  () => [props.description ? describedBy : undefined, errorId].filter(Boolean).join(' ') || undefined,
);

const draft = ref('');
const message = ref<string | undefined>();
const inputEl = ref<HTMLInputElement>();

const tags = computed(() => model.value ?? []);
const atLimit = computed(() => props.maxTags !== undefined && tags.value.length >= props.maxTags);

const liveError = computed(() => {
  if (draft.value.trim() === '') return undefined;
  return tagError(draft.value, tags.value, props.rules);
});

/*
 * `message` is set by an action and cleared by the next one; `liveError`
 * follows the draft. They are separate because they answer different questions
 * — "that one is already there" while typing, versus "4 of those 30 were
 * refused" after a paste — and the second must survive the field being cleared,
 * which clearing the draft would otherwise wipe.
 */
const shownError = computed(() => liveError.value ?? message.value);

function commit(raw: string) {
  const text = raw.trim();
  if (text === '') return;

  if (atLimit.value) {
    message.value = `That is the limit of ${props.maxTags}.`;
    return;
  }

  const result = addTags(tags.value, text, props.rules);
  const capped =
    props.maxTags === undefined ? result.tags : result.tags.slice(0, Math.max(props.maxTags, tags.value.length));

  model.value = capped;
  draft.value = '';

  const dropped = result.added.length - (capped.length - tags.value.length);
  if (dropped > 0) message.value = `Only ${props.maxTags} allowed — ${dropped} not added.`;
  else if (result.rejected.length === 1) message.value = `“${result.rejected[0]?.tag}” — ${result.rejected[0]?.reason}`;
  else if (result.rejected.length > 1) message.value = `${result.rejected.length} not added (duplicates or invalid).`;
  else message.value = undefined;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault();
    commit(draft.value);
    return;
  }

  /*
   * Backspace on an empty field removes the last chip — the standard gesture,
   * and the only one that does not require aiming at a small × .
   */
  if (event.key === 'Backspace' && draft.value === '' && tags.value.length > 0) {
    event.preventDefault();
    model.value = tags.value.slice(0, -1);
    message.value = undefined;
  }
}

/*
 * Committed on blur as well as on Enter. A half-typed tag left in the box and
 * then abandoned is the most common way one goes missing: the operator typed
 * it, saw it on screen, and moved on.
 */
function onBlur() {
  if (draft.value.trim() !== '') commit(draft.value);
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text') ?? '';
  if (text.trim() === '') return;
  event.preventDefault();
  commit(text);
}

function remove(tag: string) {
  model.value = removeTag(tags.value, tag, props.rules);
  message.value = undefined;
}

const openSuggestions = computed(() =>
  (props.suggestions ?? []).filter((suggestion) => !tags.value.includes(suggestion)),
);
</script>

<template>
  <div
    class="r-field r-tags"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
  >
    <label v-if="label" class="r-field__label" :for="fieldId">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <!--
      Clicking anywhere in the box focuses the input, so the whole control
      behaves like the text field it looks like rather than only its last inch.
    -->
    <div class="r-field__control r-tags__control" @click="readonly || inputEl?.focus()">
      <!--
        Chips are spans with a nested remove button. A chip is not itself
        activatable — there is nothing for clicking one to mean — so making it a
        button would promise an action that does not exist, and put every tag in
        the tab order twice.
      -->
      <span v-for="tag in tags" :key="tag" class="r-tags__chip">
        {{ tag }}
        <button
          v-if="!disabled && !readonly"
          type="button"
          class="r-tags__remove"
          :aria-label="`Remove ${tag}`"
          @click.stop="remove(tag)"
        >
          <Icon name="x" :size="12" />
        </button>
      </span>

      <span v-if="readonly && tags.length === 0" class="r-field__readonly-empty">&mdash;</span>

      <input
        v-if="!readonly"
        :id="fieldId"
        ref="inputEl"
        v-model="draft"
        class="r-field__input r-tags__input"
        type="text"
        autocomplete="off"
        spellcheck="false"
        :placeholder="tags.length === 0 ? placeholder : ''"
        :disabled="disabled || atLimit"
        :aria-invalid="shownError !== undefined ? 'true' : 'false'"
        :aria-describedby="ariaDescribedBy"
        @keydown="onKeydown"
        @blur="onBlur"
        @paste="onPaste"
      />
    </div>

    <div v-if="openSuggestions.length > 0 && !disabled && !readonly && !atLimit" class="r-tags__suggestions">
      <button
        v-for="suggestion in openSuggestions"
        :key="suggestion"
        type="button"
        class="r-tags__suggestion"
        @click="commit(suggestion)"
      >
        <Icon name="plus" :size="11" />
        {{ suggestion }}
      </button>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p :id="errorId" class="r-field__error">{{ shownError ?? '' }}</p>
    <p v-if="maxTags !== undefined" class="r-field__hint r-tags__count">{{ tags.length }} / {{ maxTags }}</p>
  </div>
</template>

<style>
/*
 * Height becomes a MINIMUM here. The sized rules on `.r-field__control` fix a
 * single-line height (specificity 0,2,0), which is right for text and wrong for
 * a wrapping row of chips — the second row overflows the box. Beat that with
 * the compound control selector so `height: auto` actually wins.
 */
.r-tags__control {
  flex-wrap: wrap;
  gap: var(--sp-1);
  padding-block: var(--sp-1);
  cursor: text;
}

.r-field--sm .r-field__control.r-tags__control {
  height: auto;
  min-height: 28px;
}

.r-field--md .r-field__control.r-tags__control {
  height: auto;
  min-height: 34px;
}

.r-field--lg .r-field__control.r-tags__control {
  height: auto;
  min-height: 40px;
}

.r-tags__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 1px var(--sp-1) 1px var(--sp-2);
  border-radius: var(--r-pill);
  background: var(--bg-surface-3);
  color: var(--fg-primary);
  font-size: var(--fs-xs);
  white-space: nowrap;
}

.r-tags__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: var(--r-pill);
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-tags__remove:hover {
  background: var(--bg-surface);
  color: var(--fg-primary);
}

.r-tags__input {
  /* Grows to fill the row but keeps a usable width once chips wrap. */
  flex: 1 1 6rem;
  min-width: 6rem;
}

.r-tags__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: var(--sp-1);
}

.r-tags__suggestion {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 var(--sp-2) 0 var(--sp-1);
  height: 22px;
  border: 1px dashed var(--border-default);
  border-radius: var(--r-pill);
  background: none;
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  cursor: pointer;
}

.r-tags__suggestion:hover {
  border-style: solid;
  color: var(--fg-primary);
}

.r-tags__count {
  font-variant-numeric: tabular-nums;
}
</style>
