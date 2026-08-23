"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { formatBytes, isDeviceOnline, useCmsSnapshot } from "@/hooks/useCmsSnapshot";

/** Compact strip of live CMS inventory counts for Command Center. */
export function CmsInventoryStrip() {
  const { data: summary } = useDashboard();
  const { data, loading } = useCmsSnapshot();

  if (loading && !data) {
    return (
      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="health-tile h-[76px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const online = data.devices.filter((d) => isDeviceOnline(d.last_heartbeat_at)).length;
  const empty = !data.sites.length;

  return (
    <>
      {empty ? (
        <div className="notice mb-4">
          ℹ{" "}
          <span>
            Database CMS masih kosong (0 cabang). Buka menu <b>Data CMS</b> atau buat Branches /
            Schedules / Bookings di indobox-cms agar angka bisnis terisi.
          </span>
        </div>
      ) : null}
      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2">
        {[
          {
            label: "Branches",
            value: String(data.sites.length || summary?.sites.length || 0),
          },
          { label: "Screens", value: String(data.screens.length) },
          {
            label: "Devices",
            value: String(data.devices.length),
            sub: data.devices.length ? `${online} online` : undefined,
          },
          {
            label: "Storage",
            value: formatBytes(data.storage.total_size_bytes || 0),
            sub: `${data.storage.total_count || 0} objects`,
          },
        ].map((k) => (
          <div key={k.label} className="health-tile">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {k.label}
            </span>
            <b className="mt-1.5 block text-2xl text-white">{k.value}</b>
            {k.sub ? (
              <span className="text-xs font-semibold text-[var(--success)]">{k.sub}</span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/cms" className="btn-primary no-underline">
          Lihat Data CMS
        </Link>
        <span className="self-center text-xs text-[var(--muted)]">
          Bookings {data.bookings.length} · Shows {data.shows.length} · Promo aktif{" "}
          {data.promos.filter((p) => p.active === 1).length} · Film verified {data.assets.length}
        </span>
      </div>
    </>
  );
}
