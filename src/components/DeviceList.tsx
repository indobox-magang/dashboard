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
            i === 0 ? "" : "border-t border-[var(--line)]"
          }`}
        >
          <div>
            <b>{d.name}</b>
            <small className="mt-0.5 block text-[var(--muted)]">
              {d.site}
              {d.hostname ? ` · ${d.hostname}` : ""}
              {d.last_heartbeat_at ? ` · ${relativeTime(d.last_heartbeat_at)}` : ""}
            </small>
            {d.current_show_title || d.agent_version ? (
              <small className="mt-0.5 block text-[11px] text-[var(--muted)]">
                {d.current_show_title ? `Show: ${d.current_show_title}` : null}
                {d.current_show_title && d.agent_version ? " · " : null}
                {d.agent_version ? `agent ${d.agent_version}` : null}
              </small>
            ) : null}
          </div>
          <span
            className={`h-fit rounded-full px-2 py-1 text-[11px] font-extrabold ${
              d.warn ? "bg-[#fff0d2] text-[#985a02]" : "bg-[#e3f7ef] text-[#08745d]"
            }`}
          >
            {d.status_label}
          </span>
        </div>
      ))}
    </div>
  );
}
