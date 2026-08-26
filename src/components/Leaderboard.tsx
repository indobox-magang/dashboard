"use client";

import Link from "next/link";
import { SeedBadge } from "@/components/DataBadges";
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

export function PanelHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="m-0 text-[15px] font-semibold tracking-[-0.2px] text-white">{title}</h2>
      {subtitle ? (
        <p className="mt-1 mb-0 text-xs leading-relaxed text-[var(--muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <div className="health-tile">
      <span className="kpi-label">{label}</span>
      <b className="mt-1.5 block text-[22px] font-semibold tracking-[-0.4px] text-white">{value}</b>
      {hint ? (
        <span
          className={`mt-1 block text-xs ${
            tone === "danger" ? "down" : tone === "ok" ? "up" : tone === "warn" ? "warn" : "text-[var(--muted)]"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function Leaderboard({ rows }: { rows: BranchRow[] }) {
  if (!rows.length) return <Empty>Belum ada data cabang untuk periode ini.</Empty>;
  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr>
          <th className="pb-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--label)]">
            Cabang
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--label)]">
            Pendapatan
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--label)]">
            Okupansi
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--label)]">
            RevPASH
          </th>
          <th className="pb-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--label)] max-[720px]:hidden">
            Perubahan
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const d = fmtDelta(r.change_pct);
          return (
            <tr key={r.site_id} className="transition hover:bg-white/[0.03]">
              <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                <Link
                  href={`/branches/${r.site_id}`}
                  className="inline-flex items-center gap-1.5 text-inherit no-underline hover:text-white"
                >
                  <span className="inline-grid h-[22px] w-[22px] place-items-center rounded-[var(--radius)] bg-[rgba(232,162,37,0.15)] text-[11px] font-extrabold text-[var(--accent)]">
                    {i + 1}
                  </span>
                  {r.name}
                  <SeedBadge values={[r.name]} />
                </Link>
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
