"use client";

import { relativeTime } from "@/lib/format";
import type { DeviceRow } from "@/lib/types";
import { Empty } from "./Leaderboard";

export function DeviceList({ devices }: { devices: DeviceRow[] }) {
  if (!devices.length) return <Empty>Belum ada device player terdaftar di CMS.</Empty>;
  return (
    <div>
      {devices.map((d, i) => (
        <div
          key={d.id}
          className={`flex justify-between gap-2.5 py-3 ${
            i === 0 ? "" : "border-t border-[var(--panel-border)]"
          }`}
        >
          <div>
            <b className="text-white">{d.name}</b>
            <small className="mt-0.5 block text-[var(--muted)]">
              {d.site}
              {d.last_heartbeat_at ? ` · ${relativeTime(d.last_heartbeat_at)}` : ""}
            </small>
          </div>
          <span className={`badge h-fit ${d.warn ? "badge-warn" : "badge-ok"}`}>
            {d.status_label}
          </span>
        </div>
      ))}
    </div>
  );
}
