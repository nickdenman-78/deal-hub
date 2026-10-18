<script setup lang="ts">
/**
 * Showcase-only API surface for a leaf page. Not duplicated under Specimen —
 * light/dark would just print the same table twice.
 */
import type { PropDoc } from '../apiDocs';

withDefaults(
  defineProps<{
    title?: string;
    note?: string;
    rows: readonly PropDoc[];
  }>(),
  { title: 'Props', note: undefined },
);
</script>

<template>
  <section class="sb__section sb__api">
    <h3>{{ title }}</h3>
    <p v-if="note">{{ note }}</p>

    <div class="sb__api-scroll">
      <table class="sb__api-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td>
              <code>{{ row.name }}</code>
            </td>
            <td>
              <code class="sb__api-type">{{ row.type }}</code>
            </td>
            <td>
              <code v-if="row.default !== undefined">{{ row.default }}</code>
              <span v-else class="sb__api-empty">—</span>
            </td>
            <td>{{ row.notes ?? '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
