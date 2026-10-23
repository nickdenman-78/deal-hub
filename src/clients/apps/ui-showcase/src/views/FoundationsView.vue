<script setup lang="ts">
import Specimen from '../components/Specimen.vue';

/*
 * --bg-editable is deliberately absent. The token still exists in @ets/brand,
 * but nothing paints it any more: an editable field is just a field, and the
 * treatment moved to `readonly`. Listing a surface the system no longer uses is
 * how someone reaches for it again.
 */
const SURFACES = ['--bg-app', '--bg-surface', '--bg-surface-2', '--bg-surface-3'];
const TEXT = ['--fg-primary', '--fg-secondary', '--fg-muted', '--fg-faint', '--fg-link'];
const LINES = ['--border-subtle', '--border-default', '--border-strong', '--border-input', '--border-focus'];
const STATUS = ['--accent', '--success', '--warning', '--error', '--info'];
const TRADING = ['--buy', '--sell', '--gain', '--loss'];

const VIOLET = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const BLUE = [300, 400, 600, 700];
const ORANGE = [300, 400, 600, 700];
const INK = [0, 25, 50, 100, 200, 300, 400, 500, 600, 700, 750, 800, 850, 900, 950];

const TYPE = [
  { token: '--fs-4xl', label: '36 / display' },
  { token: '--fs-3xl', label: '28 / h1' },
  { token: '--fs-2xl', label: '22 / h2' },
  { token: '--fs-xl', label: '18 / h3' },
  { token: '--fs-lg', label: '16 / h4' },
  { token: '--fs-md', label: '14' },
  { token: '--fs-base', label: '13 / body' },
  { token: '--fs-sm', label: '12' },
  { token: '--fs-xs', label: '11 / labels' },
];

const SPACING = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const RADII = ['--r-none', '--r-xs', '--r-sm', '--r-md', '--r-lg', '--r-pill'];
const SHADOWS = ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-panel', '--shadow-modal'];
</script>

<template>
  <Specimen
    title="Semantic colours"
    note="The only layer components should use. Every token is defined in both themes."
  >
    <div class="fx-grid">
      <div v-for="token in [...SURFACES, ...LINES, ...STATUS, ...TRADING]" :key="token" class="fx-swatch">
        <span class="fx-chip" :style="{ background: `var(${token})` }" />
        <code>{{ token }}</code>
      </div>
    </div>
    <div class="fx-text">
      <p v-for="token in TEXT" :key="token" :style="{ color: `var(${token})` }">
        <code>{{ token }}</code> — The quick brown fox jumps over the lazy dog.
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Palette ramps"
    note="Primitives. Components should not reference these directly — use the semantic tokens above."
  >
    <!-- Labels sit BELOW each swatch rather than on it. Printing the step
         number on the colour means the label's own contrast depends on the very
         value being demonstrated, which fails at the mid-lightness steps — and
         a palette specimen that cannot pass its own contrast sweep is noise
         that trains you to ignore the sweep. -->
    <div class="fx-ramp">
      <div v-for="step in VIOLET" :key="step" class="fx-ramp__step">
        <span class="fx-ramp__chip" :style="{ background: `var(--nd-violet-${step})` }" />
        <code>{{ step }}</code>
      </div>
    </div>
    <div class="fx-ramp">
      <div v-for="step in BLUE" :key="`b${step}`" class="fx-ramp__step">
        <span class="fx-ramp__chip" :style="{ background: `var(--nd-blue-${step})` }" />
        <code>buy {{ step }}</code>
      </div>
      <div v-for="step in ORANGE" :key="`o${step}`" class="fx-ramp__step">
        <span class="fx-ramp__chip" :style="{ background: `var(--nd-orange-${step})` }" />
        <code>sell {{ step }}</code>
      </div>
    </div>
    <div class="fx-ramp">
      <div v-for="step in INK" :key="step" class="fx-ramp__step">
        <span class="fx-ramp__chip" :style="{ background: `var(--nd-ink-${step})` }" />
        <code>{{ step }}</code>
      </div>
    </div>
  </Specimen>

  <Specimen
    title="Brand gradient"
    note="Illustration only — GradientDivider reads these tokens. Not for chrome borders."
  >
    <div class="fx-grad">
      <span class="fx-grad__chip fx-grad__chip--block" />
      <code>--gradient-brand</code>
      <span class="fx-grad__chip fx-grad__chip--inline" />
      <code>--gradient-brand-inline</code>
    </div>
  </Specimen>

  <Specimen
    title="Type scale"
    note="Deliberately dense — 13px base, not 16px. These are operator tools sitting on a lot of tabular data."
  >
    <div class="fx-type">
      <p v-for="item in TYPE" :key="item.token" :style="{ fontSize: `var(${item.token})` }">
        {{ item.label }} — ETS Deals
      </p>
    </div>
  </Specimen>

  <Specimen
    title="Heading elements"
    note="Base stylesheet maps h1–h6 onto the scale above. Keep page titles as real headings — do not restyle an h1 down to body size or the hierarchy collapses."
  >
    <div class="fx-headings">
      <h1>Heading 1 — page title</h1>
      <h2>Heading 2 — section</h2>
      <h3>Heading 3 — specimen / subsection</h3>
      <h4>Heading 4</h4>
      <h5>Heading 5</h5>
      <h6>Heading 6 — label</h6>
    </div>
  </Specimen>

  <Specimen
    title="Faces"
    note="Two families: IBM Plex Sans for headings, labels and data (with tabular figures), IBM Plex Mono for references and code."
  >
    <div class="fx-type">
      <p style="font-family: var(--font-display); font-size: var(--fs-2xl)">IBM Plex Sans — headings</p>
      <p style="font-family: var(--font-ui); font-size: var(--fs-md)">IBM Plex Sans — UI labels and navigation</p>
      <p style="font-family: var(--font-data); font-size: var(--fs-md)">
        IBM Plex Sans — 1,234.56 MWh · tabular figures
      </p>
      <p style="font-family: var(--font-mono); font-size: var(--fs-md)">IBM Plex Mono — ETS-D-24017</p>
    </div>
  </Specimen>

  <Specimen title="Spacing, radius, elevation">
    <div class="fx-stack">
      <div class="fx-row">
        <div v-for="step in SPACING" :key="step" class="fx-space">
          <span :style="{ width: `var(--sp-${step})`, height: `var(--sp-${step})` }" />
          <code>{{ step }}</code>
        </div>
      </div>
      <div class="fx-row">
        <div v-for="token in RADII" :key="token" class="fx-radius" :style="{ borderRadius: `var(${token})` }">
          {{ token.replace('--r-', '') }}
        </div>
      </div>
      <div class="fx-row">
        <div v-for="token in SHADOWS" :key="token" class="fx-shadow" :style="{ boxShadow: `var(${token})` }">
          {{ token.replace('--shadow-', '') }}
        </div>
      </div>
    </div>
  </Specimen>
</template>

<style scoped>
.fx-grid {
  display: grid;
  gap: var(--sp-2);
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  margin-bottom: var(--sp-4);
}

.fx-swatch {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
}

.fx-chip {
  width: 22px;
  height: 22px;
  flex: none;
  border: 1px solid var(--border-default);
  border-radius: var(--r-xs);
}

.fx-text p,
.fx-type p {
  margin-bottom: var(--sp-1);
}

.fx-headings {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.fx-ramp {
  display: flex;
  gap: 2px;
  margin-bottom: var(--sp-3);
}

.fx-ramp__step {
  flex: 1;
  text-align: center;
}

.fx-ramp__chip {
  display: block;
  height: 40px;
  border: 1px solid var(--border-default);
  border-radius: var(--r-xs);
}

.fx-ramp__step code {
  display: block;
  padding: 2px 0 0;
  background: none;
  font-size: 10px;
}

.fx-grad {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: var(--sp-3) var(--sp-4);
  max-width: 28rem;
}

.fx-grad__chip {
  border: 1px solid var(--border-default);
  border-radius: var(--r-pill);
}

.fx-grad__chip--block {
  width: 12px;
  height: 48px;
  background-image: var(--gradient-brand);
}

.fx-grad__chip--inline {
  width: 100%;
  height: 8px;
  background-image: var(--gradient-brand-inline);
}

.fx-stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.fx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--sp-3);
}

.fx-space {
  text-align: center;
  font-size: 10px;
}

.fx-space span {
  display: block;
  background: var(--accent);
}

.fx-radius {
  display: grid;
  width: 64px;
  height: 44px;
  border: 1px solid var(--border-strong);
  background: var(--bg-surface);
  font-size: var(--fs-xs);
  place-items: center;
}

.fx-shadow {
  display: grid;
  width: 78px;
  height: 48px;
  border-radius: var(--r-md);
  background: var(--bg-surface);
  font-size: var(--fs-xs);
  place-items: center;
}
</style>
