import { readonly, ref, shallowRef, type Ref } from 'vue';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paints the confirm action as destructive. */
  destructive?: boolean;
}

/*
 * Module-scoped singleton, matching useTheme's reasoning: there is one dialog on
 * screen at a time, so a second independent copy of this state could only ever
 * disagree with what is rendered. Deliberately not a Pinia store — this must
 * work in @ets/ui without making Pinia a hard dependency.
 */
const request = shallowRef<ConfirmRequest | null>(null);
const open = ref(false);
let settle: ((confirmed: boolean) => void) | null = null;

/**
 * Asks the operator to confirm something, and resolves to their answer.
 *
 * ```ts
 * if (await confirm({ title: 'Delete key?', message: '…', destructive: true })) {
 *   await api.delete(key);
 * }
 * ```
 *
 * Promise-based rather than PrimeVue's `require({ accept, reject })` callback
 * pair: the decision reads in the order it happens, and the work after it stays
 * in the function that started it instead of moving into a callback that has
 * lost its local scope.
 *
 * Requires one <ConfirmHost/> mounted in the app shell.
 */
export function confirm(options: ConfirmRequest): Promise<boolean> {
  // A second request while one is open would strand the first promise forever.
  // Answering it "no" is the safe resolution: the caller treats it as declined
  // and does nothing.
  settle?.(false);

  request.value = options;
  open.value = true;

  return new Promise<boolean>((resolve) => {
    settle = resolve;
  });
}

export interface UseConfirm {
  open: Readonly<Ref<boolean>>;
  request: Readonly<Ref<ConfirmRequest | null>>;
  confirm: typeof confirm;
  /** Host-only: resolves the pending promise and closes. */
  respond: (confirmed: boolean) => void;
}

export function useConfirm(): UseConfirm {
  return {
    open: readonly(open),
    request: readonly(request) as Readonly<Ref<ConfirmRequest | null>>,
    confirm,
    respond(confirmed: boolean) {
      open.value = false;
      settle?.(confirmed);
      settle = null;
      // `request` is deliberately NOT cleared here: the dialog is still on
      // screen for the length of its close transition, and blanking the text
      // first would show an empty box on the way out.
    },
  };
}

/** Test seam — drops any pending request between cases. */
export function __resetConfirmForTests(): void {
  settle?.(false);
  settle = null;
  open.value = false;
  request.value = null;
}
