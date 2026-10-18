import { ref, watch, type Ref } from 'vue';

/**
 * localStorage-backed expand/collapse state for `DataTable`'s `openGroups`
 * model.
 *
 * This is the persistence half of a contract the package already owns: the
 * shape it produces (an array of group keys) is exactly what `DataTable`
 * v-models, and `DataTable` deliberately exposes that as a model rather than
 * keeping it private so the app can decide where it lives. This is the answer
 * to "where", offered once so every table remembers itself the same way.
 *
 * Pinia-free on purpose — expansion is view state, not application state, and
 * making this package depend on a store for it would be a hard dependency
 * bought for nothing.
 */
export interface PersistedRowGroupsOptions {
  /**
   * localStorage key prefix.
   *
   * An app adopting this MUST pass the prefix it already writes under, or every
   * operator's saved expansion silently resets on first load — the same trap
   * `bootstrapTheme`'s `storageKey` note records. config-admin's is
   * `retail-config-server.`.
   */
  storagePrefix?: string;
}

export interface PersistedRowGroups {
  /** Bind to `DataTable`'s `v-model:open-groups`. */
  expanded: Ref<string[]>;
  /**
   * Call whenever the underlying data set changes. See the implementation for
   * the first-call deferral, which is load-bearing.
   */
  reconcile: (currentGroups: Set<string>) => void;
}

const DEFAULT_PREFIX = 'ets.';

export function usePersistedRowGroups(key: string, options: PersistedRowGroupsOptions = {}): PersistedRowGroups {
  const storageKey = `${options.storagePrefix ?? DEFAULT_PREFIX}expanded-row-groups.${key}`;

  function read(): string[] {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Validated rather than trusted: localStorage is operator-editable, and a
      // half-written payload would otherwise reach the table as row keys.
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
    } catch {
      // Storage disabled, quota exceeded, or corrupt payload. Persistence is a
      // convenience; losing it must never break the table.
    }
    return [];
  }

  function write(value: string[]) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Same — silently drop.
    }
  }

  const expanded = ref<string[]>(read());
  let initialised = false;
  let seen = new Set<string>();

  watch(expanded, (next) => write(next), { deep: true });

  function reconcile(currentGroups: Set<string>) {
    if (!initialised) {
      /*
       * Deferred until data actually arrives. A view watcher with
       * `immediate: true` fires synchronously, BEFORE any async load resolves,
       * so reconciling against an empty Set at that moment would trim every
       * restored entry as "no longer present" and wipe the operator's state
       * before the real first reconcile ever runs.
       */
      if (currentGroups.size === 0) return;

      /*
       * Seed `seen` with everything present PLUS everything still persisted, so
       * the next reconcile cannot re-classify a current group as "new" and
       * force it open on top of a deliberate collapse.
       */
      seen = new Set<string>(currentGroups);
      for (const e of expanded.value) seen.add(e);
      expanded.value = expanded.value.filter((g) => currentGroups.has(g));
      initialised = true;
      return;
    }

    // Groups minted during the session — a category created a moment ago —
    // open automatically. Anything that has vanished drops out.
    const additions: string[] = [];
    for (const g of currentGroups) if (!seen.has(g)) additions.push(g);
    if (additions.length > 0) expanded.value = [...expanded.value, ...additions];
    expanded.value = expanded.value.filter((g) => currentGroups.has(g));
    seen = currentGroups;
  }

  return { expanded, reconcile };
}
