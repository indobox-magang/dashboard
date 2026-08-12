"use client";

import { ActionNeededPanel, ErrorState, LoadingState } from "@/components/Alerts";
import { CmsInventoryStrip } from "@/components/CmsInventoryStrip";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Empty, Leaderboard, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { deviceHealth, mapDeviceToRow } from "@/lib/cms";
import { conic, fmtDelta, fmtIDR, fmtPct, periodLabel } from "@/lib/format";

function Spark({ down }: { down: boolean }) {
  return (
    <svg className="mt-3 h-[25px] w-full" viewBox="0 0 54 25" preserveAspectRatio="none">
      <path
        d={`M2 ${down ? 5 : 22} L12 ${down ? 8 : 18} L22 ${down ? 7 : 20} L32 ${down ? 14 : 11} L42 ${down ? 18 : 13} L52 ${down ? 22 : 5}`}
        fill="none"
        stroke={down ? "#c8393a" : "#e8a225"}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CommandPage() {
  const { data, loading, error, period, cms } = useDashboard();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const deviceRows = cms.devices.length
    ? cms.devices.map(mapDeviceToRow)
    : data.devices || [];
  const health = deviceHealth(cms.devices);
  const upcomingShows = [...cms.shows]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 6);
  const recentBookings = cms.bookings.slice(0, 6);
  const paidBookings = cms.bookings.filter((b) => b.status === "paid" || b.status === "used");

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
  const publicPct = data.mix.public_ticket_pct ?? data.mix.ticket_pct ?? 0;
  const privatePct = data.mix.private_ticket_pct ?? 0;
  const snackMixPct = data.mix.snack_mix_pct ?? data.mix.snack_pct ?? 0;
  const publicAmt = (k.net_revenue * publicPct) / 100;
  const privateAmt = (k.net_revenue * privatePct) / 100;
  const snackAmt = (k.net_revenue * snackMixPct) / 100;
  const maxTrend = Math.max(1, ...(data.trend || []).map((t) => t.revenue));
  const highAlerts = (data.alerts || []).filter((a) => a.level === "high").length;

  return (
    <div>
      <PageHead
        title="Business Command Center"
        subtitle="Prioritas bisnis dari data live indobox-cms."
      />
      {error ? <ErrorState message={error} /> : null}
      {cms.error ? <ErrorState message={cms.error} /> : null}
      <CmsInventoryStrip />
      <div className="notice">
        {highAlerts ? (
          <span>
            ⚠ <b>{highAlerts} alert berdampak tinggi</b> dari CMS membutuhkan respons.
          </span>
        ) : (
          <span>
            ℹ Data live dari <b>indobox-cms</b> · KPI summary + katalog{" "}
            <b>/sites · /devices · /shows · /bookings</b>
          </span>
        )}
        <span className="ml-auto text-xs font-bold text-[#5e4106]">
          Player {health.onlineN}/{health.total || deviceRows.length} online ·{" "}
          {paidBookings.length} booking paid/used
        </span>
      </div>

      <div className="grid grid-cols-6 gap-3 max-[1100px]:grid-cols-3 max-[720px]:grid-cols-2">
        {cards.map((x) => (
          <article key={x[0]} className="card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {x[0]}
            </div>
            <div className="my-2 text-[22px] font-semibold tracking-[-0.7px] whitespace-nowrap text-white max-[720px]:text-[19px]">
              {x[1]}
            </div>
            <span className={`text-xs font-bold ${x[2].down ? "down" : "up"}`}>{x[2].text}</span>
            <Spark down={x[2].down} />
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-base text-white">Komposisi pendapatan</h2>
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
                  [publicPct, "#e8a225"],
                  [privatePct, "#7c5cff"],
                  [snackMixPct, "#3dbe78"],
                ]),
              }}
            >
              <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-[var(--card)] text-center text-[11px] text-[var(--muted)] max-[720px]:w-[85px]">
                Total
                <strong className="block text-[17px] text-white">
                  {fmtIDR(k.net_revenue, true)}
                </strong>
              </div>
            </div>
            <div className="grid gap-3.5">
              <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200">
                <i className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
                <span>Tiket publik</span>
                <b className="text-xs text-white">
                  {fmtPct(publicPct)} · {fmtIDR(publicAmt, true)}
                </b>
              </div>
              <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200">
                <i className="h-2.5 w-2.5 rounded-sm bg-[#7c5cff]" />
                <span>Private screening</span>
                <b className="text-xs text-white">
                  {fmtPct(privatePct)} · {fmtIDR(privateAmt, true)}
                </b>
              </div>
              <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200">
                <i className="h-2.5 w-2.5 rounded-sm bg-[var(--success)]" />
                <span>Snack (app)</span>
                <b className="text-xs text-white">
                  {fmtPct(snackMixPct)} · {fmtIDR(snackAmt, true)}
                </b>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <h2 className="m-0 text-base text-white">Tren pendapatan</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Tiket + snack per hari</p>
          {data.trend?.length ? (
            <>
              <div className="flex h-[130px] items-end gap-2 border-b border-[var(--panel-border)] pt-2.5">
                {data.trend.map((t, i) => (
                  <i
                    key={t.date}
                    title={fmtIDR(t.revenue)}
                    className={`min-w-3 flex-1 rounded-t ${
                      i === data.trend.length - 1 ? "bg-[var(--accent)]" : "bg-[#2a4a78]"
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
          <h2 className="m-0 text-base text-white">Jadwal show (CMS)</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/shows
          </p>
          {upcomingShows.length ? (
            <div className="grid gap-2">
              {upcomingShows.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between gap-3 border-t border-[var(--panel-border)] py-2.5 first:border-t-0 first:pt-0"
                >
                  <div>
                    <b className="block text-[13px] text-white">{s.title || "Untitled"}</b>
                    <small className="text-[var(--muted)]">
                      {s.site_name} · {s.screen_name}
                    </small>
                  </div>
                  <span className="shrink-0 text-right text-[11px] text-[var(--muted)]">
                    {new Date(s.starts_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <br />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada show di CMS untuk filter ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Booking terbaru</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/bookings
          </p>
          {recentBookings.length ? (
            <div className="grid gap-2">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex justify-between gap-3 border-t border-[var(--panel-border)] py-2.5 first:border-t-0 first:pt-0"
                >
                  <div>
                    <b className="block text-[13px] text-white">{b.code}</b>
                    <small className="text-[var(--muted)]">
                      {b.movie_title || "—"} · {b.user_name}
                    </small>
                  </div>
                  <span className="shrink-0 text-right text-[11px]">
                    <b className="text-white">{fmtIDR(b.total, true)}</b>
                    <br />
                    <span className="text-[var(--muted)]">{b.status}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada booking di CMS.</Empty>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Performa cabang</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari dashboard summary
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Device player</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/devices
          </p>
          <DeviceList devices={deviceRows} />
        </Panel>
      </div>
    </div>
  );
}
