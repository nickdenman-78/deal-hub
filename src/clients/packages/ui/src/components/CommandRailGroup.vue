<script setup lang="ts">
/**
 * A cluster of commands inside a CommandRail. Adjacent groups draw a vertical
 * rule between them (Azure command-bar separators) — the first group does not.
 *
 * Keep related actions in one group (New / Import) and put filters or a
 * trailing Refresh in another so the rule carries the structure.
 */
withDefaults(
  defineProps<{
    /** Accessible name when the group is a landmark of its own (e.g. "Filters"). */
    ariaLabel?: string;
    /**
     * Push this group to the trailing edge of the rail. Use for Refresh /
     * overflow so primary commands stay leading and secondary sit opposite.
     */
    end?: boolean;
  }>(),
  { ariaLabel: undefined, end: false },
);
</script>

<template>
  <div
    class="r-command-rail__group"
    :class="{ 'r-command-rail__group--end': end }"
    role="group"
    :aria-label="ariaLabel"
  >
    <slot />
  </div>
</template>

<style>
/*
 * Row of controls. Groups are content-sized by default so adjacent button
 * clusters sit tight against the separator (Add project | Clone · Archive).
 * Groups that hold a filter / grow field flex to fill space before an `--end`
 * cluster — without that, the field cannot claim remaining width and wrapping
 * Name/Owner columns collapse to one child's width.
 */
.r-command-rail__group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  flex: 0 1 auto;
  align-items: center;
  align-content: center;
  gap: var(--sp-2);
  min-width: 0;
}

.r-command-rail__group:has(> .r-field),
.r-command-rail__group:has(> .r-daterange),
.r-command-rail__group:has(> .r-date-range-selector) {
  flex: 1 1 auto;
}

.r-command-rail__group--end {
  flex: 0 0 auto;
  margin-inline-start: auto;
}

/* Separator before every group after the first — including an `--end` group,
   so a trailing Refresh still reads as its own cluster. */
.r-command-rail__group + .r-command-rail__group {
  padding-inline-start: var(--sp-3);
  border-inline-start: 1px solid var(--border-default);
}
</style>
