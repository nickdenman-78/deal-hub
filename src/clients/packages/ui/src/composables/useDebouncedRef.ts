import { onScopeDispose, ref, watch, type Ref } from 'vue';

/**
 * A ref that mirrors `source` but defers updates until `delayMs` of quiescence.
 *
 * Keeps a text input responsive on every keystroke while pushing the expensive
 * downstream reaction — filtering a large list, re-laying-out a grouped table —
 * to a single tick after the operator stops typing.
 *
 * The initial value echoes the source SYNCHRONOUSLY rather than after a delay,
 * so a session-restored filter shows its results immediately instead of
 * appearing to load for `delayMs` on mount.
 *
 * The `onScopeDispose` cleanup is the part worth having written once: without
 * it a pending timer fires after the component is gone and writes to a ref
 * nothing is watching, which is harmless until the callback closes over
 * something that has been torn down.
 */
export function useDebouncedRef<T>(source: Ref<T>, delayMs: number): Ref<T> {
  const debounced = ref(source.value) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const stop = watch(source, (next) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      debounced.value = next;
    }, delayMs);
  });

  onScopeDispose(() => {
    if (timer) clearTimeout(timer);
    stop();
  });

  return debounced;
}
