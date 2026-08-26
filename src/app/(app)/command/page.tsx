"use client";

import { ActionNeededPanel, ErrorState, LoadingState } from "@/components/Alerts";
import { BookingFunnel } from "@/components/BookingFunnel";
import { CmsInventoryStrip } from "@/components/CmsInventoryStrip";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Leaderboard, MetricTile, Panel, PanelHead } from "@/components/Leaderboard";
import { CheckInPanel, NowPlayingPanel } from "@/components/OpsPanels";
import { useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { conic, fmtDelta, fmtIDR, fmtPct, periodLabel } from "@/lib/format";

export default function CommandPage() {
  const { data, loading, error, period } = useDashboard();
  const snapshot = useCmsSnapshot();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const k = data.kpis;
  const cards = [
    ["Pendapatan bersih", fmtIDR(k.net_revenue, true), fmtDelta(k.deltas?.net_revenue_pct, false, true)],
    ["Admissions", (k.admissions || 0).toLocaleString("id-ID"), fmtDelta(k.deltas?.admissions_pct, false, true)],
    ["Okupansi", fmtPct(k.occupancy_pct), fmtDelta(k.deltas?.occupancy_pts, true, true)],
    ["ATP", fmtIDR(k.atp), fmtDelta(k.deltas?.atp_pct, false, true)],
    ["F&B / admission", fmtIDR(k.fnb_per_admission), fmtDelta(k.deltas?.fnb_per_admission_pct, false, true)],
    ["RevPASH", fmtIDR(k.revpash), fmtDelta(k.deltas?.revpash_pct, false, true)],
  ] as const;
  const ticketAmt = (k.net_revenue * (data.mix.ticket_pct || 0)) / 100;
  const snackAmt = (k.net_revenue * (data.mix.snack_pct || 0)) / 100;
  const maxTrend = Math.max(1, ...(data.trend || []).map((t) => t.revenue));
  const highAlerts = (data.alerts || []).filter((a) => a.level === "high").length;

  return (
    <div className="section-stack">
      <PageHead
        title="Command Center"
        subtitle="Prioritas bisnis hari ini dari data live indobox-cms."
      />
      {error ? <ErrorState message={error} /> : null}
      <CmsInventoryStrip />
      {highAlerts ? (
        <div className="notice">
          <span>
            <b>{highAlerts} alert prioritas tinggi</b> membutuhkan respons.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2">
        {cards.map(([label, value, delta]) => (
          <MetricTile
            key={label}
            label={label}
            value={value}
            hint={delta.text}
            tone={delta.down ? "danger" : "ok"}
          />
        ))}
      </div>

      <div className="grid grid-cols-[1.4fr_0.9fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Komposisi pendapatan" subtitle={`${fmtIDR(k.net_revenue, true)} · ${periodLabel(period)}`} />
          <div className="grid grid-cols-[150px_1fr] items-center gap-5 max-[720px]:grid-cols-1">
            <div
              className="mx-auto grid aspect-square w-[132px] place-items-center rounded-full"
              style={{
                background: conic([
                  [data.mix.ticket_pct || 0, "#e8a225"],
                  [data.mix.snack_pct || 0, "#3dbe78"],
                ]),
              }}
            >
              <div className="grid aspect-square w-[92px] place-items-center rounded-full bg-[var(--card)] text-center text-[11px] text-[var(--muted)]">
                Total
                <strong className="block text-base text-white">{fmtIDR(k.net_revenue, true)}</strong>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3 text-[13px] text-slate-200">
                <span className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
                  Tiket
                </span>
                <b className="text-white">
                  {fmtPct(data.mix.ticket_pct)} · {fmtIDR(ticketAmt, true)}
                </b>
              </div>
              <div className="flex items-center justify-between gap-3 text-[13px] text-slate-200">
                <span className="flex items-center gap-2">
                  <i className="h-2.5 w-2.5 rounded-sm bg-[var(--success)]" />
                  Snack
                </span>
                <b className="text-white">
                  {fmtPct(data.mix.snack_pct)} · {fmtIDR(snackAmt, true)}
                </b>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHead title="Tren pendapatan" subtitle="Tiket + snack per hari" />
          {data.trend?.length ? (
            <>
              <div className="flex h-[120px] items-end gap-1.5 border-b border-[var(--panel-border)] pt-2">
                {data.trend.map((t, i) => (
                  <i
                    key={t.date}
                    title={fmtIDR(t.revenue)}
                    className={`min-w-2 flex-1 rounded-t ${
                      i === data.trend.length - 1 ? "bg-[var(--accent)]" : "bg-[#2a4a78]"
                    }`}
                    style={{ height: `${Math.max(6, (t.revenue / maxTrend) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between pt-2 text-[11px] text-[var(--muted)]">
                {data.trend.map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="m-0 text-sm text-[var(--muted)]">Belum ada transaksi pada periode ini.</p>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
        {snapshot.data ? (
          <CheckInPanel bookings={snapshot.data.bookings} />
        ) : (
          <Panel>
            <PanelHead title="Check-in & no-show" />
            {snapshot.loading ? <LoadingState /> : <ErrorState message={snapshot.error || "Tidak tersedia"} />}
          </Panel>
        )}
        <Panel>
          <PanelHead title="Booking funnel" subtitle="Lifecycle 200 booking terbaru" />
          {snapshot.loading && !snapshot.data ? (
            <LoadingState />
          ) : snapshot.data ? (
            <BookingFunnel bookings={snapshot.data.bookings} compact />
          ) : (
            <ErrorState message={snapshot.error || "Funnel booking tidak tersedia"} />
          )}
        </Panel>
      </div>

      {snapshot.data ? (
        <NowPlayingPanel shows={snapshot.data.shows} devices={snapshot.data.devices} />
      ) : null}

      <ActionNeededPanel />

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Performa cabang" subtitle="Klik baris untuk detail" />
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <PanelHead title="Device player" subtitle="Heartbeat CMS" />
          <DeviceList devices={data.devices || []} />
        </Panel>
      </div>
    </div>
  );
}
