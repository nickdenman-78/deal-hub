<script setup lang="ts">
import { ScheduleEditor, type ScheduleValue } from '@ets/ui';
import { ref } from 'vue';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { scheduleEditorExample } from '../../apiExamples';
import { scheduleEditorProps } from '../../apiDocs';

const fresh = ref<ScheduleValue>();
const weekly = ref<ScheduleValue>({
  start: '2026-09-01T06:00',
  cron: '0 6 * * 1-5',
  end: '2026-12-31',
});
const lastFriday = ref<ScheduleValue>({ start: '2026-09-04T17:00', cron: '0 17 * * 5L' });
const expired = ref<ScheduleValue>({
  start: '2026-01-05T09:00',
  cron: '0 9 * * 1-5',
  end: '2026-02-27',
});
const foreign = ref<ScheduleValue>({ start: '2026-09-01T09:00', cron: '0 9 LW * *' });
const review = ref<ScheduleValue>({ start: '2026-09-01T06:00', cron: '0 6 * * 1-5' });
</script>

<template>
  <Specimen
    title="ScheduleEditor"
    note="A task schedule for end users — Now, Later, or a recurring schedule — who never see cron. The model is { start?, cron?, end? }: a once-off is start alone, a recurring schedule carries the cron plus the window cron itself cannot express. A fresh editor emits nothing until a choice is made; selecting Now stamps the current minute (re-selecting restamps). The recurrence menu only offers what cron states exactly — hour intervals divide 24, month intervals divide 12 and anchor at the start month — so what the preview shows is what the scheduler runs."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="fresh" label="Report schedule" description="When the settlement report is generated." />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(fresh) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ScheduleEditor — weekday mornings with an end date"
    note="The prose line is the contract read back to the user — cron says “At 06:00, Monday through Friday”, the value adds “from … until …” — and the info icon beside it opens the Next runs popover. The end date bounds that list too: a schedule that expires shows fewer than five runs rather than promising ones that will never fire, and the icon disappears entirely when nothing remains. The list follows the wall clock (useClock, minute granularity): a run that has just fired drops off within the minute instead of freezing at first render."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="weekly" label="Settlement extract" />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(weekly) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ScheduleEditor — a schedule that will never run"
    note="A structurally valid schedule with no current or future runs — a Later time already in the past, or a recurring window that closes before the next fire — gets an alert box at the bottom of the control instead of the field-error line: the form is filled in correctly, it just describes nothing. The check follows the wall clock, so a pending time that slips into the past raises the alert within the minute. “Now” is exempt — its stamped minute means run-immediately."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="expired" label="Quarter-close extract" />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(expired) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ScheduleEditor — last Friday of the month"
    note="Monthly schedules offer a day of the month (including “the last day”) or the first/last weekday — the shapes Cronos, Croner and cronstrue all agree on (5L here). “Every N weeks” is deliberately absent: cron cannot express week parity, and a control that silently approximates its promise belongs to nobody."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="lastFriday" label="Month-end report" />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(lastFriday) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ScheduleEditor — a schedule written elsewhere"
    note="An expression the controls cannot round-trip (an operator wrote 0 9 LW * * in CronEditor) is held untouched and described in prose — opening this editor never rewrites a schedule, and the raw expression is never shown to end users. Replacing it is an explicit act that starts over."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="foreign" label="Invoice run" />
      <p class="sb__state">
        Model: <code>{{ JSON.stringify(foreign) }}</code>
      </p>
    </div>
  </Specimen>

  <Specimen
    title="ScheduleEditor — readonly review"
    note="Readonly renders the prose summary alone — for confirmation screens where the schedule is a fact, not a decision."
  >
    <div class="sb__stack">
      <ScheduleEditor v-model="review" label="Report schedule" readonly />
    </div>
  </Specimen>

  <CodeExample :code="scheduleEditorExample" />

  <PropsTable :rows="scheduleEditorProps" />
</template>

<style scoped>
.sb__state {
  font-size: var(--fs-xs);
  color: var(--fg-muted);
}
</style>
