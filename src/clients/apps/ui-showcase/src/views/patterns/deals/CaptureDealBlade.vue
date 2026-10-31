<script setup lang="ts">
/*
 * Capture an ASX futures deal from what the trader quotes: product code, direction, price and volume, in that
 * order. The code decodes as it is typed. The checks below mirror the aggregate's invariants so the prototype can
 * show every error; the real screen maps the API's problem codes (deal.asx-futures.*) onto the same fields.
 */
import { Blade, Button, Input, Message, NumberInput, ToggleGroup, useToast, type ToggleOption } from '@ets/ui';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import ProductCodeDecode from './ProductCodeDecode.vue';
import { DEALS_BASE, captureDeal, decodeProductCode, formatNumber, isTyping, type Direction } from './dealsData';

const router = useRouter();
const toast = useToast();

const code = ref<string | undefined>('');
const direction = ref<string | string[] | undefined>(undefined);
const price = ref<string | undefined>('');
const volume = ref<string | undefined>('');

const saving = ref(false);
const saved = ref(false);
const attempted = ref(false);

const directionOptions: ToggleOption<string>[] = [
  { value: 'Buy', label: 'Buy', icon: 'arrow-up' },
  { value: 'Sell', label: 'Sell', icon: 'arrow-down' },
];

const decoded = computed(() => {
  const value = (code.value ?? '').trim();
  return value.length >= 5 ? decodeProductCode(value) : undefined;
});
const product = computed(() => (decoded.value?.ok ? decoded.value.product : undefined));
const isCap = computed(() => product.value?.payoff === '$300 cap');

const priceValue = computed(() => (price.value ? Number(price.value) : undefined));
const volumeValue = computed(() => (volume.value ? Number(volume.value) : undefined));

const errors = computed(() => {
  const result: { code?: string; direction?: string; price?: string; volume?: string } = {};
  const typed = (code.value ?? '').trim().toUpperCase();
  if (!typed) result.code = 'A product code is required.';
  else if (!decoded.value) result.code = 'Not an ASX electricity futures code. Expected a code like BNH27.';
  else if (!decoded.value.ok) result.code = decoded.value.message;
  else if (!decoded.value.product.contractSize) result.code = `ASX does not list ${typed}.`;

  if (direction.value !== 'Buy' && direction.value !== 'Sell') result.direction = 'Choose Buy or Sell.';

  const p = priceValue.value;
  if (p === undefined || Number.isNaN(p)) result.price = 'A price is required.';
  else if (Math.round(p * 100) !== p * 100) result.price = 'Prices move in steps of $0.01/MWh.';
  else if (isCap.value && p < 0) result.price = 'A $300 cap price cannot be negative.';

  const v = volumeValue.value;
  if (v === undefined || Number.isNaN(v) || v <= 0 || !Number.isInteger(v)) {
    result.volume = 'A whole number of lots, at least 1.';
  }
  return result;
});

// Field errors appear once the trader has tried to capture, except the code's: decoding is the point of typing it.
const shown = computed(() =>
  attempted.value ? errors.value : { code: product.value ? errors.value.code : undefined },
);
const errorCount = computed(() => Object.keys(errors.value).length);

const summary = computed(() => {
  const p = product.value;
  if (!p?.contractSize || errorCount.value > 0) return undefined;
  const lots = volumeValue.value ?? 0;
  return {
    direction: direction.value as Direction,
    line: `${lots} lots ${p.code} at $${formatNumber(priceValue.value ?? 0, 2)}/MWh`,
    energy: `${formatNumber(lots * p.contractSize.mwhPerLot)} MWh contracted energy · ${lots} × ${formatNumber(p.contractSize.mwhPerLot)} MWh`,
  };
});

const dirty = computed(
  () => !saved.value && ([code.value, price.value, volume.value].some((v) => v) || direction.value !== undefined),
);

async function capture() {
  attempted.value = true;
  if (errorCount.value > 0 || !product.value || saving.value) return;
  saving.value = true;
  try {
    const deal = await captureDeal({
      direction: direction.value as Direction,
      product: product.value,
      price: priceValue.value ?? 0,
      volume: volumeValue.value ?? 0,
    });
    saved.value = true;
    toast.success('Deal captured', `${deal.direction} ${deal.volume} MW ${deal.product.code}`);
    await router.push(`${DEALS_BASE}/${deal.id}`);
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
      <Message v-if="attempted && errorCount > 0" severity="error">
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
        <ProductCodeDecode v-if="!decoded || decoded.ok" :product="product" />
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
      <Button size="sm" variant="outlined" :disabled="saving" @click="router.push(DEALS_BASE)">Cancel</Button>
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
