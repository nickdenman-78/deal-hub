<script setup lang="ts">
import { Blade, BladeAside, BladeLink, Button, Input, Tag } from '@ets/ui';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const id = computed(() => route.params.id as string);

const notes = ref('');
const settingsOpen = ref(false);
const deleteOpen = ref(false);
const confirmPhrase = ref('');

// Any typing marks the blade dirty, which arms the stack's discard guard.
const dirty = computed(() => notes.value.length > 0);
</script>

<template>
  <Blade :title="`Deal ${id}`" subtitle="Executed · QLD" size="lg" :dirty="dirty">
    <template #actions>
      <Button variant="text" size="sm" icon="settings" aria-label="View options" @click="settingsOpen = true" />
    </template>

    <div class="demo-stack">
      <div class="sb__row">
        <Tag severity="success" icon="circle-check">Executed</Tag>
        <Tag severity="info">Baseload</Tag>
      </div>

      <Input v-model="notes" label="Desk notes" description="Type anything to mark this blade dirty." />

      <p v-if="dirty" class="demo-hint">
        This blade is now dirty. Try clicking another deal, or the browser's back button.
      </p>

      <nav>
        <BladeLink :to="`/patterns/blade-stack/${id}/terms`">Terms</BladeLink>
        <BladeLink :to="`/patterns/blade-stack/${id}/settlement`">Settlement</BladeLink>
      </nav>
    </div>

    <RouterView />

    <template #footer>
      <Button size="sm" severity="error" icon="trash-2" @click="deleteOpen = true">Delete</Button>
      <Button size="sm" variant="outlined">Discard</Button>
      <Button size="sm" severity="primary">Save</Button>
    </template>
  </Blade>

  <!-- Docks to the trailing edge of the whole viewport, not to this panel —
       which is why it teleports rather than rendering in place.

       NON-MODAL: no scrim, and it dismisses as soon as focus leaves. A pane the
       reader has plainly moved on from should not need dismissing by hand. -->
  <BladeAside :open="settingsOpen" title="View options" @close="settingsOpen = false">
    <p>An aside is view state: no address, and it does not survive a reload.</p>
    <p>Click a blade behind this pane — it closes itself, because focus left.</p>
    <template #footer>
      <Button size="sm" variant="outlined" @click="settingsOpen = false">Done</Button>
    </template>
  </BladeAside>

  <!-- MODAL: draws a scrim over the stack, keeps Tab inside, and does NOT
       dismiss on focus-out — leaving is the thing being prevented. Reserved for
       a question that has to be answered before anything else happens.

       Focus lands on the input rather than the ✕: on a confirmation the field
       is what the reader came to use, and starting on the close button means
       tabbing past the very thing being asked about. -->
  <BladeAside :open="deleteOpen" title="Delete deal" modal @close="deleteOpen = false">
    <div class="demo-stack">
      <p>
        This removes <strong>Deal {{ id }}</strong> and every term under it. It cannot be undone.
      </p>
      <Input v-model="confirmPhrase" label="Type DELETE to confirm" placeholder="DELETE" />
      <p class="demo-hint">Tab repeatedly — focus wraps inside this pane rather than escaping to the stack.</p>
    </div>
    <template #footer>
      <Button size="sm" variant="outlined" @click="deleteOpen = false">Cancel</Button>
      <Button size="sm" severity="error" :disabled="confirmPhrase !== 'DELETE'" @click="deleteOpen = false">
        Delete deal
      </Button>
    </template>
  </BladeAside>
</template>

<style scoped>
.demo-stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.demo-hint {
  padding: var(--sp-2);
  border-radius: var(--r-sm);
  background: var(--warning-soft);
  color: var(--warning-ink);
  font-size: var(--fs-sm);
}
</style>
