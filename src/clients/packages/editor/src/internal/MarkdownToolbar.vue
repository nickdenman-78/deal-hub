<script setup lang="ts">
/**
 * The buttons, rendered once for all three surfaces: the fixed bar, the bubble
 * menu over a selection, and the floating menu on an empty line.
 *
 * `active` and `disabled` arrive as maps rather than being read off each spec
 * here. ProseMirror mutates its own state, so calling `tool.active()` during
 * render would run but track nothing — the answer would be right on first paint
 * and frozen after. The parent computes both maps against a revision counter it
 * bumps on every transaction; this component is then plainly reactive to props.
 *
 * Icons come from `useEditorChrome().Icon` when a host plugin provides one;
 * otherwise the tool title is shown as text so the toolbar stays usable without
 * `@ets/ui`.
 */
import { ref } from 'vue';
import { useEditorChrome } from '../chrome';
import type { MarkdownToolSpec } from '../markdown/tools';

withDefaults(
  defineProps<{
    tools: MarkdownToolSpec[];
    active: Record<string, boolean>;
    disabled: Record<string, boolean>;
    /** `bar` is the fixed strip; `floating` is a bubble or floating menu. */
    variant?: 'bar' | 'floating';
    ariaLabel?: string;
  }>(),
  { variant: 'bar', ariaLabel: 'Formatting' },
);

const emit = defineEmits<{
  /** Escape, or Tab off the end: the caller should hide this and take focus back. */
  dismiss: [];
}>();

const chrome = useEditorChrome();
const root = ref<HTMLElement>();

/**
 * Focus the first button that can actually be pressed.
 *
 * Called by the parent when Tab enters an inline menu. Skipping disabled
 * buttons matters more here than on the bar: undo and redo are excluded from
 * the menus anyway, but a menu whose first entry is dead would swallow the Tab
 * and appear to do nothing.
 */
function focusFirst(): boolean {
  const first = root.value?.querySelector<HTMLButtonElement>('button:not(:disabled)');
  if (!first) return false;
  first.focus();
  return true;
}

defineExpose({ focusFirst });

/*
 * Arrow keys move between the buttons, which is what `role="toolbar"` promises
 * — and without it a keyboard operator who tabbed in would have to Tab through
 * every button to leave again.
 *
 * Roving tabindex is deliberately NOT implemented: these menus appear and
 * vanish with the selection, and a remembered "current" button would be stale
 * every time one reappears somewhere else.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    emit('dismiss');
    return;
  }

  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  if (step === 0) return;

  const buttons = [...(root.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;

  event.preventDefault();
  buttons[(index + step + buttons.length) % buttons.length]?.focus();
}
</script>

<template>
  <div
    ref="root"
    class="r-md-toolbar"
    :class="`r-md-toolbar--${variant}`"
    role="toolbar"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <template v-for="(tool, index) in tools" :key="`${tool.id}-${index}`">
      <span v-if="tool.kind === 'separator'" class="r-md-toolbar__sep" role="separator" aria-orientation="vertical" />

      <!--
        A plain <button>, NOT a design-system Button, and the reason is
        aria-pressed. v0's ButtonRoot sets `aria-pressed: group ? isSelected :
        undefined` and merges its own attrs AFTER fallthrough, so outside a
        ButtonGroup it overwrites an author's value with undefined and Vue then
        drops the attribute entirely.

        aria-pressed is bound as a STRING for the same family of reason: Vue
        drops an attribute bound to boolean `false`, so the off state would have
        no attribute rather than a false one.

        Only toggles get it. Undo is never "on", so a permanent
        aria-pressed="false" would announce a toggle that cannot be toggled; it
        carries `disabled` instead, which is the state that actually changes.

        @mousedown.prevent keeps focus inside the editor, so the selection the
        command is about to act on still exists when the click lands.
      -->
      <button
        v-else
        type="button"
        class="r-md-toolbar__tool"
        :aria-label="tool.title"
        :title="tool.title"
        :aria-pressed="tool.kind === 'toggle' ? (active[tool.id] ? 'true' : 'false') : undefined"
        :disabled="disabled[tool.id] === true"
        @mousedown.prevent
        @click="tool.run()"
      >
        <component :is="chrome.Icon" v-if="chrome.Icon" :name="tool.icon" :size="16" />
        <span v-else class="r-md-toolbar__fallback">{{ tool.title }}</span>
      </button>
    </template>
  </div>
</template>

<style>
/* Structural toolbar layout. Colours / borders come from the host editor skin. */
.r-md-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.r-md-toolbar--bar {
  padding: 0.25rem;
}

.r-md-toolbar--floating {
  flex-wrap: nowrap;
  padding: 0.25rem;
}

.r-md-toolbar__sep {
  width: 1px;
  height: 18px;
  margin: 0 0.25rem;
}

.r-md-toolbar__tool {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.35rem;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
}

.r-md-toolbar__tool:disabled {
  cursor: default;
  opacity: 0.5;
}

.r-md-toolbar__fallback {
  font-size: 0.7rem;
  line-height: 1;
}
</style>
