<script setup lang="ts">
/**
 * A command menu, on v0's Popover for the anchor positioning and dismissal.
 *
 * v0 has no Menu component, so the roles and keyboard handling are ours:
 * `menu`/`menuitem`, roving focus with arrows, Home/End, and type-ahead-free
 * dismissal on Escape or selection. A Select is NOT the right primitive here —
 * a select holds a value, a menu runs a command and holds nothing.
 */
import { Popover } from '@vuetify/v0/components';
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue';
import Icon from './Icon.vue';
import { POPOVER_POSITION_TRY } from './popoverPosition';

export interface MenuItem {
  /** Omit `action` and set `separator` for a divider. */
  label?: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  /** Renders the item in the destructive tone. */
  destructive?: boolean;
  separator?: boolean;
}

const props = withDefaults(
  defineProps<{
    items: readonly MenuItem[];
    /** Placement relative to the trigger. */
    positionArea?: string;
    /**
     * CSS `position-try-fallbacks` when the preferred area overflows.
     * Defaults to flip-block / flip-inline / both.
     */
    positionTry?: string;
    /**
     * Accessible name for the trigger, and its native tooltip.
     *
     * It belongs here rather than on whatever the caller puts in the slot,
     * because the ACTIVATOR is the button — an aria-label on a <span> inside it
     * names nothing.
     */
    triggerLabel?: string;
    /**
     * Classes for the activator itself.
     *
     * The slot must contain non-interactive content only: v0 renders the
     * activator as a <button>, and a second button inside it is invalid markup
     * that yields two tab stops for one control. Style the real button through
     * this instead of nesting one.
     */
    triggerClass?: string;
  }>(),
  { positionTry: POPOVER_POSITION_TRY },
);

/** When any item carries an icon, reserve the gutter so labels stay aligned. */
const itemsHaveIcons = computed(() => props.items.some((item) => Boolean(item.icon)));

const open = ref(false);
const menu = useTemplateRef('menu');

/*
 * A template ref on a COMPONENT yields its instance, not its element — so
 * `menu.value.querySelectorAll` is undefined, and every keyboard path through
 * this menu threw before it could focus anything. It surfaced as an unhandled
 * rejection in the test run rather than a failure, because the click path
 * (the only one asserted) never calls it.
 *
 * The same trap is documented on Button, where it cost a real bug in
 * BladeAside. Anywhere a ref points at a v0 compound component, unwrap `$el`.
 */
function panel(): HTMLElement | null {
  const node = menu.value as HTMLElement | { $el?: unknown } | null;
  if (node instanceof HTMLElement) return node;
  const el = node && typeof node === 'object' && '$el' in node ? node.$el : null;
  return el instanceof HTMLElement ? el : null;
}

/** Actionable items only — separators and disabled entries are skipped. */
function actionable(): HTMLElement[] {
  return [...(panel()?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? [])];
}

function focusAt(index: number) {
  const items = actionable();
  if (items.length === 0) return;
  // Wraps, because a menu is a short circular list and stopping dead at the
  // ends makes the last item hard to reach from the top.
  const next = (index + items.length) % items.length;
  items[next]?.focus();
}

function currentIndex(): number {
  return actionable().indexOf(document.activeElement as HTMLElement);
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  await nextTick();
  focusAt(0);
});

async function run(item: MenuItem) {
  if (item.disabled === true || !item.action) return;

  // Closed, and the close FLUSHED, before the action runs. Setting
  // `open = false` alone only queues the update: the menu is still in the DOM
  // and still focus-trapping when the action fires, so an action that opens a
  // dialog or moves focus races with this menu tearing down. Awaiting the tick
  // costs a microtask and makes the ordering deterministic.
  open.value = false;
  await nextTick();
  item.action();
}

function onKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusAt(currentIndex() + 1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusAt(currentIndex() - 1);
      break;
    case 'Home':
      event.preventDefault();
      focusAt(0);
      break;
    case 'End':
      event.preventDefault();
      focusAt(actionable().length - 1);
      break;
    case 'Escape':
      // Marked handled so a blade or dialog behind does not also close.
      event.preventDefault();
      event.stopPropagation();
      open.value = false;
      break;
  }
}
</script>

<template>
  <!--
    `v-slot="{ id }"` is load-bearing, not decoration. v0's PopoverContent only
    honours `position-area` / `position-try` when it is given its OWN `id`;
    without one it silently falls back to the root's context styles, which are
    hard-wired to "bottom" / "most-width bottom" (PopoverRoot never threads the
    options into usePopover the way TooltipRoot does). Every `position-area` on
    a Menu was therefore ignored. Passing the root's id back down takes the
    branch that reads the props — and because `position-anchor` is derived from
    that same id, it still resolves to the activator's anchor-name.
  -->
  <Popover.Root v-slot="{ id }" v-model="open">
    <!--
      No @click here. Popover.Activator has no click handler of its own — it
      carries `popovertarget`, and the BROWSER toggles the panel and fires
      `toggle`, which v0 listens to. Forcing `open = true` on click fought that
      on the way back: the browser closed the menu, this reopened it, and the
      trigger could not dismiss a menu it had opened. Focusing the first item
      hangs off the open state instead, which is the thing actually being
      reacted to.
    -->
    <Popover.Activator class="r-menu__activator" :class="triggerClass" :aria-label="triggerLabel" :title="triggerLabel">
      <slot name="trigger" :open="open" />
    </Popover.Activator>

    <Popover.Content
      ref="menu"
      :id="id"
      class="r-menu"
      role="menu"
      :position-area="props.positionArea"
      :position-try="props.positionTry"
      @keydown="onKeydown"
    >
      <template v-for="(item, index) in items" :key="index">
        <hr v-if="item.separator" class="r-menu__separator" />
        <button
          v-else
          type="button"
          role="menuitem"
          class="r-menu__item"
          :class="{ 'r-menu__item--destructive': item.destructive }"
          :aria-disabled="item.disabled ? 'true' : undefined"
          :disabled="item.disabled"
          @click="run(item)"
        >
          <span v-if="itemsHaveIcons" class="r-menu__icon" aria-hidden="true">
            <Icon v-if="item.icon" :name="item.icon" :size="14" />
          </span>
          <span>{{ item.label }}</span>
        </button>
      </template>
    </Popover.Content>
  </Popover.Root>
</template>

<style>
.r-menu__activator {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: none;
}

.r-menu {
  z-index: 50;
  min-width: 11rem;
  padding: var(--sp-1);
  border: 1px solid var(--border-default);
  border-radius: var(--r-sm);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}

.r-menu__item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2);
  border: 0;
  border-radius: var(--r-xs);
  background: none;
  color: var(--fg-primary);
  font-family: var(--font-ui);
  font-size: var(--fs-base);
  text-align: start;
  cursor: pointer;
}

.r-menu__icon {
  display: inline-flex;
  flex: 0 0 14px;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
}

.r-menu__item:hover:not([aria-disabled='true']),
.r-menu__item:focus-visible {
  background: var(--bg-surface-3);
}

.r-menu__item--destructive {
  color: var(--error-ink);
}

.r-menu__item--destructive:hover:not([aria-disabled='true']) {
  background: var(--error-soft);
}

.r-menu__item[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.r-menu__separator {
  height: 1px;
  margin: var(--sp-1) 0;
  border: 0;
  background: var(--border-subtle);
}
</style>
