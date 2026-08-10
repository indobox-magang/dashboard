"use client";

import { ActionNeededPanel, ErrorState, LoadingState } from "@/components/Alerts";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Leaderboard, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { conic, fmtDelta, fmtIDR, fmtPct, periodLabel } from "@/lib/format";

function Spark({ down }: { down: boolean }) {
  return (
    <svg className="mt-3 h-[25px] w-full" viewBox="0 0 54 25" preserveAspectRatio="none">
      <path
        d={`M2 ${down ? 5 : 22} L12 ${down ? 8 : 18} L22 ${down ? 7 : 20} L32 ${down ? 14 : 11} L42 ${down ? 18 : 13} L52 ${down ? 22 : 5}`}
        fill="none"
        stroke={down ? "#d34b58" : "#276ef1"}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CommandPage() {
  const { data, loading, error, period } = useDashboard();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const k = data.kpis;
  const deltas = [
    fmtDelta(k.deltas?.net_revenue_pct),
    fmtDelta(k.deltas?.admissions_pct),
    fmtDelta(k.deltas?.occupancy_pts, true),
    fmtDelta(k.deltas?.atp_pct),
    fmtDelta(k.deltas?.fnb_per_admission_pct),
    fmtDelta(k.deltas?.revpash_pct),
  ];
  const cards: [string, string, (typeof deltas)[0]][] = [
    ["Pendapatan bersih", fmtIDR(k.net_revenue, true), deltas[0]],
    ["Admissions", (k.admissions || 0).toLocaleString("id-ID"), deltas[1]],
    ["Okupansi", fmtPct(k.occupancy_pct), deltas[2]],
    ["ATP", fmtIDR(k.atp), deltas[3]],
    ["F&B / admission", fmtIDR(k.fnb_per_admission), deltas[4]],
    ["RevPASH", fmtIDR(k.revpash), deltas[5]],
  ];
  const ticketAmt = (k.net_revenue * (data.mix.ticket_pct || 0)) / 100;
  const snackAmt = (k.net_revenue * (data.mix.snack_pct || 0)) / 100;
  const maxTrend = Math.max(1, ...(data.trend || []).map((t) => t.revenue));
  const highAlerts = (data.alerts || []).filter((a) => a.level === "high").length;

  return (
    <div>
      <PageHead
        title="Business Command Center"
        subtitle="Prioritas bisnis dari data live indobox-cms."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[#f0d7a9] bg-[#fff8e9] px-4 py-3 text-[#755311]">
        {highAlerts ? (
          <span>
            ⚠ <b className="text-[#5e4106]">{highAlerts} alert berdampak tinggi</b> dari CMS
            membutuhkan respons.
          </span>
        ) : (
          <span>
            ℹ Data diambil langsung dari <b className="text-[#5e4106]">indobox-cms</b> (tiket, snack
            booking, jadwal, device player).
          </span>
        )}
      </div>

      <div className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2">
        {cards.map((x) => (
          <article
            key={x[0]}
            className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-[0_2px_6px_#17233d05]"
          >
            <div className="text-xs font-semibold text-[var(--muted)]">{x[0]}</div>
            <div className="my-2 text-[22px] font-extrabold tracking-[-0.7px] whitespace-nowrap max-[720px]:text-[19px]">
              {x[1]}
            </div>
            <span className={`text-xs font-bold ${x[2].down ? "text-[var(--red)]" : "text-[#078168]"}`}>
              {x[2].text}
            </span>
            <Spark down={x[2].down} />
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-base">Komposisi pendapatan</h2>
              <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
                {fmtIDR(k.net_revenue, true)} · {periodLabel(period)}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[178px_1fr] items-center gap-5 max-[720px]:grid-cols-[130px_1fr]">
            <div
              className="grid aspect-square w-[150px] place-items-center rounded-full max-[720px]:w-[122px]"
              style={{
                background: conic([
                  [data.mix.ticket_pct || 0, "#276ef1"],
                  [data.mix.snack_pct || 0, "#61c5b0"],
                ]),
              }}
            >
              <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-white text-center text-[11px] text-[var(--muted)] max-[720px]:w-[85px]">
                Total
                <strong className="block text-[17px] text-[var(--ink)]">
                  {fmtIDR(k.net_revenue, true)}
                </strong>
              </div>
            </div>
            <div className="grid gap-3.5">
              <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#276ef1]" />
                <span>Tiket</span>
                <b className="text-xs">
                  {fmtPct(data.mix.ticket_pct)} · {fmtIDR(ticketAmt, true)}
                </b>
              </div>
              <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#61c5b0]" />
                <span>Snack (app)</span>
                <b className="text-xs">
                  {fmtPct(data.mix.snack_pct)} · {fmtIDR(snackAmt, true)}
                </b>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="m-0 text-base">Tren pendapatan</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Tiket + snack per hari</p>
          {data.trend?.length ? (
            <>
              <div className="flex h-[130px] items-end gap-2 border-b border-[var(--line)] pt-2.5">
                {data.trend.map((t, i) => (
                  <i
                    key={t.date}
                    title={fmtIDR(t.revenue)}
                    className={`min-w-3 flex-1 rounded-t ${
                      i === data.trend.length - 1 ? "bg-[var(--blue)]" : "bg-[#c1d3fa]"
                    }`}
                    style={{ height: `${Math.max(4, (t.revenue / maxTrend) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between pt-1.5 text-[11px] text-[var(--muted)]">
                {data.trend.map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[var(--muted)]">Belum ada transaksi pada periode ini.</p>
          )}
        </Panel>
      </div>

      <ActionNeededPanel />

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Performa cabang</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari sites + bookings CMS
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Device player</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Status heartbeat dari CMS
          </p>
          <DeviceList devices={data.devices || []} />
        </Panel>
      </div>
    </div>
  );
}
