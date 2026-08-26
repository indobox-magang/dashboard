import { freshnessFromIso, isSeedData, type FreshnessState } from "@/lib/dashboardMeta";

const FRESHNESS_LABEL: Record<FreshnessState, string> = {
  fresh: "Fresh",
  delayed: "Delayed",
  stale: "Stale",
  unknown: "Unknown",
};

export function DataFreshnessBadge({
  timestamp,
  delayedAfterMs,
  staleAfterMs,
  label,
}: {
  timestamp?: string | null;
  delayedAfterMs?: number;
  staleAfterMs?: number;
  label?: string;
}) {
  const state = freshnessFromIso(timestamp, delayedAfterMs, staleAfterMs);
  return (
    <span className={`badge badge-freshness badge-${state}`} title={timestamp || "Tidak ada timestamp"}>
      {label ? `${label}: ` : ""}
      {FRESHNESS_LABEL[state]}
    </span>
  );
}

export function SeedBadge({
  values,
}: {
  values: Array<string | number | null | undefined>;
}) {
  if (!isSeedData(...values)) return null;
  return (
    <span className="badge badge-seed" title="Data demo/seed, bukan data produksi">
      Seed
    </span>
  );
}
