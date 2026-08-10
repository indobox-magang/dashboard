"use client";

import { fmtDelta, fmtIDR, fmtPct } from "@/lib/format";
import type { BranchRow } from "@/lib/types";

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-dashed border-[var(--line)] px-6 py-6 text-center text-[var(--muted)]">
      {children}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_2px_6px_#17233d05] ${className}`}
    >
      {children}
    </article>
  );
}

export function Leaderboard({ rows }: { rows: BranchRow[] }) {
  if (!rows.length) return <Empty>Belum ada data cabang untuk periode ini.</Empty>;
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="pb-2.5 text-left text-[11px] font-semibold text-[var(--muted)]">Cabang</th>
          <th className="pb-2.5 text-right text-[11px] font-semibold text-[var(--muted)]">
            Pendapatan
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold text-[var(--muted)]">
            Okupansi
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold text-[var(--muted)]">
            RevPASH
          </th>
          <th className="hide-sm pb-2.5 text-right text-[11px] font-semibold text-[var(--muted)] max-[720px]:hidden">
            Perubahan
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const d = fmtDelta(r.change_pct);
          return (
            <tr key={r.site_id}>
              <td className="border-t border-[var(--line)] py-3">
                <span className="mr-1.5 inline-grid h-[22px] w-[22px] place-items-center rounded-md bg-[#ebf2ff] text-[11px] font-extrabold text-[#3461b4]">
                  {i + 1}
                </span>
                {r.name}
              </td>
              <td className="border-t border-[var(--line)] py-3 text-right">
                {fmtIDR(r.revenue, true)}
              </td>
              <td className="border-t border-[var(--line)] py-3 text-right">
                {fmtPct(r.occupancy_pct, 0)}
              </td>
              <td className="border-t border-[var(--line)] py-3 text-right">
                {fmtIDR(r.revpash, true)}
              </td>
              <td
                className={`border-t border-[var(--line)] py-3 text-right text-xs font-bold max-[720px]:hidden ${
                  d.down ? "text-[var(--red)]" : "text-[#078168]"
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
