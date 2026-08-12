"use client";

import { toast } from "@/components/Toast";
import { NotInCms } from "@/components/NotInCms";
import { useDashboard } from "@/hooks/useDashboardSummary";
import type { Alert } from "@/lib/types";
import { Empty } from "./Leaderboard";

export function AlertList({
  alerts,
  onDismiss,
}: {
  alerts: Alert[];
  onDismiss: (index: number) => void;
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
          <button
            type="button"
            className="btn-ghost self-start text-[11px] text-[var(--accent)]"
            onClick={() => {
              onDismiss(i);
              toast(`Alert “${x.title}” telah diakui.`);
            }}
          >
            {x.action}
          </button>
        </div>
      ))}
    </>
  );
}

export function ActionNeededPanel() {
  const { alerts, dismissAlert } = useDashboard();
  return (
    <article className="card mt-4 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div>
          <h2 className="m-0 text-base text-white">Action Needed</h2>
          <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
            Alert dihitung dari data CMS · acknowledgement lokal <NotInCms />
          </p>
        </div>
        <span className="text-xs font-extrabold text-[var(--danger)]">
          {alerts.length} alert terbuka
        </span>
      </div>
      <AlertList alerts={alerts} onDismiss={dismissAlert} />
    </article>
  );
}

export function LoadingState() {
  return <Empty>Memuat data dari indobox-cms…</Empty>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="notice mb-5" role="alert">
      ⚠ <span>{message}</span>
    </div>
  );
}
