<script setup lang="ts">
/**
 * Makes the arrow keys work on a FILTERED combobox list. Internal to Combobox;
 * renders nothing.
 *
 * The bug it fixes: v0's ComboboxControl, on ArrowDown/ArrowUp with nothing yet
 * highlighted, prefers the SELECTED item —
 *
 *     if (isUndefined(highlightedId)) {
 *       const selected = selection.selectedIds.values().next().value;
 *       if (!isUndefined(selected)) { cursor.highlight(selected); break }
 *     }
 *     cursor.onKeydown(e)
 *
 * — and it does that without checking whether the selected item survived the
 * filter. The cursor's own list is `values().filter(t => filtered.has(t.id))`,
 * so highlighting something the filter excluded puts the cursor on an id that
 * is not in the list it navigates.
 *
 * The result, with "platform" selected and "fin" typed: the panel correctly
 * shows "finance", the first ArrowDown silently highlights the invisible
 * "platform", nothing renders as highlighted, every further arrow key is a
 * no-op because the cursor cannot find its own position, and Enter selects
 * nothing. The list is reachable by mouse only.
 *
 * So we take the first arrow press ourselves whenever the highlight is not
 * within the filtered set, and put it on the first (or last) option actually on
 * screen. Once the cursor is somewhere real, v0's own handler is correct and we
 * stay out of its way.
 *
 * The listener is on `document` in the CAPTURE phase deliberately. v0 binds its
 * handler as a vnode prop on the input, and for a listener on the target
 * element itself the capture flag does not change the ordering — registration
 * order does, which is not ours to control. Capturing at the document is the
 * only placement that reliably runs first, and stopPropagation there is what
 * keeps v0's fallback from also firing.
 */
/*
 * From '@vuetify/v0/components', NOT '@vuetify/v0'. Both export this, but they
 * are separate entry points and each app prebundles them separately — so the
 * context registry is not shared between them. Imported from the package root
 * this threw V0_CONTEXT_MISSING inside a Combobox.Root that was plainly right
 * there: same key, different module instance. The same dual-instance trap
 * CONTEXT.md records for monaco-editor.
 */
import { useComboboxContext } from '@vuetify/v0/components';
import { onBeforeUnmount, toValue } from 'vue';

interface CursorTicket {
  id: string | number;
  disabled?: unknown;
}

// 'v0:combobox' is the namespace every Combobox.* sub-component defaults to.
const context = useComboboxContext('v0:combobox') as unknown as {
  isOpen: { value: boolean };
  inputEl: { value: HTMLElement | null };
  filtered: { value: Set<string | number> };
  selection: { values: () => CursorTicket[]; selectedIds: Set<string | number> };
  cursor: { highlightedId: { value: string | number | undefined }; highlight: (id: string | number) => void };
};

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  if (event.target !== context.inputEl.value) return;
  if (!context.isOpen.value) return;

  // Already somewhere real — v0 moves from here correctly.
  const highlighted = context.cursor.highlightedId.value;
  if (highlighted !== undefined && context.filtered.value.has(highlighted)) return;

  /*
   * v0's shortcut to the current selection is GOOD when that selection survived
   * the filter — opening a combobox and arrowing straight to what is already
   * chosen is the right move. Only step in when it did not survive, which is
   * the case that strands the cursor.
   */
  const selected = context.selection.selectedIds.values().next().value;
  if (selected !== undefined && context.filtered.value.has(selected)) return;

  const reachable = context.selection
    .values()
    .filter((ticket) => context.filtered.value.has(ticket.id) && !toValue(ticket.disabled))
    .map((ticket) => ticket.id);

  if (reachable.length === 0) return;

  event.preventDefault();
  event.stopPropagation();
  context.cursor.highlight(event.key === 'ArrowDown' ? reachable[0]! : reachable[reachable.length - 1]!);
}

document.addEventListener('keydown', onKeydown, true);
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true));
</script>

<template><!-- renderless --></template>
