import { buildBookingFunnel } from "@/lib/bookingFunnel";
import { fmtPct } from "@/lib/format";
import type { BookingRow } from "@/lib/types";
import { Empty } from "./Leaderboard";

const LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  used: "Used",
  expired: "Expired",
  cancelled: "Cancelled",
};

export function BookingFunnel({
  bookings,
  compact = false,
}: {
  bookings: BookingRow[];
  compact?: boolean;
}) {
  const funnel = buildBookingFunnel(bookings);
  const max = Math.max(1, ...funnel.stages.map((stage) => stage.count));

  if (!funnel.total) return <Empty>Belum ada booking pada snapshot CMS.</Empty>;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <span className="kpi-label">Konversi paid + used</span>
          <b className="mt-1 block text-[22px] text-white">{fmtPct(funnel.conversion_pct)}</b>
        </div>
        <span className="text-right text-xs text-[var(--muted)]">
          {funnel.converted}/{funnel.total}
        </span>
      </div>
      <div className="grid gap-2.5">
        {funnel.stages.map((stage) => (
          <div key={stage.status} className="grid grid-cols-[78px_1fr_28px] items-center gap-3">
            <span className="text-xs text-slate-300">{LABELS[stage.status]}</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
              <div
                className={`h-full rounded-full ${
                  stage.status === "paid" || stage.status === "used"
                    ? "bg-[var(--success)]"
                    : stage.status === "pending"
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--danger)]"
                }`}
                style={{ width: `${(stage.count / max) * 100}%` }}
              />
            </div>
            <b className="text-right text-xs text-white">{stage.count}</b>
          </div>
        ))}
      </div>
      {compact ? null : (
        <p className="mb-0 mt-4 text-[11px] leading-relaxed text-[var(--muted)]">
          Berdasarkan maksimal 200 booking terbaru, bukan total historis.
        </p>
      )}
    </div>
  );
}
