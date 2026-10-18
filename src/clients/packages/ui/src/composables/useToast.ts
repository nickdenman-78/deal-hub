import { useNotifications, type NotificationSeverity } from '@vuetify/v0';
import { computed, type ComputedRef } from 'vue';
import type { StatusSeverity } from '../severity';

export type ToastSeverity = StatusSeverity;

export interface ToastInput {
  severity?: ToastSeverity;
  /** Headline. */
  summary: string;
  /** Optional second line. */
  detail?: string;
  /** Auto-dismiss in ms. Omit for the severity's default. */
  life?: number;
}

export interface EtsToast {
  id: string | number;
  severity: ToastSeverity;
  summary: string;
  detail?: string;
  dismiss: () => void;
}

/**
 * v0's queue treats a NEGATIVE timeout as "never auto-dismiss":
 *
 *   if (isUndefined(ticket.timeout) || ticket.timeout < 0 || ticket.isPaused) return
 *
 * Zero is not that — zero schedules a 0ms timer, so a toast given `0` vanishes
 * on the next tick, which is the exact opposite of sticky and looks like the
 * toast never appeared at all.
 */
const NEVER = -1;

/**
 * Errors do not auto-dismiss.
 *
 * A toast that reports a failure is usually the only record of it, and a
 * 3-second one is gone before an operator has finished reading the sentence,
 * let alone copying an id out of it. Successes are the opposite: they confirm
 * something already visible on screen, so they should get out of the way.
 */
const DEFAULT_LIFE: Record<ToastSeverity, number> = {
  success: 3000,
  info: 4000,
  warning: 6000,
  error: NEVER,
};

export interface UseToast {
  add: (input: ToastInput) => void;
  success: (summary: string, detail?: string) => void;
  info: (summary: string, detail?: string) => void;
  warn: (summary: string, detail?: string) => void;
  error: (summary: string, detail?: string) => void;
  /** Live toasts, oldest first. For the host component. */
  toasts: ComputedRef<EtsToast[]>;
  clear: () => void;
}

/**
 * Toast notifications, on v0's notifications plugin.
 *
 * Requires `app.use(createNotificationsPlugin())` and one <ToastHost/> mounted
 * in the app shell. v0 ships a null-object fallback when the plugin is missing,
 * so a forgotten install shows nothing rather than throwing — which is worth
 * knowing when a toast mysteriously does not appear.
 *
 * `add()` mirrors the shape config-admin already calls with
 * ({ severity, summary, detail, life }), so migrating those call sites is a
 * change of import rather than a rewrite.
 */
export function useToast(): UseToast {
  const notifications = useNotifications();

  const toasts = computed<EtsToast[]>(() =>
    notifications.queue
      .values()
      .map((entry) => notifications.get(entry.id))
      .filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== undefined)
      .map((ticket) => ({
        id: ticket.id,
        severity: (ticket.severity ?? 'info') as ToastSeverity,
        summary: ticket.subject ?? '',
        detail: ticket.body,
        dismiss: () => ticket.dismiss(),
      })),
  );

  function add(input: ToastInput) {
    const severity = input.severity ?? 'info';
    const life = input.life ?? DEFAULT_LIFE[severity];

    notifications.send({
      subject: input.summary,
      body: input.detail,
      // v0's severity vocabulary is the same four words, so this passes
      // straight through rather than needing a map.
      severity: severity as NotificationSeverity,
      // `life: 0` is normalised to NEVER rather than passed through. Callers
      // reasonably read 0 as "no expiry", and letting it reach v0 as a 0ms
      // timer would dismiss the toast instantly instead.
      timeout: life <= 0 ? NEVER : life,
    });
  }

  return {
    add,
    toasts,
    success: (summary, detail) => add({ severity: 'success', summary, detail }),
    info: (summary, detail) => add({ severity: 'info', summary, detail }),
    warn: (summary, detail) => add({ severity: 'warning', summary, detail }),
    error: (summary, detail) => add({ severity: 'error', summary, detail }),
    clear: () => notifications.queue.clear(),
  };
}
