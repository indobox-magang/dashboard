import { normalizePlaybackStatus } from "./dashboardMeta";
import type { AssetRow, BookingRow, DeviceAdminRow, DeviceRow, ShowRow, StorageStats } from "./types";

function heartbeatOnline(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) return false;
  const t = new Date(lastHeartbeat).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 120_000;
}

export type CheckInMetrics = {
  paid: number;
  used: number;
  eligible: number;
  check_in_pct: number;
  no_show: number;
  awaiting: number;
};

export type NowPlayingItem = {
  key: string;
  title: string;
  site: string;
  screen?: string;
  device?: string;
  href?: string;
};

export type ShowStatusMetrics = {
  scheduled: number;
  done: number;
  cancelled: number;
  overdue: number;
  completion_pct: number;
};

export type AgentVersionRow = {
  version: string;
  count: number;
  majority: boolean;
};

export function checkInMetrics(bookings: BookingRow[], now = Date.now()): CheckInMetrics {
  const paid = bookings.filter((b) => b.status?.toLowerCase() === "paid");
  const used = bookings.filter((b) => b.status?.toLowerCase() === "used");
  const eligible = paid.length + used.length;
  const noShow = paid.filter((b) => {
    const start = new Date(b.start_time).getTime();
    return !Number.isNaN(start) && start < now;
  }).length;
  return {
    paid: paid.length,
    used: used.length,
    eligible,
    check_in_pct: eligible ? (used.length / eligible) * 100 : 0,
    no_show: noShow,
    awaiting: paid.length - noShow,
  };
}

export function nowPlayingItems(
  shows: ShowRow[],
  devices: Array<DeviceAdminRow | DeviceRow>
): NowPlayingItem[] {
  const fromShows = shows
    .filter((show) => show.is_playing)
    .map((show) => ({
      key: `show-${show.id}`,
      title: show.title,
      site: show.site_name,
      screen: show.screen_name,
    }));

  const fromDevices = devices
    .filter((device) => {
      const status = normalizePlaybackStatus(device.playback_status);
      const title = "current_show_title" in device ? device.current_show_title : undefined;
      return status === "playing" && Boolean(title);
    })
    .map((device) => {
      const admin = device as DeviceAdminRow;
      const summary = device as DeviceRow;
      return {
        key: `device-${device.id}`,
        title: admin.current_show_title || "Sedang tayang",
        site: admin.site || summary.site,
        device: device.name,
        href: `/devices/${device.id}`,
      };
    });

  const seen = new Set<string>();
  const merged: NowPlayingItem[] = [];
  for (const item of [...fromShows, ...fromDevices]) {
    const token = `${item.site}|${item.title}`.toLowerCase();
    if (seen.has(token)) continue;
    seen.add(token);
    merged.push(item);
  }
  return merged;
}

export function showStatusMetrics(shows: ShowRow[], now = Date.now()): ShowStatusMetrics {
  const scheduled = shows.filter((s) => s.status === "scheduled");
  const done = shows.filter((s) => s.status === "done");
  const cancelled = shows.filter((s) => s.status === "cancelled");
  const overdue = scheduled.filter((s) => {
    const start = new Date(s.starts_at).getTime();
    return !Number.isNaN(start) && start < now;
  }).length;
  const denom = done.length + cancelled.length + overdue;
  return {
    scheduled: scheduled.length,
    done: done.length,
    cancelled: cancelled.length,
    overdue,
    completion_pct: denom ? (done.length / denom) * 100 : 0,
  };
}

export function agentVersionRows(devices: DeviceAdminRow[]): AgentVersionRow[] {
  const counts = new Map<string, number>();
  for (const device of devices) {
    const version = device.agent_version?.trim() || "Tidak dilaporkan";
    counts.set(version, (counts.get(version) || 0) + 1);
  }
  const rows = [...counts.entries()]
    .map(([version, count]) => ({ version, count, majority: false }))
    .sort((a, b) => b.count - a.count);
  if (rows[0]) rows[0].majority = rows[0].version !== "Tidak dilaporkan";
  return rows;
}

export function pendingPairingCount(devices: DeviceAdminRow[]): number {
  return devices.filter((d) => d.status === "pending").length;
}

export function failedAssetCount(assets: AssetRow[]): number {
  return assets.filter((a) => a.status === "failed").length;
}

export function pipelineAssetCount(assets: AssetRow[]): number {
  return assets.filter((a) =>
    ["uploading", "verifying", "encrypting"].includes(a.status)
  ).length;
}

export function verifiedFeatureCount(assets: AssetRow[]): number {
  return assets.filter(
    (a) => a.kind === "feature" && ["verified", "encrypting", "verifying"].includes(a.status)
  ).length;
}

export function storageShare(stats: StorageStats) {
  const total = Math.max(1, stats.total_size_bytes || 0);
  return (stats.breakdown || []).map((row) => ({
    ...row,
    pct: ((row.total_size_bytes || 0) / total) * 100,
  }));
}

export function onlineDeviceCount(devices: DeviceAdminRow[]): number {
  return devices.filter((d) => heartbeatOnline(d.last_heartbeat_at)).length;
}
