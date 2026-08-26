export type FreshnessState = "fresh" | "delayed" | "stale" | "unknown";

export function freshnessFromIso(
  iso?: string | null,
  delayedAfterMs = 2 * 60_000,
  staleAfterMs = 15 * 60_000
): FreshnessState {
  if (!iso) return "unknown";
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return "unknown";
  const age = Math.max(0, Date.now() - timestamp);
  if (age <= delayedAfterMs) return "fresh";
  if (age <= staleAfterMs) return "delayed";
  return "stale";
}

export function isSeedData(...values: Array<string | number | null | undefined>): boolean {
  return values.some((value) => {
    const text = String(value ?? "").toLowerCase();
    return (
      text.includes("[seed]") ||
      text.includes("dash-seed") ||
      text.startsWith("dash-") ||
      text.includes("_dash_")
    );
  });
}

export function normalizePlaybackStatus(status?: string | null): string {
  const value = status?.trim().toLowerCase();
  if (!value) return "unknown";
  if (value === "playing") return "playing";
  if (value === "idle" || value === "stopped") return "idle";
  if (value === "error" || value === "failed") return "error";
  return value;
}
