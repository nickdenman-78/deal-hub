<script setup lang="ts">
/**
 * A menubar whose entries open multi-column panels.
 *
 * Menu is the right primitive for a short list of commands hanging off one
 * trigger. This is the other shape: several triggers side by side, each opening
 * a wide panel of grouped links — a section index, a product nav — where a
 * single column would scroll and lose the grouping that makes it scannable.
 *
 * v0 has no Menu or Menubar, so the roles and keyboard handling are ours, per
 * the WAI-ARIA menubar pattern: roving tabindex across the bar, arrows to move
 * within a panel (up/down inside a column, left/right across columns), Home /
 * End, and Escape to close back onto the trigger. Anchoring and dismissal come
 * from v0's Popover — one per entry, so the browser's own top-layer rules make
 * the panels mutually exclusive for free.
 */
import { Popover } from '@vuetify/v0/components';
import { computed, nextTick, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import Icon from './Icon.vue';
import {
  edgeInBar,
  hasPanel,
  moveInBar,
  moveInGrid,
  resolveFlow,
  type MegaMenuEntry,
  type MegaMenuFlow,
  type MegaMenuItem,
  type MegaMenuMove,
  type MegaMenuPosition,
} from './megaMenu';
import { POPOVER_POSITION_TRY } from './popoverPosition';

const props = withDefaults(
  defineProps<{
    model: readonly MegaMenuEntry[];
    /** Bar direction. Vertical swaps which arrows walk the bar and which opens. */
    orientation?: 'horizontal' | 'vertical';
    /** Accessible name for the menubar. */
    label?: string;
    /**
     * What up/down do at a column boundary — see MegaMenuFlow.
     *
     * `auto` (the default) decides per entry: labelled columns are groups and
     * wrap within the column; bare columns are one reflowed list and run on
     * into the next.
     */
    flow?: MegaMenuFlow;
    /** Placement of the panels, in CSS `position-area` terms. */
    positionArea?: string;
    /**
     * CSS `position-try-fallbacks` when the preferred area overflows.
     * Defaults to flip-block / flip-inline / both.
     */
    positionTry?: string;
    /**
     * Open the neighbouring panel on hover once one is already open.
     *
     * Only ever a switch, never an opener — a bar that opens a wide panel on
     * passing hover swallows the page underneath.
     */
    hoverSwitch?: boolean;
  }>(),
  {
    orientation: 'horizontal',
    label: undefined,
    flow: 'auto',
    positionArea: undefined,
    positionTry: POPOVER_POSITION_TRY,
    hoverSwitch: true,
  },
);

const emit = defineEmits<{ select: [item: MegaMenuItem | MegaMenuEntry] }>();

const bar = ref<HTMLElement | null>(null);
const panels = ref(new Map<number, HTMLElement>());

/** At most one panel is open — the browser enforces it, this tracks which. */
const openIndex = ref<number | null>(null);
/** The single tab stop in the bar (roving tabindex; the menubar is one stop). */
const focusIndex = ref(0);

const panelArea = computed(
  () => props.positionArea ?? (props.orientation === 'vertical' ? 'right span-bottom' : 'bottom span-right'),
);

function setPanel(index: number, node: unknown) {
  // A template ref on a v0 COMPOUND component yields its instance, not its
  // element — the same trap documented on Menu and Button. Unwrap `$el`.
  const element = node instanceof HTMLElement ? node : ((node as { $el?: unknown } | null)?.$el ?? null);
  if (element instanceof HTMLElement) panels.value.set(index, element);
  else panels.value.delete(index);
}

/*
 * `popover=""` is `popover="auto"`: showing one panel light-dismisses any
 * other, and the dismissed panel reports `open = false` on its way out. That
 * arrives AFTER `openIndex` has already moved to the new entry, so a naive
 * handler would immediately close the panel it just opened. Only the entry
 * that still owns `openIndex` may clear it.
 */
function setOpen(index: number, open: boolean) {
  if (open) openIndex.value = index;
  else if (openIndex.value === index) openIndex.value = null;
}

function rootButtons(): HTMLElement[] {
  return [...(bar.value?.querySelectorAll<HTMLElement>('.r-mega-menu__root') ?? [])];
}

function focusRoot(index: number | null) {
  if (index === null) return;
  focusIndex.value = index;
  rootButtons()[index]?.focus();
}

/** Actionable items per column, in DOM order — separators and disabled skipped. */
function panelColumns(index: number): HTMLElement[][] {
  const panel = panels.value.get(index);
  if (!panel) return [];
  return [...panel.querySelectorAll<HTMLElement>('.r-mega-menu__column')].map((column) => [
    ...column.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  ]);
}

function currentPosition(columns: HTMLElement[][]): MegaMenuPosition {
  const active = document.activeElement;
  for (const [column, items] of columns.entries()) {
    const row = items.indexOf(active as HTMLElement);
    if (row !== -1) return { column, row };
  }
  return { column: -1, row: 0 };
}

function movePanelFocus(index: number, move: MegaMenuMove) {
  const entry = props.model[index];
  if (!entry) return;
  const columns = panelColumns(index);
  const next = moveInGrid(
    columns.map((items) => items.length),
    currentPosition(columns),
    move,
    resolveFlow(entry, props.flow),
  );
  if (next) columns[next.column]?.[next.row]?.focus();
}

function closePanel(index: number, restoreFocus = true) {
  if (openIndex.value === index) openIndex.value = null;
  if (restoreFocus) focusRoot(index);
}

watch(openIndex, async (index) => {
  if (index === null) return;
  await nextTick();
  movePanelFocus(index, 'first');
});

function onRootKeydown(index: number, event: KeyboardEvent) {
  const entry = props.model[index];
  if (!entry) return;

  const alongBar = props.orientation === 'vertical' ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];
  const opens = props.orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown';

  if (event.key === alongBar[0] || event.key === alongBar[1]) {
    event.preventDefault();
    focusRoot(moveInBar(props.model, index, event.key === alongBar[0] ? 1 : -1));
    return;
  }

  switch (event.key) {
    case opens:
      if (!hasPanel(entry) || entry.disabled === true) return;
      event.preventDefault();
      // Opening is enough: the watch above moves focus once the panel is up.
      openIndex.value = index;
      break;
    case 'Home':
      event.preventDefault();
      focusRoot(edgeInBar(props.model, 'first'));
      break;
    case 'End':
      event.preventDefault();
      focusRoot(edgeInBar(props.model, 'last'));
      break;
    case 'Escape':
      if (openIndex.value === null) return;
      // Marked handled so a blade or dialog behind does not also close.
      event.preventDefault();
      event.stopPropagation();
      closePanel(index);
      break;
  }
}

function onPanelKeydown(index: number, event: KeyboardEvent) {
  const moves: Record<string, MegaMenuMove> = {
    ArrowDown: 'down',
    ArrowUp: 'up',
    ArrowRight: 'right',
    ArrowLeft: 'left',
    Home: 'first',
    End: 'last',
  };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    movePanelFocus(index, move);
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closePanel(index);
    return;
  }

  // Tab leaves the menu entirely — close, but let focus go where it was going.
  if (event.key === 'Tab') closePanel(index, false);
}

function onRootPointerEnter(index: number) {
  const entry = props.model[index];
  if (!props.hoverSwitch || openIndex.value === null || openIndex.value === index) return;
  if (!entry || !hasPanel(entry) || entry.disabled === true) return;
  openIndex.value = index;
}

function tagFor(item: MegaMenuItem | MegaMenuEntry) {
  if (item.to !== undefined) return RouterLink;
  if (item.href !== undefined) return 'a';
  return 'button';
}

function bindFor(item: MegaMenuItem | MegaMenuEntry) {
  if (item.to !== undefined) return { to: item.to };
  if (item.href !== undefined) return { href: item.href };
  return { type: 'button' as const };
}

async function activate(index: number, item: MegaMenuItem | MegaMenuEntry) {
  if (item.disabled === true) return;

  // Closed, and the close FLUSHED, before the action runs — an action that
  // opens a dialog or moves focus otherwise races this panel tearing down.
  // Focus is NOT restored to the trigger: a link has navigated, and an action
  // may have put focus somewhere deliberate.
  closePanel(index, false);
  await nextTick();
  emit('select', item);
  item.action?.();
}
</script>

<template>
  <div
    ref="bar"
    class="r-mega-menu"
    :class="`r-mega-menu--${orientation}`"
    role="menubar"
    :aria-label="label"
    :aria-orientation="orientation"
  >
    <template v-for="(entry, index) in model" :key="entry.label">
      <!--
        `v-slot="{ id }"` is load-bearing, not decoration: v0's PopoverContent
        only honours `position-area` / `position-try` when it is given its OWN
        id — see the matching note in Menu.vue.
      -->
      <Popover.Root
        v-if="hasPanel(entry)"
        v-slot="{ id }"
        :model-value="openIndex === index"
        @update:model-value="(open: boolean) => setOpen(index, open)"
      >
        <!--
          NO @click. Popover.Activator carries `popovertarget` and the BROWSER
          toggles the panel; a second toggle here would cancel the first and the
          trigger would appear dead.
        -->
        <Popover.Activator
          class="r-mega-menu__root"
          :class="{ 'is-active': entry.active }"
          :tabindex="focusIndex === index ? 0 : -1"
          :disabled="entry.disabled"
          aria-haspopup="true"
          @focus="focusIndex = index"
          @keydown="(event: KeyboardEvent) => onRootKeydown(index, event)"
          @pointerenter="onRootPointerEnter(index)"
        >
          <Icon v-if="entry.icon" :name="entry.icon" :size="16" />
          <span class="r-mega-menu__root-label">{{ entry.label }}</span>
          <Icon class="r-mega-menu__chevron" name="chevron-down" :size="14" />
        </Popover.Activator>

        <Popover.Content
          :id="id"
          :ref="(node: unknown) => setPanel(index, node)"
          class="r-mega-menu__panel"
          role="menu"
          :aria-label="entry.label"
          :position-area="panelArea"
          :position-try="positionTry"
          @keydown="(event: KeyboardEvent) => onPanelKeydown(index, event)"
        >
          <!--
            The columns are laid out on this wrapper, NOT on the panel itself.
            A closed popover is hidden by the UA rule
            `[popover]:not(:popover-open) { display: none }`, and any author
            `display` on the panel outranks it — every panel then renders
            permanently open, in place, with no anchoring. Style the inside.
          -->
          <div class="r-mega-menu__columns">
            <div v-for="(column, columnIndex) in entry.columns" :key="columnIndex" class="r-mega-menu__column">
              <div v-for="(group, groupIndex) in column" :key="groupIndex" class="r-mega-menu__group">
                <p v-if="group.label" :id="`${id}-g${columnIndex}-${groupIndex}`" class="r-mega-menu__group-label">
                  {{ group.label }}
                </p>
                <!--
                  `group` only when there IS a label. An unnamed group role
                  announces a boundary and then says nothing about it — four
                  anonymous groups for what is one reflowed list. `none` keeps
                  the <ul> out of the way so the menuitems still belong to the
                  menu; dropping the role entirely would break that ownership.
                -->
                <ul
                  class="r-mega-menu__list"
                  :role="group.label ? 'group' : 'none'"
                  :aria-labelledby="group.label ? `${id}-g${columnIndex}-${groupIndex}` : undefined"
                >
                  <li v-for="(item, itemIndex) in group.items" :key="itemIndex" role="none">
                    <hr v-if="item.separator" class="r-mega-menu__separator" />
                    <component
                      :is="tagFor(item)"
                      v-else
                      v-bind="bindFor(item)"
                      class="r-mega-menu__item"
                      :class="{ 'is-active': item.active }"
                      role="menuitem"
                      tabindex="-1"
                      :aria-disabled="item.disabled ? 'true' : undefined"
                      :aria-current="item.active ? 'true' : undefined"
                      @click="activate(index, item)"
                    >
                      <span v-if="item.icon" class="r-mega-menu__item-icon" aria-hidden="true">
                        <Icon :name="item.icon" :size="14" />
                      </span>
                      <span>{{ item.label }}</span>
                    </component>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>

      <component
        :is="tagFor(entry)"
        v-else
        v-bind="bindFor(entry)"
        class="r-mega-menu__root"
        :class="{ 'is-active': entry.active }"
        role="menuitem"
        :tabindex="focusIndex === index ? 0 : -1"
        :aria-disabled="entry.disabled ? 'true' : undefined"
        @focus="focusIndex = index"
        @keydown="(event: KeyboardEvent) => onRootKeydown(index, event)"
        @click="activate(index, entry)"
      >
        <Icon v-if="entry.icon" :name="entry.icon" :size="16" />
        <span class="r-mega-menu__root-label">{{ entry.label }}</span>
      </component>
    </template>
  </div>
</template>

<style>
.r-mega-menu {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  min-width: 0;
}

.r-mega-menu--vertical {
  flex-direction: column;
  align-items: stretch;
}

.r-mega-menu__root {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-1) var(--sp-2);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  color: var(--fg-muted);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.r-mega-menu--vertical .r-mega-menu__root {
  justify-content: space-between;
}

.r-mega-menu__root:hover:not([aria-disabled='true']):not(:disabled),
.r-mega-menu__root[data-open] {
  background: var(--bg-surface-2);
  color: var(--fg-default);
}

.r-mega-menu__root.is-active {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-mega-menu__root[aria-disabled='true'],
.r-mega-menu__root:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-mega-menu__chevron {
  transition: transform 120ms ease;
}

.r-mega-menu__root[data-open] .r-mega-menu__chevron {
  transform: rotate(180deg);
}

/*
 * NO `display` here. A closed popover is hidden by the UA rule
 * `[popover]:not(:popover-open) { display: none }`, which any author `display`
 * on this element outranks — the panels then render permanently open and
 * unanchored. The column layout lives on `__columns` inside instead.
 */
.r-mega-menu__panel {
  z-index: 50;
  /* The panel is anchor-positioned, so `100%` is the space its position-area
     actually has — trigger to viewport edge — not the whole screen. Without
     the cap a panel taller than that renders items below the fold that nothing
     can reach: not the mouse, and not the keyboard either, since there is no
     scroll container to bring them into view. `most-height` picks the roomiest
     side first, so scrolling only starts once neither side fits. */
  position-try-order: most-height;
  max-width: calc(100vw - var(--sp-6));
  max-height: 100%;
  padding: var(--sp-4);
  overflow: auto;
  /* Reaching the end of the panel must not start scrolling the page behind. */
  overscroll-behavior: contain;
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  color: var(--fg-primary);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
}

.r-mega-menu__panel:focus,
.r-mega-menu__panel:focus-visible {
  outline: none;
}

.r-mega-menu__columns {
  display: flex;
  gap: var(--sp-4);
}

.r-mega-menu__column {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: var(--sp-3);
  min-width: 0;
}

.r-mega-menu__group-label {
  margin: 0 0 var(--sp-2);
  padding-inline: var(--sp-3);
  color: var(--fg-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--tr-caps);
  text-transform: uppercase;
}

.r-mega-menu__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.r-mega-menu__item {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 0;
  border-radius: var(--r-sm);
  background: none;
  color: var(--fg-secondary);
  font-family: var(--font-ui);
  font-size: var(--fs-sm);
  text-align: start;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.r-mega-menu__item:hover:not([aria-disabled='true']),
.r-mega-menu__item:focus-visible {
  background: var(--bg-surface-2);
  color: var(--fg-default);
}

.r-mega-menu__item.is-active {
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-weight: var(--fw-medium);
}

.r-mega-menu__item[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-mega-menu__item-icon {
  display: inline-flex;
  flex: 0 0 14px;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

.r-mega-menu__separator {
  height: 1px;
  margin: var(--sp-1) 0;
  border: 0;
  background: var(--border-subtle);
}
</style>
