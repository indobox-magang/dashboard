export const DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES = 2;

/** Heartbeat is online if it is newer than `windowMinutes` (CMS alert-settings). */
export function isDeviceOnline(
  lastHeartbeat?: string | null,
  windowMinutes: number = DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES,
  nowMs: number = Date.now()
): boolean {
  if (!lastHeartbeat) return false;
  const t = new Date(lastHeartbeat).getTime();
  if (Number.isNaN(t)) return false;
  const minutes =
    Number.isFinite(windowMinutes) && windowMinutes > 0
      ? windowMinutes
      : DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES;
  return nowMs - t < minutes * 60_000;
}
