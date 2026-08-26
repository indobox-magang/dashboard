import { DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES, isDeviceOnline } from "./deviceOnline";
import type { DeviceRow } from "./types";

export { isDeviceOnline, DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES } from "./deviceOnline";

export type CmsSite = {
  id: number;
  code: string;
  name: string;
  timezone?: string;
  city?: string;
  address?: string;
  active?: boolean;
};

export type CmsScreen = {
  id: number;
  site_id: number;
  site_name: string;
  name: string;
  rows?: number;
  cols?: number;
  aisle_after?: number | null;
};

export type CmsDevice = {
  id: number;
  site_id: number;
  site: string;
  name: string;
  status?: string;
  hostname?: string;
  screens?: number[];
  last_heartbeat_at?: string;
  playback_status?: string;
  current_show_id?: number;
  current_show_title?: string;
  current_asset_id?: number;
  playback_error?: string;
  agent_version?: string;
  agent_git_sha?: string;
};

export type CmsShow = {
  id: number;
  screen_id: number;
  screen_name: string;
  site_id?: number;
  site_name: string;
  starts_at: string;
  ends_at: string;
  title: string;
  status: string;
  price?: number;
  show_no?: number;
  booking_enabled?: boolean;
  is_playing?: boolean;
};

export type CmsAsset = {
  id: number;
  kind: string;
  title: string;
  status: string;
  genre?: string;
  rating?: string;
  release_date?: string;
  booking_status?: string;
};

export type CmsSnack = {
  id: string;
  name: string;
  size?: string;
  price: number;
  category?: string;
  available: number;
  sort?: number;
};

export type CmsBooking = {
  id: string;
  code: string;
  status: string;
  total: number;
  created_at: string;
  paid_at?: string | null;
  user_name: string;
  email?: string | null;
  movie_title: string;
  start_time: string;
  city: string;
};

export type CmsEndpointStatus = {
  key: string;
  ok: boolean;
  error?: string;
  count?: number;
};

export type CmsCatalog = {
  sites: CmsSite[];
  screens: CmsScreen[];
  devices: CmsDevice[];
  shows: CmsShow[];
  assets: CmsAsset[];
  snacks: CmsSnack[];
  bookings: CmsBooking[];
  healthOk: boolean | null;
  endpoints: CmsEndpointStatus[];
  loading: boolean;
  error: string | null;
};

export function mapDeviceToRow(
  d: CmsDevice,
  windowMinutes: number = DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES
): DeviceRow {
  const online = isDeviceOnline(d.last_heartbeat_at, windowMinutes);
  const playback = (d.playback_status || "").toLowerCase();
  const hasError =
    Boolean(d.playback_error) || playback === "error" || playback === "stalled";
  let statusLabel = online ? "Online" : "Offline";
  if (online && playback && playback !== "idle") statusLabel = d.playback_status || statusLabel;
  return {
    id: d.id,
    name: d.name,
    site: d.site,
    online,
    last_heartbeat_at: d.last_heartbeat_at ?? null,
    playback_status: d.playback_status,
    playback_error: d.playback_error,
    status_label: statusLabel,
    warn: !online || hasError,
    hostname: d.hostname,
    current_show_title: d.current_show_title,
    agent_version: d.agent_version,
  };
}

export function deviceHealth(
  devices: CmsDevice[],
  windowMinutes: number = DEFAULT_DEVICE_ONLINE_WINDOW_MINUTES
) {
  const onlineN = devices.filter((d) =>
    isDeviceOnline(d.last_heartbeat_at, windowMinutes)
  ).length;
  const total = devices.length;
  const offline = total - onlineN;
  const onlinePct = total > 0 ? (100 * onlineN) / total : 0;
  return { onlineN, offline, onlinePct, total };
}
