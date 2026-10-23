import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getMe, type Me } from '@/api/me';

/**
 * The signed-in caller as the API describes them. Loaded once per session by
 * the auth guard; `can()` drives what the shell shows, never what is allowed.
 */
export const useSessionStore = defineStore('session', () => {
  const me = ref<Me | null>(null);
  let pending: Promise<void> | null = null;

  const permissions = computed(() => new Set(me.value?.permissions ?? []));

  function can(permission: string): boolean {
    return permissions.value.has(permission);
  }

  function load(): Promise<void> {
    if (me.value) return Promise.resolve();
    pending ??= getMe()
      .then((value) => {
        me.value = value;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  function reset(): void {
    me.value = null;
  }

  return { me, can, load, reset };
});
