<script setup lang="ts">
/*
 * Capture an ASX futures deal from what the trader quotes: product code, direction, price and volume, in that
 * order. The code is checked against the API as it is typed, so the trader sees what it means and whether ASX lists
 * it. The quote is checked here first (quote.ts mirrors the aggregate's invariants); the API stays the authority and
 * its problem codes land on the same fields.
 */
import { Blade, Button, Input, Message, NumberInput, ToggleGroup, useToast, type ToggleOption } from '@ets/ui';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import { captureDeal, dealsChanged, lookUpProduct, problemOf, type Direction } from './api';
import ProductCodeDecode from './components/ProductCodeDecode.vue';
import { formatNumber } from './format';
import { errorsOfProblem, isTyping, validateQuote, type ProductState, type QuoteErrors } from './quote';

const LOOKUP_DELAY_MS = 250;

const router = useRouter();
const toast = useToast();

const code = ref<string | undefined>('');
const direction = ref<string | string[] | undefined>(undefined);
const price = ref<string | undefined>('');
const volume = ref<string | undefined>('');

const saving = ref(false);
const saved = ref(false);
const attempted = ref(false);
const serverErrors = ref<QuoteErrors>({});
const serverMessage = ref<string>();

const directionOptions: ToggleOption<string>[] = [
  { value: 'Buy', label: 'Buy', icon: 'arrow-up' },
  { value: 'Sell', label: 'Sell', icon: 'arrow-down' },
];

const typedCode = computed(() => (code.value ?? '').trim().toUpperCase());
const chosenDirection = computed<Direction | undefined>(() =>
  direction.value === 'Buy' || direction.value === 'Sell' ? direction.value : undefined,
);

// The product code lookup. A sequence number drops answers that arrive after the code has changed again.
const lookup = ref<ProductState>({ kind: 'empty' });
let lookupTimer: ReturnType<typeof setTimeout> | undefined;
let lookupSeq = 0;

watch(typedCode, (value) => {
  clearTimeout(lookupTimer);
  const seq = ++lookupSeq;
  if (value.length < 5) {
    lookup.value = { kind: 'empty' };
    return;
  }
  lookup.value = { kind: 'checking' };
  lookupTimer = setTimeout(async () => {
    try {
      const product = await lookUpProduct(value);
      if (seq === lookupSeq) lookup.value = { kind: 'decoded', product };
    } catch (error) {
      if (seq !== lookupSeq) return;
      const message =
        error instanceof ApiError && error.status === 400
          ? (problemOf(error)?.detail ?? 'Not an ASX electricity futures code.')
          : 'The product code could not be checked. Try again.';
      lookup.value = { kind: 'invalid', message };
    }
  }, LOOKUP_DELAY_MS);
});

onBeforeUnmount(() => clearTimeout(lookupTimer));

// A code too short to look up is not one ASX could list; say so the way the API would.
const productState = computed<ProductState>(() =>
  typedCode.value.length > 0 && typedCode.value.length < 5
    ? { kind: 'invalid', message: 'Not an ASX electricity futures code. Expected a code like BNH27.' }
    : lookup.value,
);
const product = computed(() => (productState.value.kind === 'decoded' ? productState.value.product : undefined));
const isCap = computed(() => product.value !== undefined && product.value.strike !== null);

const localErrors = computed(() =>
  validateQuote(
    { code: code.value ?? '', direction: chosenDirection.value, price: price.value ?? '', volume: volume.value ?? '' },
    productState.value,
  ),
);
const errors = computed<QuoteErrors>(() => ({ ...localErrors.value, ...serverErrors.value }));
const errorCount = computed(() => Object.keys(errors.value).length);

// A field's API error stands until the trader changes that field.
watch(code, () => clearServerError('code'));
watch(direction, () => clearServerError('direction'));
watch(price, () => clearServerError('price'));
watch(volume, () => clearServerError('volume'));

function clearServerError(field: keyof QuoteErrors) {
  if (!serverErrors.value[field]) return;
  const next = { ...serverErrors.value };
  delete next[field];
  serverErrors.value = next;
}

// Field errors appear once the trader has tried to capture. The code's appears as soon as the lookup has an
// answer, because finding out what the code means is the point of typing it.
const shown = computed<QuoteErrors>(() => {
  if (attempted.value) return errors.value;
  const state = lookup.value.kind;
  return { code: state === 'decoded' || state === 'invalid' ? errors.value.code : undefined };
});

const summary = computed(() => {
  const p = product.value;
  if (!p?.listed || p.contractSize === null || errorCount.value > 0 || !chosenDirection.value) return undefined;
  const lots = Number(volume.value);
  const priceText = formatNumber(Number(price.value), 2);
  const size = formatNumber(p.contractSize);
  return {
    direction: chosenDirection.value,
    line: `${lots} lots ${p.productCode} at $${priceText}/MWh`,
    energy: `${formatNumber(lots * p.contractSize)} MWh contracted energy · ${lots} × ${size} MWh`,
  };
});

const dirty = computed(
  () => !saved.value && ([code.value, price.value, volume.value].some((v) => v) || direction.value !== undefined),
);

async function capture() {
  attempted.value = true;
  serverMessage.value = undefined;
  if (errorCount.value > 0 || !chosenDirection.value || saving.value) return;
  saving.value = true;
  try {
    const { id } = await captureDeal({
      productCode: typedCode.value,
      direction: chosenDirection.value,
      price: Number(price.value),
      volume: Number(volume.value),
    });
    saved.value = true;
    dealsChanged.value++;
    toast.success('Deal captured', `${chosenDirection.value} ${volume.value} MW ${typedCode.value}`);
    await router.push(`/deals/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      serverMessage.value = 'You do not have permission to capture deals.';
      return;
    }
    if (error instanceof ApiError && error.status < 500) {
      const { fields, other } = errorsOfProblem(problemOf(error));
      serverErrors.value = fields;
      serverMessage.value = other;
      return;
    }
    serverMessage.value = 'The deal could not be captured. Try again.';
  } finally {
    saving.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    void capture();
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || isTyping(event) || saving.value) return;
  const key = event.key.toLowerCase();
  if (key === 'b' || key === 's') {
    event.preventDefault();
    direction.value = key === 'b' ? 'Buy' : 'Sell';
  }
}
</script>

<template>
  <Blade
    title="Capture ASX futures deal"
    subtitle="Quote it as you traded it: product code, side, price, lots."
    size="md"
    :dirty="dirty"
    @keydown="onKeydown"
  >
    <form class="capture" novalidate @submit.prevent="capture">
      <Message v-if="serverMessage" severity="error">{{ serverMessage }}</Message>
      <Message v-else-if="attempted && errorCount > 0" severity="error">
        Fix {{ errorCount }} {{ errorCount === 1 ? 'field' : 'fields' }} to capture this deal.
      </Message>

      <div class="capture__field">
        <Input
          v-model="code"
          label="Product code"
          placeholder="e.g. BNH27"
          :readonly="saving"
          :error-messages="shown.code"
          :input-attrs="{ autocapitalize: 'characters', spellcheck: false, class: 'capture__code' }"
          autocomplete="off"
          required
        />
        <ProductCodeDecode
          v-if="productState.kind !== 'invalid'"
          :product="product"
          :checking="productState.kind === 'checking'"
        />
      </div>

      <div class="capture__field">
        <ToggleGroup
          v-model="direction"
          :options="directionOptions"
          label="Direction"
          :disabled="saving"
          :aria-describedby="shown.direction ? 'capture-direction-error' : undefined"
        />
        <span v-if="shown.direction" id="capture-direction-error" class="capture__error">{{ shown.direction }}</span>
        <span v-else class="capture__hint">B buys, S sells</span>
      </div>

      <div class="capture__pair">
        <NumberInput
          v-model="price"
          label="Price"
          suffix-unit="$/MWh"
          :fraction-digits="2"
          :allow-negative="!isCap"
          :readonly="saving"
          :error-messages="shown.price"
          description="Steps of $0.01"
          required
        />
        <NumberInput
          v-model="volume"
          label="Volume"
          suffix-unit="MW (lots)"
          :fraction-digits="0"
          :allow-negative="false"
          :readonly="saving"
          :error-messages="shown.volume"
          description="Whole lots, 1 lot = 1 MW"
          required
        />
      </div>

      <div v-if="summary" class="capture__summary" aria-live="polite">
        <span class="capture__summary-line">
          <span :class="summary.direction === 'Buy' ? 'capture__buy' : 'capture__sell'">{{ summary.direction }}</span>
          {{ summary.line }}
        </span>
        <span class="capture__hint">{{ summary.energy }}</span>
      </div>
    </form>

    <template #footer>
      <Button size="sm" variant="outlined" :disabled="saving" @click="router.push('/deals')">Cancel</Button>
      <Button size="sm" severity="primary" icon="check" :busy="saving" @click="capture">Capture</Button>
    </template>
  </Blade>
</template>

<style scoped>
.capture {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.capture__field {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.capture__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);
}

.capture :deep(.capture__code) {
  font-family: var(--font-mono);
  font-weight: var(--fw-medium);
  letter-spacing: var(--tr-wide);
  text-transform: uppercase;
}

.capture__hint {
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.capture__error {
  color: var(--error-ink);
  font-size: var(--fs-sm);
}

.capture__summary {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--border-default);
}

.capture__summary-line {
  font-size: var(--fs-md);
  font-weight: var(--fw-medium);
}

.capture__buy {
  color: var(--buy-ink);
}

.capture__sell {
  color: var(--sell-ink);
}
</style>
