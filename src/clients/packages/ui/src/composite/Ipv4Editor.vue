<script setup lang="ts">
/**
 * A segmented IPv4 address field: four octet boxes, plus an optional CIDR
 * prefix.
 *
 * Segmented rather than one text input because the parts are what an operator
 * actually edits — changing the last octet of a plain `<input>` means clicking
 * precisely between two dots. The cost is that focus management, paste and
 * backspace all become ours; that is the work this component exists to do
 * once.
 *
 * The model is a STRING, not a parsed object. It is what goes in the config
 * file, callers already hold it as text, and a component that hands back
 * `{ octets, prefix }` makes every call site convert twice.
 *
 * Invalid intermediate states are emitted as typed, deliberately. Refusing to
 * emit until the address parses means v-model silently disagrees with the boxes
 * while someone is halfway through typing, and a parent that validates on
 * change then never sees the value it is meant to reject.
 */
import { computed, ref, useId, watch } from 'vue';
import Icon from '../components/Icon.vue';
import Popover from '../components/Popover.vue';
import { hasHostBits, parseIpv4, subnetOf } from './ipv4';

const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /**
     * `address` — four octets, no prefix.
     * `cidr` — prefix required.
     * `either` — prefix optional; typing in the prefix box adds it.
     */
    format?: 'address' | 'cidr' | 'either';
    disabled?: boolean;
    /** Blocks editing; suppresses the editable tint. Info / copy still work. */
    readonly?: boolean;
    required?: boolean;
    size?: 'sm' | 'md' | 'lg';
    editable?: boolean;
    /** Shows the derived network, broadcast and usable range under the field. */
    showSubnet?: boolean;
    /**
     * Info control on the right. For a CIDR value the popover includes subnet
     * arithmetic; every format also shows the model string with a copy control.
     * Disabled while the value is invalid. Alt+Down opens it when valid.
     */
    showSubnetInfo?: boolean;
  }>(),
  {
    label: undefined,
    description: undefined,
    format: 'either',
    size: 'md',
  },
);

const model = defineModel<string | undefined>();

const fieldId = useId();
const describedBy = `${fieldId}-hint`;
const errorId = `${fieldId}-error`;
const ariaDescribedBy = computed(
  () => [props.description ? describedBy : undefined, errorId].filter(Boolean).join(' ') || undefined,
);

const octets = ref<string[]>(['', '', '', '']);
const prefix = ref('');
/** Octets 0–3, then optional prefix at 4. Filled via callback refs — a shared
 *  string `ref` on a v-for plus a sibling overwrites rather than concatenates. */
const boxes = ref<(HTMLInputElement | null)[]>([]);

/**
 * After a completed octet auto-advances focus, the habitual trailing `.` often
 * lands on the next box. Ignore that first period once — including when the
 * next box already has a value (focus selects it, so it is not empty).
 */
let ignoreNextPeriod = false;

function setBoxRef(index: number, el: unknown) {
  if (el instanceof HTMLInputElement) boxes.value[index] = el;
  else boxes.value[index] = null;
}

const wantsPrefix = computed(() => props.format !== 'address');

/** What the boxes currently spell, whether or not it is valid. */
function compose(): string {
  const address = octets.value.join('.');
  const p = prefix.value.trim();
  return wantsPrefix.value && p !== '' ? `${address}/${p}` : address;
}

/*
 * Incoming values are split into the boxes, but ONLY when they differ from
 * what the boxes already spell. Without that guard every keystroke round-trips
 * through the parent and rewrites the field mid-edit — which resets the
 * caret, and drops a trailing '.' the moment someone types one.
 */
watch(
  model,
  (next) => {
    if ((next ?? '') === compose()) return;
    const raw = (next ?? '').trim();
    const [address = '', p = ''] = raw.split('/');
    const parts = address.split('.');
    octets.value = [0, 1, 2, 3].map((i) => parts[i] ?? '');
    prefix.value = p;
  },
  { immediate: true },
);

function emit() {
  model.value = compose();
}

function focusBox(index: number, select = true) {
  const el = boxes.value[index];
  if (!el) return;
  el.focus();
  if (select) el.select();
}

/** Full enough that another digit cannot extend it (255, or 26–99). */
function isCompleteOctet(digits: string): boolean {
  return digits.length === 3 || (digits.length === 2 && Number(digits) > 25);
}

function advanceFrom(index: number) {
  if (index < 3) {
    focusBox(index + 1);
    return;
  }
  if (wantsPrefix.value) focusBox(4);
}

function onOctetInput(index: number, event: Event) {
  if (props.disabled || props.readonly) return;
  const el = event.target as HTMLInputElement;
  // Digits only — `.` / `/` are handled in keydown so they still advance when
  // the box is already full (maxlength would otherwise swallow them).
  const digitsOnly = el.value.replace(/\D/g, '').slice(0, 3);
  octets.value[index] = digitsOnly;
  el.value = digitsOnly;
  emit();

  if (isCompleteOctet(digitsOnly)) {
    ignoreNextPeriod = true;
    advanceFrom(index);
  }
}

function onOctetKeydown(index: number, event: KeyboardEvent) {
  if (props.disabled || props.readonly) return;
  const el = event.target as HTMLInputElement;

  /*
   * Period (and slash into the prefix) must be keydown, not input: with three
   * digits already in the box, maxlength blocks the character and `input`
   * never fires — which is why CIDR felt broken on a filled last octet.
   *
   * After auto-advance from a filled octet, the next key is often `.`; swallow
   * that once. An empty box is the same habit when the flag was already cleared.
   */
  if (event.key === '.') {
    event.preventDefault();
    if (ignoreNextPeriod) {
      ignoreNextPeriod = false;
      return;
    }
    if (el.value === '') return;
    advanceFrom(index);
    return;
  }

  // Any other key means the separator moment has passed.
  if (ignoreNextPeriod) ignoreNextPeriod = false;

  if (event.key === '/' && wantsPrefix.value) {
    event.preventDefault();
    focusBox(4);
    return;
  }

  if (event.key === 'Backspace' && el.value === '' && index > 0) {
    event.preventDefault();
    focusBox(index - 1, false);
    const prev = boxes.value[index - 1];
    if (prev) prev.setSelectionRange(prev.value.length, prev.value.length);
    return;
  }
  if (event.key === 'ArrowLeft' && el.selectionStart === 0 && index > 0) {
    event.preventDefault();
    focusBox(index - 1, false);
    return;
  }
  if (event.key === 'ArrowRight' && el.selectionStart === el.value.length && index < 3) {
    event.preventDefault();
    focusBox(index + 1, false);
    return;
  }
  if (event.key === 'ArrowRight' && el.selectionStart === el.value.length && index === 3 && wantsPrefix.value) {
    event.preventDefault();
    focusBox(4, false);
  }
}

function onPrefixKeydown(event: KeyboardEvent) {
  if (props.disabled || props.readonly) return;
  const el = event.target as HTMLInputElement;
  if (event.key === 'Backspace' && el.value === '') {
    event.preventDefault();
    focusBox(3, false);
    const prev = boxes.value[3];
    if (prev) prev.setSelectionRange(prev.value.length, prev.value.length);
    return;
  }
  if (event.key === 'ArrowLeft' && el.selectionStart === 0) {
    event.preventDefault();
    focusBox(3, false);
  }
}

/*
 * Pasting a whole address into any box fills the lot. Without this, pasting
 * "10.0.0.1/24" into the first box leaves "100010124" there — the single most
 * common way an operator gets an address into this field.
 */
function onPaste(event: ClipboardEvent) {
  if (props.disabled || props.readonly) return;
  const text = event.clipboardData?.getData('text') ?? '';
  if (!text.includes('.')) return;
  event.preventDefault();

  const [address = '', p = ''] = text.trim().split('/');
  const parts = address.split('.');
  octets.value = [0, 1, 2, 3].map((i) => (parts[i] ?? '').replace(/\D/g, '').slice(0, 3));
  if (wantsPrefix.value) prefix.value = p.replace(/\D/g, '').slice(0, 2);
  emit();
}

function onPrefixInput(event: Event) {
  if (props.disabled || props.readonly) return;
  const el = event.target as HTMLInputElement;
  const digitsOnly = el.value.replace(/\D/g, '').slice(0, 2);
  prefix.value = digitsOnly;
  el.value = digitsOnly;
  emit();
}

const parsed = computed(() => parseIpv4(model.value));
const subnet = computed(() => (parsed.value ? subnetOf(parsed.value) : null));

const error = computed<string | null>(() => {
  const raw = (model.value ?? '').trim();
  // An empty field is `required`'s business, not ours — flagging it as
  // malformed the moment it is cleared is how a form shouts at someone who has
  // not started yet.
  if (raw === '' || raw === '...') return null;
  if (!parsed.value) return 'Enter four octets 0–255, e.g. 10.24.0.1. Leading zeros are not accepted.';
  if (props.format === 'cidr' && parsed.value.prefix === undefined) return 'A prefix length is required, e.g. /24.';
  if (props.format === 'address' && parsed.value.prefix !== undefined) return 'A prefix length is not allowed here.';
  return null;
});

/** Valid address (with or without prefix) — info popover can open. */
const infoEnabled = computed(() => Boolean(parsed.value) && !error.value);
const infoOpen = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const valueCopied = ref(false);
let copyResetTimer: ReturnType<typeof setTimeout> | null = null;

/** Model string shown in the info popover (valid values only). */
const expression = computed(() => {
  if (!infoEnabled.value) return '';
  return (model.value ?? '').trim();
});

watch(infoEnabled, (ok) => {
  if (!ok) infoOpen.value = false;
});

watch(infoOpen, (open) => {
  if (open) return;
  valueCopied.value = false;
  if (copyResetTimer !== null) {
    clearTimeout(copyResetTimer);
    copyResetTimer = null;
  }
});

async function copyExpression() {
  const text = expression.value;
  if (text === '') return;
  try {
    await navigator.clipboard.writeText(text);
    valueCopied.value = true;
    if (copyResetTimer !== null) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyResetTimer = null;
      valueCopied.value = false;
    }, 1500);
  } catch {
    valueCopied.value = false;
  }
}

/** Alt+ArrowDown opens info from any focused box (when valid). */
function onControlKeydown(event: KeyboardEvent) {
  if (!(event.altKey && event.key === 'ArrowDown')) return;
  if (!props.showSubnetInfo || props.disabled || !infoEnabled.value) return;
  event.preventDefault();
  infoOpen.value = true;
}

function onRootFocusOut(event: FocusEvent) {
  if (focusStaysWithField(event.relatedTarget)) return;
  // Popover content can take a tick to settle focus; only close once we're
  // truly outside the field and its info panel.
  window.setTimeout(() => {
    if (focusStaysWithField(document.activeElement)) return;
    infoOpen.value = false;
  }, 0);
}

/**
 * Focus is still "on the field" when it is inside the shell or inside our
 * info popover (including CSS top-layer `:popover-open` panels).
 */
function focusStaysWithField(node: EventTarget | null): boolean {
  if (!(node instanceof Node) || !rootRef.value) return false;
  if (rootRef.value.contains(node)) return true;
  if (!(node instanceof Element)) return false;
  const panel = node.closest('.r-popover');
  return Boolean(panel && (rootRef.value.contains(panel) || panel.matches(':popover-open')));
}

/*
 * Not an error. 10.0.0.5/24 is a perfectly good *interface* address and only
 * wrong when the field means a network — which this component cannot know. So
 * it is stated, not rejected.
 */
const hostBitsNote = computed(() =>
  parsed.value && !error.value && hasHostBits(parsed.value) && subnet.value
    ? `Host bits set — as a network this is ${subnet.value.network}/${parsed.value.prefix}.`
    : null,
);
</script>

<template>
  <div
    ref="rootRef"
    class="r-field r-ip"
    :class="[
      `r-field--${size}`,
      { 'r-field--editable': editable && !readonly, 'r-field--readonly': readonly, 'r-field--disabled': disabled },
    ]"
    @focusout="onRootFocusOut"
  >
    <label v-if="label" class="r-field__label" :for="`${fieldId}-0`">
      {{ label }}
      <span v-if="required" class="r-field__required" aria-hidden="true">*</span>
    </label>

    <!-- One group, so assistive tech announces four boxes as one field rather
         than four unrelated numbers. -->
    <div
      class="r-field__control r-ip__control"
      role="group"
      :aria-label="label ?? 'IPv4 address'"
      :aria-describedby="ariaDescribedBy"
      @keydown="onControlKeydown"
    >
      <Icon class="r-field__icon" name="globe" :size="14" />

      <template v-for="(_, index) in 4" :key="index">
        <span v-if="index > 0" class="r-ip__dot" aria-hidden="true">.</span>
        <input
          :id="`${fieldId}-${index}`"
          :ref="(el) => setBoxRef(index, el)"
          class="r-field__input r-ip__octet"
          :value="octets[index]"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="3"
          :aria-label="`Octet ${index + 1}`"
          :disabled="disabled"
          :readonly="readonly"
          @input="onOctetInput(index, $event)"
          @keydown="onOctetKeydown(index, $event)"
          @paste="onPaste"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </template>

      <template v-if="wantsPrefix">
        <span class="r-ip__slash" aria-hidden="true">/</span>
        <input
          :ref="(el) => setBoxRef(4, el)"
          class="r-field__input r-ip__prefix"
          :value="prefix"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          maxlength="2"
          :placeholder="format === 'cidr' ? '24' : ''"
          aria-label="Prefix length"
          :disabled="disabled"
          :readonly="readonly"
          @input="onPrefixInput"
          @keydown="onPrefixKeydown"
          @paste="onPaste"
          @focus="($event.target as HTMLInputElement).select()"
        />
      </template>

      <span v-if="showSubnetInfo" class="r-ip__info">
        <Popover
          v-model:open="infoOpen"
          label="Address details"
          position-area="bottom span-left"
          :tabbable="false"
          :disabled="disabled || !infoEnabled"
        >
          <template #trigger>
            <Icon class="r-field__icon" name="info" :size="14" />
          </template>
          <div class="r-ip__info-panel">
            <dl v-if="subnet" class="r-ip__subnet r-ip__subnet--popover">
              <div>
                <dt>Network</dt>
                <dd>{{ subnet.network }}</dd>
              </div>
              <div>
                <dt>Mask</dt>
                <dd>{{ subnet.mask }}</dd>
              </div>
              <div>
                <dt>Range</dt>
                <dd>{{ subnet.firstHost }} – {{ subnet.lastHost }}</dd>
              </div>
              <div>
                <dt>Broadcast</dt>
                <dd>{{ subnet.broadcast }}</dd>
              </div>
              <div>
                <dt>Usable</dt>
                <dd>{{ subnet.usableHosts.toLocaleString() }}</dd>
              </div>
            </dl>
            <div v-if="expression" class="r-ip__expr" :class="{ 'r-ip__expr--alone': !subnet }">
              <code>{{ expression }}</code>
              <button
                type="button"
                class="r-ip__copy"
                :aria-label="valueCopied ? 'Copied' : 'Copy address'"
                @click="copyExpression"
              >
                <Icon :name="valueCopied ? 'check' : 'copy'" :size="14" />
              </button>
            </div>
          </div>
        </Popover>
      </span>
    </div>

    <p v-if="description" :id="describedBy" class="r-field__hint">{{ description }}</p>
    <p :id="errorId" class="r-field__error">{{ error ?? '' }}</p>
    <p v-if="hostBitsNote" class="r-field__hint r-ip__note">{{ hostBitsNote }}</p>

    <dl v-if="showSubnet && subnet && !error" class="r-ip__subnet">
      <div>
        <dt>Network</dt>
        <dd>{{ subnet.network }}</dd>
      </div>
      <div>
        <dt>Mask</dt>
        <dd>{{ subnet.mask }}</dd>
      </div>
      <div>
        <dt>Range</dt>
        <dd>{{ subnet.firstHost }} – {{ subnet.lastHost }}</dd>
      </div>
      <div>
        <dt>Broadcast</dt>
        <dd>{{ subnet.broadcast }}</dd>
      </div>
      <div>
        <dt>Usable</dt>
        <dd>{{ subnet.usableHosts.toLocaleString() }}</dd>
      </div>
    </dl>
  </div>
</template>

<style>
.r-ip__control {
  gap: 0;
}

.r-ip__octet,
.r-ip__prefix {
  flex: 0 0 auto;
  /*
   * `ch` is the advance of "0", so 3ch is EXACTLY the width of "255" and not a
   * pixel more — and the input still carries the field's horizontal padding
   * inside its border box, which then eats the third digit. Measured: box
   * 21.9px, text 21.9px, padding 4px, so "255" rendered as "25".
   *
   * Padding is zeroed and the width given a digit of headroom rather than
   * trimmed to fit, because the exact advance depends on the loaded face and
   * the fallback is not IBM Plex Sans.
   */
  width: 4ch;
  padding-inline: 0;
  text-align: center;
  font-family: var(--font-data);
  /* Uniform digit advance, so the boxes do not twitch as the value changes. */
  font-variant-numeric: tabular-nums;
}

.r-ip__prefix {
  /* Two digits, same reasoning. */
  width: 3ch;
  text-align: start;
}

.r-ip__dot,
.r-ip__slash {
  color: var(--fg-faint);
  font-family: var(--font-data);
  /* The separators are painted, not typed: they must not be selectable or the
     operator can drag a selection across them and delete a dot that is
     structural rather than content. */
  user-select: none;
}

.r-ip__slash {
  margin: 0 var(--sp-1);
}

.r-ip__info {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  align-self: stretch;
  margin-left: auto;
  padding-left: var(--sp-1);
}

.r-ip__info .r-popover__activator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

/* `.r-icon`'s baseline nudge is for inline text; here the glyph is a flex
   item centred in the control — drop it so it lines up with the globe. */
.r-ip__info .r-popover__activator .r-icon {
  display: block;
  vertical-align: 0;
}

.r-ip__info .r-popover__activator:hover:not(:disabled) {
  background: var(--bg-surface-3);
}

.r-ip__info .r-popover__activator:hover:not(:disabled) .r-field__icon {
  color: var(--fg-primary);
}

.r-ip__info .r-popover__activator:disabled {
  cursor: not-allowed;
}

.r-ip__note {
  color: var(--warning-ink);
}

.r-ip__subnet {
  display: grid;
  gap: var(--sp-1) var(--sp-4);
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  margin: var(--sp-2) 0 0;
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface-2, var(--bg-surface));
  font-size: var(--fs-xs);
}

.r-ip__subnet--popover {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  min-width: 14rem;
  grid-template-columns: 1fr;
}

.r-ip__subnet dt {
  color: var(--fg-muted);
}

.r-ip__subnet dd {
  margin: 0;
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
}

.r-ip__info-panel {
  min-width: 14rem;
  max-width: min(28rem, calc(100vw - var(--sp-6)));
}

.r-ip__expr {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--border-default);
  min-width: 0;
}

.r-ip__expr--alone {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.r-ip__expr code {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--fg-primary);
  font-family: var(--font-mono, var(--font-data));
  font-size: var(--fs-sm);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-ip__copy {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--fg-muted);
  cursor: pointer;
}

.r-ip__copy:hover {
  background: var(--bg-surface-3);
  color: var(--fg-primary);
}

.r-ip__copy:focus-visible {
  outline: 1px solid var(--border-focus);
  outline-offset: 1px;
}
</style>
