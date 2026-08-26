"use client";

import Link from "next/link";
import { DataFreshnessBadge, SeedBadge } from "@/components/DataBadges";
import { relativeTime } from "@/lib/format";
import type { DeviceRow } from "@/lib/types";
import { Empty } from "./Leaderboard";

export function DeviceList({ devices }: { devices: DeviceRow[] }) {
  if (!devices.length) return <Empty>Belum ada device player terdaftar di CMS.</Empty>;
  return (
    <div>
      {devices.map((d, i) => (
        <Link
          key={d.id}
          href={`/devices/${d.id}`}
          className={`flex justify-between gap-2.5 py-3 no-underline transition hover:bg-white/[0.03] ${
            i === 0 ? "" : "border-t border-[var(--panel-border)]"
          }`}
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-white">{d.name}</b>
              <SeedBadge values={[d.name]} />
            </div>
            <small className="mt-0.5 block text-[var(--muted)]">
              {d.site}
              {d.last_heartbeat_at ? ` · ${relativeTime(d.last_heartbeat_at)}` : ""}
            </small>
            <small className={d.playback_error ? "text-[var(--danger)]" : "text-slate-400"}>
              {d.playback_error
                ? `Error: ${d.playback_error}`
                : `Playback: ${d.playback_status || "unknown"}`}
            </small>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className={`badge h-fit ${d.warn ? "badge-warn" : "badge-ok"}`}>
              {d.status_label}
            </span>
            <DataFreshnessBadge
              timestamp={d.last_heartbeat_at}
              delayedAfterMs={120_000}
              staleAfterMs={15 * 60_000}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
