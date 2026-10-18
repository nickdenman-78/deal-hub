<script setup lang="ts">
/**
 * A right-click menu.
 *
 * Not built on Popover, unlike Menu: a context menu is anchored to the CURSOR,
 * not to an element, and the CSS anchor API has no anchor to attach to. So it
 * is positioned from the pointer coordinates and teleported to <body>, where
 * no ancestor's `overflow: hidden` can clip it.
 *
 * Also opens on the keyboard's own context-menu key and Shift+F10, which the
 * `contextmenu` event covers on every current browser — a right-click-only
 * menu is unreachable without a mouse.
 */
import { computed, nextTick, onScopeDispose, ref, useTemplateRef, watch } from 'vue';
import { useFocusOrigin } from '../composables/useFocusOrigin';
import { trapTab } from '../composables/useFocusTrap';
import Icon from './Icon.vue';
import type { MenuItem } from './Menu.vue';

/*
 * Target div + Teleport is a fragment, so native listeners (e.g. capture-phase
 * contextmenu from EditorTabs) would warn and never reach the DOM. Forward
 * attrs onto the target; display:contents keeps layout unchanged.
 */
defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: readonly MenuItem[];
    /**
     * Suppresses the menu without unmounting it. For targets where only SOME
     * rows have actions — a file tree whose folders have none — so the caller
     * can decide per right-click rather than wrapping each row separately.
     * The browser's own menu is then left alone, which is the right fallback.
     */
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const open = ref(false);
const at = ref({ x: 0, y: 0 });
const menu = useTemplateRef<HTMLElement>('menu');
const focusOrigin = useFocusOrigin();
let opener: HTMLElement | null = null;

const actionable = () => [
  ...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []),
];

function show(event: MouseEvent) {
  // Returning WITHOUT preventDefault, so the browser's own menu still opens.
  // Swallowing the event here would leave the operator with no menu at all.
  if (props.disabled) return;
  event.preventDefault();
  opener = focusOrigin.resolve();
  at.value = { x: event.clientX, y: event.clientY };
  open.value = true;
}

function dismiss() {
  if (!open.value) return;
  open.value = false;
  focusOrigin.restore(opener);
  opener = null;
}

async function run(item: MenuItem) {
  if (item.disabled === true || !item.action) return;
  // Closed AND flushed before the action runs, so an action that opens a
  // dialog does not race this menu tearing down. Same reasoning as Menu.
  open.value = false;
  await nextTick();
  item.action();
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  await nextTick();
  actionable()[0]?.focus();
});

/*
 * Clamped to the viewport. A menu opened near the right or bottom edge would
 * otherwise render off-screen — the one place a context menu is most likely
 * to be opened, since that is where the content it acts on often sits.
 */
const style = computed(() => {
  const width = 180;
  const height = Math.min(props.items.length * 34 + 8, 320);
  const x = Math.min(at.value.x, Math.max(0, window.innerWidth - width - 8));
  const y = Math.min(at.value.y, Math.max(0, window.innerHeight - height - 8));
  return { left: `${x}px`, top: `${y}px` };
});

function onKeydown(event: KeyboardEvent) {
  const items = actionable();
  const index = items.indexOf(document.activeElement as HTMLElement);

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      items[(index + 1 + items.length) % items.length]?.focus();
      break;
    case 'ArrowUp':
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
      break;
    case 'Escape':
      // Marked handled so a blade or dialog behind does not also close.
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      break;
    case 'Tab':
      trapTab(event, menu.value);
      break;
  }
}

// Any click elsewhere dismisses. Capture phase, so a handler that stops
// propagation on the thing being clicked cannot leave the menu stranded.
function onDocumentPointerDown(event: Event) {
  if (!open.value) return;
  if (menu.value?.contains(event.target as Node)) return;
  dismiss();
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  window.addEventListener('blur', dismiss);
  onScopeDispose(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    window.removeEventListener('blur', dismiss);
  });
}
</script>

<template>
  <div class="r-ctxmenu__target" v-bind="$attrs" @contextmenu="show">
    <slot />
  </div>

  <Teleport to="body">
    <div v-if="open" ref="menu" class="r-menu r-ctxmenu" role="menu" :style="style" @keydown="onKeydown">
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
          <Icon v-if="item.icon" :name="item.icon" :size="14" />
          <span>{{ item.label }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style>
.r-ctxmenu__target {
  display: contents;
}

.r-ctxmenu {
  position: fixed;
  z-index: 60;
}
</style>
