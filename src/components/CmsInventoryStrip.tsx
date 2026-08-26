"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { formatBytes, isDeviceOnline, useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { verifiedFeatureCount } from "@/lib/opsMetrics";

/** Quiet inventory counts so KPI bisnis tetap jadi fokus Command Center. */
export function CmsInventoryStrip() {
  const { data: summary } = useDashboard();
  const { data, loading } = useCmsSnapshot();

  if (loading && !data) {
    return <div className="compact-meta h-[48px] animate-pulse" />;
  }

  if (!data) return null;

  const online = data.devices.filter((d) => isDeviceOnline(d.last_heartbeat_at)).length;
  const scheduled = data.shows.filter((s) => s.status === "scheduled").length;
  const empty = !data.sites.length;

  return (
    <>
      {empty ? (
        <div className="notice">
          <span>
            Database CMS masih kosong. Buka <b>Data CMS</b> atau buat Branches / Schedules di
            indobox-cms agar angka bisnis terisi.
          </span>
        </div>
      ) : null}
      <div className="compact-meta">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span className="compact-meta-item">
            <b>{data.sites.length || summary?.sites.length || 0}</b> cabang
          </span>
          <span className="compact-meta-item">
            <b>{data.screens.length}</b> layar
          </span>
          <span className="compact-meta-item">
            <b>{online}</b>/{data.devices.length} device
          </span>
          <span className="compact-meta-item">
            <b>{scheduled}</b> jadwal
          </span>
          <span className="compact-meta-item">
            <b>{verifiedFeatureCount(data.assets)}</b> film
          </span>
          <span className="compact-meta-item">
            <b>{formatBytes(data.storage.total_size_bytes || 0)}</b>
          </span>
        </div>
        <Link href="/cms" className="text-xs font-semibold text-[var(--accent)] no-underline">
          Data CMS →
        </Link>
      </div>
    </>
  );
}
