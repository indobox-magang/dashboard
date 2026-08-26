"use client";

import Link from "next/link";
import { toast } from "@/components/Toast";
import { NotInCms } from "@/components/NotInCms";
import { useDashboard } from "@/hooks/useDashboardSummary";
import type { Alert } from "@/lib/types";
import { Empty } from "./Leaderboard";

export function AlertList({
  alerts,
  onDismiss,
  hrefFor,
}: {
  alerts: Alert[];
  onDismiss: (index: number) => void;
  hrefFor?: (alert: Alert) => string;
}) {
  if (!alerts.length) {
    return (
      <div className="grid grid-cols-[9px_1fr] gap-3 border-t border-[var(--panel-border)] px-5 py-4">
        <i className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
        <div>
          <h3 className="m-0 text-[13px] text-white">Semua alert telah ditangani</h3>
          <p className="m-0 mt-1 text-xs text-[var(--muted)]">
            Tidak ada masalah terbuka dari data CMS saat ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {alerts.map((x, i) => (
        <div
          key={`${x.title}-${i}`}
          className="grid grid-cols-[9px_1fr_auto] gap-3 border-t border-[var(--panel-border)] px-5 py-4"
        >
          <i
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              x.level === "high" ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
            }`}
          />
          <div>
            <h3 className="m-0 text-[13px] text-white">{x.title}</h3>
            <p className="m-0 mt-1 text-xs text-[var(--muted)]">{x.detail}</p>
            <span className="text-[10px] font-extrabold tracking-wide text-[var(--accent)]">
              {x.level === "high" ? "PRIORITAS TINGGI" : "PRIORITAS MENENGAH"}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {hrefFor ? (
              <Link
                href={hrefFor(x)}
                className="btn-ghost text-[11px] text-[var(--accent)] no-underline"
              >
                Lihat detail
              </Link>
            ) : null}
            <button
              type="button"
              className="btn-ghost text-[11px]"
              title={x.action}
              onClick={() => {
                onDismiss(i);
                toast(`Alert “${x.title}” diakui untuk sesi browser ini.`);
              }}
            >
              Akui lokal
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

export function ActionNeededPanel() {
  const { alerts, dismissAlert, data } = useDashboard();
  const hrefFor = (alert: Alert) => {
    const haystack = `${alert.title} ${alert.detail}`.toLowerCase();
    const device = data?.devices.find((item) => haystack.includes(item.name.toLowerCase()));
    if (device) return `/devices/${device.id}`;
    const branch = data?.branches.find((item) => haystack.includes(item.name.toLowerCase()));
    if (branch) return `/branches/${branch.site_id}`;
    if (haystack.includes("device") || haystack.includes("player")) return "/operations";
    if (haystack.includes("snack") || haystack.includes("f&b")) return "/fnb";
    if (haystack.includes("film") || haystack.includes("okupansi")) return "/optimizer";
    return "/command";
  };
  return (
    <article className="card overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div>
          <h2 className="m-0 text-[15px] font-semibold text-white">Action Needed</h2>
          <p className="mt-1 mb-0 text-xs leading-relaxed text-[var(--muted)]">
            Sinyal CMS · acknowledgement hanya di browser ini <NotInCms />
          </p>
        </div>
        <span className="text-xs font-extrabold text-[var(--danger)]">
          {alerts.length} alert terbuka
        </span>
      </div>
      <AlertList alerts={alerts} onDismiss={dismissAlert} hrefFor={hrefFor} />
    </article>
  );
}

export function LoadingState() {
  return <Empty>Memuat data dari indobox-cms…</Empty>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="notice" role="alert">
      ⚠ <span>{message}</span>
    </div>
  );
}
