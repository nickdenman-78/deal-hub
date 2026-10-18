import { ref, watch, type Ref } from 'vue';

/**
 * localStorage-backed expand/collapse state for `Tree`'s `v-model:open`.
 *
 * The persistence half of a contract this package owns — the same argument
 * that admitted `usePersistedRowGroups` for `DataTable.openGroups`, and the
 * "revisit if Tree ever grows one" its app-side sibling recorded. Tree grew
 * one; this pairs with it, and the semantics are its sibling's exactly: the
 * first reconcile after restore honours the persisted state without
 * auto-expanding, later ones auto-expand newly-appeared branches and drop
 * vanished ones.
 *
 * Pinia-free on purpose — expansion is view state, not application state.
 */
export interface PersistedTreeExpansionOptions {
  /**
   * localStorage key prefix.
   *
   * An app adopting this MUST pass the prefix it already writes under, or every
   * operator's saved expansion silently resets on first load. config-admin's
   * is `retail-config-server.`.
   */
  storagePrefix?: string;
}

export interface PersistedTreeExpansion {
  /** Bind to `Tree`'s `v-model:open`. */
  expanded: Ref<string[]>;
  /**
   * Call whenever the underlying data set changes, with every currently-valid
   * branch id. See the implementation for the first-call deferral, which is
   * load-bearing.
   */
  reconcile: (currentKeys: Set<string>) => void;
}

const DEFAULT_PREFIX = 'ets.';

export function usePersistedTreeExpansion(
  key: string,
  options: PersistedTreeExpansionOptions = {},
): PersistedTreeExpansion {
  /*
   * `expanded-tree-keys` is the segment config-admin already wrote under; the
   * composable keeps it so adopting the library version does not reset every
   * operator's saved expansion.
   */
  const storageKey = `${options.storagePrefix ?? DEFAULT_PREFIX}expanded-tree-keys.${key}`;

  function read(): string[] {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      // Validated rather than trusted: localStorage is operator-editable.
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) return parsed;
      /*
       * Legacy payload migration: the app-side original persisted a
       * `Record<string, boolean>` under this same key. Accept it once (truthy
       * keys) so the switch to the array shape is invisible to operators; the
       * next write stores the array.
       */
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed as Record<string, unknown>)
          .filter(([, v]) => v === true)
          .map(([k]) => k);
      }
    } catch {
      // Storage disabled, quota exceeded, or corrupt payload. Persistence is a
      // convenience; losing it must never break the tree.
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

  function reconcile(currentKeys: Set<string>) {
    if (!initialised) {
      /*
       * Deferred until data actually arrives. A view watcher with
       * `immediate: true` fires synchronously, BEFORE any async load resolves,
       * so reconciling against an empty Set at that moment would trim every
       * restored entry as "no longer present" and wipe the operator's state
       * before the real first reconcile ever runs.
       */
      if (currentKeys.size === 0) return;

      /*
       * Seed `seen` with everything present PLUS everything still persisted, so
       * the next reconcile cannot re-classify a current branch as "new" and
       * force it open on top of a deliberate collapse.
       */
      seen = new Set<string>(currentKeys);
      for (const e of expanded.value) seen.add(e);
      expanded.value = expanded.value.filter((k) => currentKeys.has(k));
      initialised = true;
      return;
    }

    // Branches minted during the session — a project created a moment ago —
    // open automatically. Anything that has vanished drops out.
    const additions: string[] = [];
    for (const k of currentKeys) if (!seen.has(k)) additions.push(k);
    if (additions.length > 0) expanded.value = [...expanded.value, ...additions];
    expanded.value = expanded.value.filter((k) => currentKeys.has(k));
    seen = currentKeys;
  }

  return { expanded, reconcile };
}
