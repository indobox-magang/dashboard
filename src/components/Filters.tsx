"use client";

import { useDashboard } from "@/hooks/useDashboardSummary";
import type { PeriodKey } from "@/lib/types";

export function Filters({ show = true }: { show?: boolean }) {
  const { data, period, siteId, setPeriod, setSiteId } = useDashboard();
  if (!show) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <select
        className="min-h-[39px] rounded-lg border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
        value={siteId}
        onChange={(e) => setSiteId(e.target.value)}
      >
        <option value="">Semua Cabang</option>
        {(data?.sites || []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <select
        className="min-h-[39px] rounded-lg border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
        value={period}
        onChange={(e) => {
          setPeriod(e.target.value as PeriodKey);
        }}
      >
        <option value="7d">7 hari terakhir</option>
        <option value="1d">Hari ini</option>
        <option value="28d">28 hari terakhir</option>
      </select>
    </div>
  );
}

export function PageHead({
  title,
  subtitle,
  controls = true,
}: {
  title: string;
  subtitle: string;
  controls?: boolean;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 max-[720px]:flex-col">
      <div>
        <h1 className="m-0 text-[29px] tracking-[-1px]">{title}</h1>
        <p className="mt-1.5 mb-0 text-[var(--muted)]">{subtitle}</p>
      </div>
      <Filters show={controls} />
    </div>
  );
}
