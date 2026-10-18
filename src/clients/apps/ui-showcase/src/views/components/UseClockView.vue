<script setup lang="ts">
/*
 * The write counters are the point of this page: they make the composable's
 * resource contract visible. `minute` advancing once a minute while `second`
 * races proves per-granularity fan-out; the seconds toggle proves the shared
 * timer's cadence follows the finest LIVE subscriber (switch it off and the
 * page is back to one wake per minute).
 */
import { Switch, useClock } from '@ets/ui';
import { computed, defineComponent, h, ref, watch } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { useClockExample } from '../../apiExamples';
import { useClockApi } from '../../apiDocs';

const minute = useClock('minute');
const hour = useClock('hour');
const day = useClock('day');

const hhmm = computed(() => minute.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

const minuteWrites = ref(0);
const hourWrites = ref(0);
const dayWrites = ref(0);
watch(minute, () => minuteWrites.value++);
watch(hour, () => hourWrites.value++);
watch(day, () => dayWrites.value++);

const secondsOn = ref(false);

/*
 * Subscribes on mount, releases on unmount — toggling it off genuinely drops
 * the last `second` subscriber and downgrades the shared timer. A component
 * (not a bare toggle around useClock) because composables must not be called
 * conditionally.
 */
const SecondsProbe = defineComponent({
  name: 'SecondsProbe',
  setup() {
    const second = useClock('second');
    const writes = ref(0);
    watch(second, () => writes.value++);
    return () => h('span', `second → ${second.value.toLocaleTimeString()} (${writes.value} writes since mount)`);
  },
});
</script>

<template>
  <Specimen
    title="useClock — a HH:mm clock"
    note="One line of subscription, one shared timer for the whole app. A minute-granularity ref wakes the page once per minute — there is no per-component interval, and with no subscribers mounted anywhere the timer does not run at all."
  >
    <span class="sb__clock">{{ hhmm }}</span>
  </Specimen>

  <Specimen
    title="Granularities and fan-out"
    note="Each granularity's ref is written exactly once per boundary crossing. Watch the counters: enabling the seconds probe drives the shared timer at 1s cadence, yet the minute counter still advances only once a minute — dependents of a coarse ref never pay for a fine subscriber elsewhere. Toggling the probe off drops the last second-granularity subscription and the page is back to one wake per minute."
  >
    <div class="sb__stack">
      <Switch v-model="secondsOn" label="Subscribe to seconds" />
      <ul class="sb__ticks">
        <li>
          <SecondsProbe v-if="secondsOn" /><span v-else class="sb__off"
            >second → not subscribed (timer idles at minute cadence)</span
          >
        </li>
        <li>minute → {{ minute.toLocaleTimeString() }} ({{ minuteWrites }} writes since page open)</li>
        <li>hour → {{ hour.toLocaleTimeString() }} ({{ hourWrites }} writes since page open)</li>
        <li>day → {{ day.toLocaleDateString() }} ({{ dayWrites }} writes since page open)</li>
      </ul>
      <p class="sb__state">
        Background tabs and laptop sleep are safe: the clock re-derives from wall time on every wake, so a crossed
        boundary is emitted once on resume — never dropped, never replayed.
      </p>
    </div>
  </Specimen>

  <CodeExample :code="useClockExample" />

  <PropsTable title="API" :rows="useClockApi" />
</template>

<style scoped>
.sb__clock {
  font-size: var(--fs-2xl);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.sb__ticks {
  margin: 0;
  padding-left: var(--sp-5);
  font-variant-numeric: tabular-nums;
}

.sb__ticks li {
  padding-block: var(--sp-1);
}

.sb__off {
  color: var(--fg-muted);
}

.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
