<script setup lang="ts">
/*
 * Page / blade heading: title row with inline metadata and a trailing action
 * cluster, optional subtitle underneath.
 *
 * This is the general form of the heading every list and detail surface needs
 * (title + tags + actions). ADR-0010 rejected config-admin's EntityHeading on
 * domain vocabulary (`folderName`); the domain-free shape is: a primary label,
 * an optional secondary identifier below it, and slots. The app keeps its
 * domain wrapper and delegates here.
 *
 * `subtitleMono` exists because the subtitle is very often an identifier (a
 * path, a slug, a key) rather than prose — monospace is what signals "this is
 * the exact string" — but prose subtitles are legitimate too, so it is opt-in.
 *
 * `as` picks the heading element. `h1` is the default for a page's own header;
 * pass `h2` when the header titles a section inside a page that already has
 * an h1 (blades, cards) so the outline stays honest.
 */
import Icon from './Icon.vue';

withDefaults(
  defineProps<{
    title: string;
    /**
     * Lucide icon name shown before the title, muted, at the title's own size.
     *
     * Every page header in the design carries one — it is what makes a screen
     * recognisable at a glance and ties the page back to the nav item that
     * opened it, so a header without one reads as unfinished rather than as
     * clean. Optional because a blade header, which is already identified by
     * its position in the stack, does not want a second identifier.
     */
    icon?: string;
    subtitle?: string;
    subtitleMono?: boolean;
    as?: 'h1' | 'h2' | 'h3';
  }>(),
  { icon: undefined, subtitle: undefined, subtitleMono: false, as: 'h1' },
);
</script>

<template>
  <header class="r-page-header">
    <div class="r-page-header__row">
      <!-- aria-hidden: the icon repeats what the title already says, and a
           screen reader announcing "table, Retail deals" is noise. -->
      <!-- Sized to the title, as the design has them: a 1:1 ratio is what makes the
           pair read as one heading rather than an icon next to some text. -->
      <Icon v-if="icon" class="r-page-header__icon" :name="icon" :size="22" aria-hidden="true" />
      <component :is="as" class="r-page-header__title">
        <slot name="title">{{ title }}</slot>
      </component>
      <!-- Inline metadata (tags, badges) hugs the title; the action cluster is
           pushed to the trailing edge. Two slots rather than one because that
           gap is the design. -->
      <slot name="meta" />
      <div v-if="$slots.actions" class="r-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <p v-if="subtitle" class="r-page-header__subtitle" :class="{ 'r-page-header__subtitle--mono': subtitleMono }">
      {{ subtitle }}
    </p>
    <slot />
  </header>
</template>

<style>
/*
 * No `margin-bottom`. The header used to carry one, which every caller then
 * paid on top of its own container gap — a page whose column already declared
 * `gap: 16px` got 28px, and config-admin's wrapper, which sets its own
 * `margin-bottom`, got the same overshoot. Spacing between siblings belongs to
 * the container that lays them out; a component that also declares it can only
 * ever be wrong somewhere.
 */
.r-page-header {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  font-family: var(--font-ui);
}

.r-page-header__row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.r-page-header__icon {
  flex: none;
  color: var(--fg-muted);
}

/*
 * `--fs-2xl` (22px), which is a step ON the brand ramp rather than the
 * artboard's 20px — the ramp runs 16, 18, 22 and has no 20, and `--fs-xl` lives
 * in `packages/brand` alongside the React apps, so a hardcoded 20 here would
 * bend a shared scale to fit one canvas.
 *
 * It also puts a page title back in the right place in the heading scale. The
 * element is an `h1`, base.css gives a bare h1 `--fs-3xl`, and this was
 * overriding it down to `--fs-xl` — the h3 step — so a page's own title was
 * rendering two steps smaller than any h1 around it and one step smaller than
 * the h2 section headings beneath it.
 */
.r-page-header__title {
  margin: 0;
  color: var(--fg-primary);
  font-family: var(--font-display);
  font-size: var(--fs-2xl);
  font-weight: var(--fw-semibold);
  line-height: var(--lh-tight);
}

.r-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-inline-start: auto;
}

.r-page-header__subtitle {
  margin: 0;
  color: var(--fg-muted);
  font-size: var(--fs-sm);
}

.r-page-header__subtitle--mono {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}
</style>
