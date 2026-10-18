<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from './Button.vue';
import ContextMenu from './ContextMenu.vue';
import Icon from './Icon.vue';
import type { MenuItem } from './Menu.vue';

/*
 * IDE-style tab strip for multi-document editing surfaces: dirty dots, a
 * right-click close menu and drag-to-reorder. Not the Tabs compound — that is
 * section navigation with panels; this is a document list whose entries open
 * and close at runtime.
 *
 * Admitted under the "intentional multi-app library surface" test: any app
 * with an editing workbench wants exactly this strip, and its behaviours
 * (insertion-slot drag maths, capture-phase context targeting) are the kind
 * that get re-solved badly. Supersedes ADR-0010's rejection — the "a file may
 * become a blade rather than a tab" uncertainty resolved in favour of tabs
 * inside a workbench blade.
 *
 * The strip renders nothing when `tabs` is empty: an empty tab bar is dead
 * chrome, and the caller's empty state belongs to the caller.
 */
export interface EditorTab {
  id: string;
  label: string;
  /** Tooltip; defaults to the label. Use for the full path behind a basename. */
  title?: string;
  dirty?: boolean;
  /** Per-tab icon; overrides the strip-level `icon`. */
  icon?: string;
}

// `closable` defaults true (documents open and close freely). Set to false for
// surfaces that auto-open a fixed set of tabs for the life of the view. The
// right-click context menu and drag-to-reorder are BOTH gated on `closable`:
// a fixed strip owns its tab order and lifecycle, so reordering or closing
// would be meaningless.
const props = withDefaults(
  defineProps<{
    tabs: EditorTab[];
    closable?: boolean;
    /** Strip-level tab icon. Pass undefined per your design; default is 'file'. */
    icon?: string;
    /** Monospace labels — for file names and other exact identifiers. */
    mono?: boolean;
  }>(),
  { closable: true, icon: 'file', mono: false },
);

/** The active tab's id. */
const active = defineModel<string>();

const emit = defineEmits<{
  (e: 'close', id: string): void;
  (e: 'close-others', id: string): void;
  (e: 'close-right', id: string): void;
  (e: 'close-all'): void;
  (e: 'reorder', orderedIds: string[]): void;
}>();

// --- Right-click context menu -----------------------------------------------
// ContextMenu wraps its target rather than being opened imperatively, so the
// right-clicked tab is resolved from the event during the CAPTURE phase —
// before the menu's own handler runs — and read back out of a data attribute.
const menuId = ref<string | null>(null);

const menuItems = computed<MenuItem[]>(() => {
  const id = menuId.value;
  if (id === null) return [];
  const idx = props.tabs.findIndex((t) => t.id === id);
  const onlyTab = props.tabs.length <= 1;
  const isLast = idx === props.tabs.length - 1;
  return [
    { label: 'Close this tab', icon: 'x', action: () => emit('close', id) },
    { label: 'Close other tabs', icon: 'move-horizontal', disabled: onlyTab, action: () => emit('close-others', id) },
    {
      label: 'Close all tabs to the right',
      icon: 'chevrons-right',
      disabled: isLast,
      action: () => emit('close-right', id),
    },
    { label: 'Close all tabs', icon: 'circle-x', action: () => emit('close-all') },
  ];
});

function captureContextTarget(event: MouseEvent) {
  // A fixed-tab strip has no per-tab actions; leaving menuId null disables the
  // menu and lets the browser's own show instead.
  if (!props.closable) {
    menuId.value = null;
    return;
  }
  const tab = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-tab-id]');
  menuId.value = tab?.dataset.tabId ?? null;
}

// --- Drag to reorder --------------------------------------------------------
// Reordering is computed at the STRIP level (not per-tab) from the pointer's
// horizontal position against each tab's midpoint, yielding an insertion SLOT
// in [0, tabs.length]. This makes "drop at the very end" unambiguous: dropping
// past the last tab's midpoint (or in the strip's trailing empty space)
// returns slot = tabs.length and appends. Per-tab "insert at the target tab's
// index" logic lands such drops second-to-last.
const stripEl = ref<HTMLElement | null>(null);
const dragId = ref<string | null>(null);
const dropIndex = ref<number>(-1); // insertion slot 0..tabs.length, or -1 when not dragging

function onDragStart(event: DragEvent, id: string) {
  if (!props.closable) return;
  dragId.value = id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    // Firefox requires data to be set for the drag to actually start.
    event.dataTransfer.setData('text/plain', id);
  }
}

// The insertion slot for the pointer: the count of tabs whose horizontal
// midpoint sits left of it. Pointer left of every midpoint → 0; pointer past
// every midpoint → tabs.length (append).
function computeDropIndex(clientX: number): number {
  const strip = stripEl.value;
  if (!strip) return props.tabs.length;
  const tabEls = Array.from(strip.querySelectorAll<HTMLElement>('.r-editor-tabs__tab'));
  for (let i = 0; i < tabEls.length; i++) {
    const rect = tabEls[i]!.getBoundingClientRect();
    if (clientX < rect.left + rect.width / 2) return i;
  }
  return tabEls.length;
}

function onStripDragOver(event: DragEvent) {
  if (!props.closable || dragId.value === null) return;
  event.preventDefault(); // allow the drop
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dropIndex.value = computeDropIndex(event.clientX);
}

function onStripDrop(event: DragEvent) {
  if (!props.closable || dragId.value === null) return;
  event.preventDefault();
  const moved = dragId.value;
  const ids = props.tabs.map((t) => t.id);
  const from = ids.indexOf(moved);
  let to = computeDropIndex(event.clientX);
  resetDrag();
  if (from < 0) return;
  ids.splice(from, 1);
  if (from < to) to--; // removing the dragged tab shifts later slots left by one
  to = Math.min(Math.max(to, 0), ids.length);
  ids.splice(to, 0, moved);
  // Skip a no-op (dropped back into its own slot) so we don't churn the caller.
  if (ids.some((id, i) => id !== props.tabs[i]?.id)) emit('reorder', ids);
}

function resetDrag() {
  dragId.value = null;
  dropIndex.value = -1;
}
</script>

<template>
  <ContextMenu :items="menuItems" :disabled="menuId === null" @contextmenu.capture="captureContextTarget">
    <div
      v-if="tabs.length > 0"
      ref="stripEl"
      class="r-editor-tabs"
      :class="{ 'r-editor-tabs--insert-end': dropIndex === tabs.length }"
      role="tablist"
      @dragover="onStripDragOver"
      @drop="onStripDrop"
    >
      <div
        v-for="(tab, index) in tabs"
        :key="tab.id"
        class="r-editor-tabs__tab"
        :class="{
          'r-editor-tabs__tab--active': active === tab.id,
          'r-editor-tabs__tab--dragging': dragId === tab.id,
          'r-editor-tabs__tab--insert-before': dropIndex === index,
        }"
        role="tab"
        :aria-selected="active === tab.id"
        :title="tab.title ?? tab.label"
        :draggable="closable"
        :data-tab-id="tab.id"
        @click="active = tab.id"
        @dragstart="onDragStart($event, tab.id)"
        @dragend="resetDrag"
      >
        <Icon v-if="tab.icon ?? icon" :name="tab.icon ?? icon!" :size="14" class="r-editor-tabs__icon" />
        <span class="r-editor-tabs__label" :class="{ 'r-editor-tabs__label--mono': mono }">{{ tab.label }}</span>
        <span v-if="tab.dirty" class="r-editor-tabs__dirty" aria-label="Unsaved changes">•</span>
        <Button
          v-if="closable"
          variant="text"
          icon="x"
          size="sm"
          class="r-editor-tabs__close"
          :aria-label="`Close ${tab.label}`"
          @click.stop="emit('close', tab.id)"
        />
      </div>
    </div>
  </ContextMenu>
</template>

<style>
/* Theme-aware strip: transparent background (inherits the surface behind it);
   the bottom rule is an inset box-shadow instead of `border-bottom` so the
   active tab's accent underline doesn't need a negative-margin overlap — that
   overlap fractionally extends child boxes past the strip's content area and
   triggers the implicit vertical scrollbar that comes with `overflow-x: auto`.
   The shadow lives inside the box, so it changes no layout dimensions. */
.r-editor-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  background: transparent;
  box-shadow: inset 0 -1px 0 var(--border-default);
  flex-shrink: 0;
  align-items: center;
  font-family: var(--font-ui);
}

.r-editor-tabs__tab {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-3);
  cursor: pointer;
  font-size: var(--fs-sm);
  color: var(--fg-muted);
  user-select: none;
  white-space: nowrap;
  background: transparent;
  border-bottom: 2px solid transparent;
  /* Transparent left/right channels reserve space for the drag-reorder
     insertion marker so toggling it never shifts tab widths. */
  border-left: 2px solid transparent;
  border-right: 2px solid transparent;
}

.r-editor-tabs__tab:hover {
  color: var(--fg-primary);
}

.r-editor-tabs__tab--active {
  color: var(--fg-primary);
  border-bottom-color: var(--accent);
  font-weight: var(--fw-medium);
}

/* Dragged tab fades while in flight; the insertion marker (an accent-colored
   edge) shows where it will land — a left edge on the tab it'll drop before,
   or a right edge on the last tab when dropping at the very end. */
.r-editor-tabs__tab--dragging {
  opacity: 0.4;
}

.r-editor-tabs__tab--insert-before {
  border-left-color: var(--accent);
}

.r-editor-tabs--insert-end .r-editor-tabs__tab:last-child {
  border-right-color: var(--accent);
}

.r-editor-tabs__icon {
  opacity: 0.7;
}

.r-editor-tabs__tab--active .r-editor-tabs__icon {
  opacity: 1;
}

.r-editor-tabs__label {
  line-height: var(--lh-snug);
}

.r-editor-tabs__label--mono {
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
}

.r-editor-tabs__dirty {
  color: var(--warning);
  font-weight: var(--fw-bold);
  line-height: 0.5;
  font-size: 1.5rem;
}

.r-editor-tabs__close.r-btn {
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
}
</style>
