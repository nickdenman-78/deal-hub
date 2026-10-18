<script setup lang="ts">
/**
 * Showcase command search: button in the topbar opens a Popover of every
 * specimen leaf. Ctrl/Cmd+K registers with the shared @ets/ui focus-shortcut
 * registry so it cycles with any page-level `focusShortcut` fields.
 */
import { Icon, Input, Popover, focusField } from '@ets/ui';
import { registerFocusShortcut } from '@ets/ui/composables/focusShortcutRegistry';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { searchItems, type SearchItem } from '../nav';

const router = useRouter();
const open = ref(false);
const query = ref('');
const activeIndex = ref(0);
const inputRef = ref<unknown>(null);
const triggerRef = ref<HTMLElement | null>(null);

const items = searchItems();

const shortcutLabel = /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl+K';

const results = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const hay = [item.title, item.section, item.group, item.path].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
});

watch(results, () => {
  activeIndex.value = 0;
});

watch(open, async (isOpen) => {
  if (!isOpen) {
    query.value = '';
    activeIndex.value = 0;
    return;
  }
  await nextTick();
  focusField(inputRef, { select: true });
});

function contextLabel(item: SearchItem): string {
  return item.group ? `${item.section} · ${item.group}` : item.section;
}

function go(item: SearchItem): void {
  open.value = false;
  void router.push(item.path);
}

function moveActive(delta: number): void {
  const count = results.value.length;
  if (count === 0) return;
  activeIndex.value = (activeIndex.value + delta + count) % count;
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveActive(1);
    return;
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveActive(-1);
    return;
  }
  if (event.key === 'Enter') {
    const item = results.value[activeIndex.value];
    if (!item) return;
    event.preventDefault();
    go(item);
  }
}

let unregister: (() => void) | undefined;

onMounted(() => {
  unregister = registerFocusShortcut({
    getElement: () => triggerRef.value,
    focus: () => {
      open.value = true;
      void nextTick(() => focusField(inputRef, { select: true }));
    },
  });
});

onBeforeUnmount(() => {
  unregister?.();
  unregister = undefined;
});
</script>

<template>
  <Popover v-model:open="open" label="Search showcase" position-area="bottom span-left">
    <template #trigger>
      <span ref="triggerRef" class="sb__search-trigger">
        <Icon name="search" :size="16" />
        <span>Search</span>
        <kbd class="sb__search-kbd">{{ shortcutLabel }}</kbd>
      </span>
    </template>

    <template #default="{ close }">
      <div class="sb__search" @keydown="onInputKeydown">
        <Input
          ref="inputRef"
          v-model="query"
          label="Search components"
          icon="search"
          placeholder="Button, DataTable, blades…"
          size="sm"
          clearable
          autocomplete="off"
        />

        <ul v-if="results.length > 0" class="sb__search-list" role="listbox" aria-label="Search results">
          <li v-for="(item, index) in results" :key="item.path" role="option" :aria-selected="index === activeIndex">
            <button
              type="button"
              class="sb__search-item"
              :class="{ 'is-active': index === activeIndex }"
              @click="
                go(item);
                close();
              "
              @mouseenter="activeIndex = index"
            >
              <span class="sb__search-item-title">{{ item.title }}</span>
              <span class="sb__search-item-meta">{{ contextLabel(item) }}</span>
            </button>
          </li>
        </ul>

        <p v-else class="sb__search-empty">No components match “{{ query.trim() }}”.</p>
      </div>
    </template>
  </Popover>
</template>
