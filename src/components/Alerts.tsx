"use client";

import { toast } from "@/components/Toast";
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
      <div className="grid grid-cols-[9px_1fr] gap-3 border-t border-[var(--line)] px-5 py-4">
        <i className="mt-1 h-2.5 w-2.5 rounded-full bg-[#e6a128]" />
        <div>
          <h3 className="m-0 text-[13px]">Semua alert telah ditangani</h3>
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
          className="grid grid-cols-[9px_1fr_auto] gap-3 border-t border-[var(--line)] px-5 py-4"
        >
          <i
            className={`mt-1 h-2.5 w-2.5 rounded-full ${
              x.level === "high" ? "bg-[var(--red)]" : "bg-[#e6a128]"
            }`}
          />
          <div>
            <h3 className="m-0 text-[13px]">{x.title}</h3>
            <p className="m-0 mt-1 text-xs text-[var(--muted)]">{x.detail}</p>
            <span className="text-[10px] font-extrabold tracking-wide text-[var(--amber)]">
              {x.level === "high" ? "PRIORITAS TINGGI" : "PRIORITAS MENENGAH"}
            </span>
          </div>
          <button
            type="button"
            className="self-start rounded-md border border-[#cbd8f4] bg-[#f7faff] px-2 py-1.5 text-[11px] font-bold text-[#1658c8]"
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
    <article className="mt-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] p-0 shadow-[0_2px_6px_#17233d05]">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
        <div>
          <h2 className="m-0 text-base tracking-[-0.2px]">Action Needed</h2>
          <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
            Alert dihitung dari data CMS
          </p>
        </div>
        <span className="text-xs font-extrabold text-[var(--red)]">
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
    <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[#f0d7a9] bg-[#fff8e9] px-4 py-3 text-[#755311]">
      ⚠ <span>{message}</span>
    </div>
  );
}
