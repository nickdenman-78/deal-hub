<script setup lang="ts">
/**
 * An edge-docked panel. No v0 counterpart — Sheet/Drawer is not in its
 * component list — so this is built on the primitives it does ship, with a
 * Teleport to <body> and a hand-rolled scrim.
 *
 * Distinct from BladeAside, which docks to the blade stack and is view state
 * within it. This is a general app drawer: navigation on narrow screens, a
 * filter panel, a details pane on a page that has no blade stack.
 */
import { computed, nextTick, useAttrs, useTemplateRef, watch } from 'vue';
import { useFocusOrigin } from '../composables/useFocusOrigin';
import { trapTab } from '../composables/useFocusTrap';
import Button from './Button.vue';

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** Override with the `title` slot when the heading needs markup. */
    title: string;
    side?: 'start' | 'end';
    size?: 'sm' | 'md' | 'lg';
    /**
     * Any CSS width, for drawers that are really a wide working surface — a
     * file-history diff, a draft-recovery list. Still capped to the viewport.
     * Prefer `size`.
     */
    width?: string;
    /** Hides the scrim and lets clicks through to the page behind. */
    modeless?: boolean;
    /**
     * Renders the header's close button. Off for drawers whose own content
     * carries the close affordance.
     */
    closable?: boolean;
    closeOnEscape?: boolean;
    /** Dismiss by clicking the scrim. Ignored when `modeless` — no scrim. */
    closeOnScrimClick?: boolean;
  }>(),
  {
    side: 'end',
    size: 'md',
    width: undefined,
    closable: true,
    closeOnEscape: true,
    closeOnScrimClick: true,
  },
);

const open = defineModel<boolean>('open', { required: true });

const style = computed(() => (props.width === undefined ? undefined : { '--r-drawer-width': props.width }));

const panel = useTemplateRef<HTMLElement>('panel');
const focusOrigin = useFocusOrigin();
let opener: HTMLElement | null = null;

/*
 * Same arrangement as BladeAside, for the same reasons:
 *   - the trigger is resolved through useFocusOrigin, because a click does
 *     not reliably focus what it hits;
 *   - focus must land INSIDE the panel, or the Escape handler below never
 *     runs and the key falls through to whatever is listening on document.
 */
watch(
  open,
  async (isOpen) => {
    if (!isOpen) {
      focusOrigin.restore(opener);
      opener = null;
      return;
    }
    opener = focusOrigin.resolve();
    await nextTick();
    const field = panel.value?.querySelector<HTMLElement>('.r-drawer__body :is(input, select, textarea)');
    const closer = panel.value?.querySelector<HTMLElement>('.r-drawer__header button');
    (field ?? closer ?? panel.value)?.focus();
  },
  { flush: 'post' },
);

function onEscape(event: KeyboardEvent) {
  if (!props.closeOnEscape) return;
  // Marked handled so nothing behind — a blade, a parent dialog — also acts
  // on the same press.
  event.stopPropagation();
  event.preventDefault();
  open.value = false;
}

function onScrimClick() {
  if (props.closeOnScrimClick) open.value = false;
}

/** Tab wraps inside a modal drawer. A modeless one is part of the page. */
function onTab(event: KeyboardEvent) {
  if (props.modeless) return;
  trapTab(event, panel.value);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="r-drawer">
      <div v-if="open" class="r-drawer-layer" :class="{ 'r-drawer-layer--modeless': modeless }">
        <!--
          Plain div rather than v0 Scrim: Scrim did not reliably forward click
          to Vue listeners, so closeOnScrimClick never fired. A div with the
          same paint + inset is enough — z-index lives on the layer.
        -->
        <div v-if="!modeless" class="r-drawer__scrim" aria-hidden="true" @click="onScrimClick" />

        <div
          ref="panel"
          class="r-drawer"
          :class="[`r-drawer--${side}`, `r-drawer--${size}`, { 'r-drawer--custom-width': width !== undefined }]"
          :style="style"
          v-bind="attrs"
          tabindex="-1"
          :role="modeless ? 'region' : 'dialog'"
          :aria-modal="modeless ? undefined : 'true'"
          :aria-label="title"
          @keydown.esc="onEscape"
          @keydown="onTab"
          @click.stop
        >
          <header class="r-drawer__header">
            <h2 class="r-drawer__title">
              <slot name="title">{{ title }}</slot>
            </h2>
            <!-- Header controls that are not "close": a refresh, an open-in-new-tab, a
                 clear-all. Deliberately outside the <h2> — a button inside a heading is
                 read as part of the heading text by a screen reader. -->
            <div v-if="$slots['header-actions']" class="r-drawer__actions">
              <slot name="header-actions" />
            </div>
            <Button
              v-if="closable"
              variant="text"
              size="sm"
              icon="x"
              :aria-label="`Close ${title}`"
              @click="open = false"
            />
          </header>

          <div class="r-drawer__body"><slot /></div>

          <footer v-if="$slots.footer" class="r-drawer__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.r-drawer-layer {
  position: fixed;
  z-index: 70;
  inset: 0;
}

/* A modeless drawer must not swallow clicks on the page it sits beside; the
     panel itself takes them back. */
.r-drawer-layer--modeless {
  pointer-events: none;
}

.r-drawer__scrim {
  position: absolute;
  inset: 0;
  background: var(--bg-overlay);
}

.r-drawer {
  position: absolute;
  display: flex;
  flex-direction: column;
  inset-block: 0;
  max-width: 100%;
  border-inline: 1px solid var(--border-default);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.r-drawer--start {
  inset-inline-start: 0;
}

.r-drawer--end {
  inset-inline-end: 0;
}

.r-drawer--sm {
  width: 18rem;
}

.r-drawer--md {
  width: 24rem;
}

.r-drawer--lg {
  width: 34rem;
}

/* Last, so it beats whichever size class is also present. `max-width: 100%`
     on .r-drawer still caps it to the viewport. */
.r-drawer--custom-width {
  width: var(--r-drawer-width);
}

.r-drawer__header {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-bottom: 1px solid var(--border-subtle);
}

.r-drawer__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.r-drawer__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--sp-1);
}

.r-drawer__body {
  flex: 1;
  min-height: 0;
  padding: var(--sp-4);
  overflow-y: auto;
}

.r-drawer__footer {
  display: flex;
  flex: none;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-surface-2);
}

/* The panel slides, the scrim only fades — a scrim that slides in from the
     side reads as a second panel rather than as a dimming of the page. */
.r-drawer-enter-active .r-drawer,
.r-drawer-leave-active .r-drawer {
  transition: transform var(--dur-base) var(--ease-out);
}

.r-drawer-enter-active .r-drawer__scrim,
.r-drawer-leave-active .r-drawer__scrim {
  transition: opacity var(--dur-base) var(--ease-out);
}

.r-drawer-enter-from .r-drawer__scrim,
.r-drawer-leave-to .r-drawer__scrim {
  opacity: 0;
}

.r-drawer-enter-from .r-drawer--end,
.r-drawer-leave-to .r-drawer--end {
  transform: translateX(100%);
}

.r-drawer-enter-from .r-drawer--start,
.r-drawer-leave-to .r-drawer--start {
  transform: translateX(-100%);
}
</style>
