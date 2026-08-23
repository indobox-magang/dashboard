"use client";

import { fmtDelta, fmtIDR, fmtPct } from "@/lib/format";
import type { BranchRow } from "@/lib/types";

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty-box">{children}</div>;
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <article className={`card p-5 ${className}`}>{children}</article>;
}

export function Leaderboard({ rows }: { rows: BranchRow[] }) {
  if (!rows.length) return <Empty>Belum ada data cabang untuk periode ini.</Empty>;
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="pb-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Cabang
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Pendapatan
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Okupansi
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            RevPASH
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500 max-[720px]:hidden">
            Perubahan
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const d = fmtDelta(r.change_pct);
          return (
            <tr key={r.site_id}>
              <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                <span className="mr-1.5 inline-grid h-[22px] w-[22px] place-items-center rounded-[var(--radius)] bg-[rgba(232,162,37,0.15)] text-[11px] font-extrabold text-[var(--accent)]">
                  {i + 1}
                </span>
                {r.name}
              </td>
              <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                {fmtIDR(r.revenue, true)}
              </td>
              <td className="border-t border-[var(--panel-border)] py-3 text-right text-slate-200">
                {fmtPct(r.occupancy_pct, 0)}
              </td>
              <td className="border-t border-[var(--panel-border)] py-3 text-right text-slate-200">
                {fmtIDR(r.revpash, true)}
              </td>
              <td
                className={`border-t border-[var(--panel-border)] py-3 text-right text-xs font-bold max-[720px]:hidden ${
                  d.down ? "down" : "up"
                }`}
              >
                {d.text.replace(" vs periode lalu", "")}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
