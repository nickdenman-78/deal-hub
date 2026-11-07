/*
 * Live deal updates over SignalR (WebSockets, with SSE or long polling as fallbacks). The API pushes
 * `dealsChanged { dealIds }` once the read model holds the change, so a screen that reloads on it sees the
 * new data. One connection is shared by every deals screen and opened only while at least one is listening.
 */
import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr';
import { onBeforeUnmount, onMounted, readonly, ref } from 'vue';
import { accessToken } from '@/auth/oidc';

/** Changed deal ids, or `null` when notices may have been missed (after a reconnect) and everything should reload. */
export type DealsChangedListener = (dealIds: string[] | null) => void;

const HUB_PATH = '/api/deals/hub';
const RESTART_MS = 15_000;

const listeners = new Set<DealsChangedListener>();
const connected = ref(false);
let connection: HubConnection | undefined;
let restartTimer: ReturnType<typeof setTimeout> | undefined;

/** Whether the live connection is up. While it is down, screens fall back to polling after their own captures. */
export const dealsLive = readonly(connected);

function notify(dealIds: string[] | null) {
  for (const listener of listeners) listener(dealIds);
}

function build(): HubConnection {
  const hub = new HubConnectionBuilder()
    .withUrl(HUB_PATH, { accessTokenFactory: async () => (await accessToken()) ?? '' })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  hub.on('dealsChanged', (message: { dealIds?: string[] }) => notify(message.dealIds ?? null));
  hub.onreconnecting(() => {
    connected.value = false;
  });
  hub.onreconnected(() => {
    connected.value = true;
    notify(null);
  });
  // Automatic reconnect gives up after a few tries; keep trying slowly while a screen still wants updates.
  hub.onclose(() => {
    connected.value = false;
    scheduleRestart();
  });
  return hub;
}

async function start() {
  clearTimeout(restartTimer);
  if (listeners.size === 0) return;
  connection ??= build();
  if (connection.state !== HubConnectionState.Disconnected) return;
  try {
    await connection.start();
    connected.value = true;
  } catch {
    scheduleRestart();
  }
}

function scheduleRestart() {
  clearTimeout(restartTimer);
  if (listeners.size > 0) restartTimer = setTimeout(() => void start(), RESTART_MS);
}

async function stopWhenUnused() {
  if (listeners.size > 0 || !connection) return;
  clearTimeout(restartTimer);
  const hub = connection;
  connection = undefined;
  connected.value = false;
  await hub.stop();
}

/** Calls `listener` whenever deals change, while the calling component is mounted. */
export function useDealsChanged(listener: DealsChangedListener) {
  onMounted(() => {
    listeners.add(listener);
    void start();
  });
  onBeforeUnmount(() => {
    listeners.delete(listener);
    void stopWhenUnused();
  });
}
