"use client";

import { useDashboard } from "@/hooks/useDashboardSummary";
import { isSeedData } from "@/lib/dashboardMeta";
import type { PeriodKey } from "@/lib/types";

export function Filters({ show = true }: { show?: boolean }) {
  const { data, period, siteId, setPeriod, setSiteId } = useDashboard();
  if (!show) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <select className="input w-auto min-w-[160px]" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
        <option value="">Semua Cabang</option>
        {(data?.sites || []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}{isSeedData(s.code, s.name) ? " [SEED]" : ""}
          </option>
        ))}
      </select>
      <select
        className="input w-auto min-w-[150px]"
        value={period}
        onChange={(e) => setPeriod(e.target.value as PeriodKey)}
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
  title: React.ReactNode;
  subtitle: string;
  controls?: boolean;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 max-[720px]:flex-col">
      <div>
        <h1 className="m-0 flex flex-wrap items-center gap-2 text-[28px] font-semibold tracking-[-0.5px] text-white">
          {title}
        </h1>
        <p className="mt-1.5 mb-0 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      <Filters show={controls} />
    </div>
  );
}
