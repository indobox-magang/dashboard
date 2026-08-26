"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { conic, fmtDelta, fmtIDR, fmtPct } from "@/lib/format";

const COLORS = ["#e8a225", "#3dbe78", "#c8393a", "#5b8def", "#8b7cc9"];

export default function FnbPage() {
  const { data, loading, error } = useDashboard();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const f = data.fnb;
  const units = (f.items || []).reduce((a, x) => a + (x.units || 0), 0);
  const peak = (f.hours || []).reduce<(typeof f.hours)[0] | null>(
    (a, x) => (x.pct > (a?.pct ?? -1) ? x : a),
    null
  );
  const summary = [
    ["Pendapatan F&B", fmtIDR(f.revenue, true), fmtDelta(f.deltas?.revenue_pct, false, true)],
    ["Attach rate", fmtPct(f.attach_pct), fmtDelta(f.deltas?.attach_pts, true, true)],
    ["Basket rata-rata pembeli", fmtIDR(f.basket), fmtDelta(f.deltas?.basket_pct, false, true)],
  ] as const;

  return (
    <div className="section-stack">
      <PageHead
        title="F&B Detail"
        subtitle="Snack dari booking app (booking_snacks). Vending machine (Belum ada di cms)."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {summary.map((s) => (
          <div key={s[0]} className="health-tile">
            <span className="kpi-label">{s[0]}</span>
            <b className="mt-1.5 block text-2xl text-white">{s[1]}</b>
            <span className={`text-xs font-bold ${s[2].down ? "down" : "up"}`}>{s[2].text}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-base text-white">Item terlaris</h2>
              <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
                Pangsa unit terjual · {data.label}
              </p>
            </div>
            {f.items?.[0] ? <span className="badge badge-ok">{f.items[0].name}</span> : null}
          </div>
          {f.items?.length ? (
            <>
              <div className="grid grid-cols-[178px_1fr] items-center gap-5">
                <div
                  className="grid aspect-square w-[150px] place-items-center rounded-full"
                  style={{
                    background: conic(
                      f.items.map((x, i) => [x.share_pct || 0, COLORS[i % COLORS.length]])
                    ),
                  }}
                >
                  <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-[var(--card)] text-center text-[11px] text-[var(--muted)]">
                    Unit terjual
                    <strong className="block text-[17px] text-white">
                      {units.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
                <div className="grid gap-3.5">
                  {f.items.map((x, i) => (
                    <div
                      key={x.name}
                      className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200"
                    >
                      <i
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span>{x.name}</span>
                      <b className="text-xs text-white">{fmtPct(x.share_pct)}</b>
                    </div>
                  ))}
                </div>
              </div>
              <table className="mt-5 w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                      Produk
                    </th>
                    <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                      Unit terjual
                    </th>
                    <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                      Pendapatan
                    </th>
                    <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)] max-[720px]:hidden">
                      Pangsa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.items.map((x, i) => (
                    <tr key={x.name}>
                      <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                        <span className="mr-1.5 inline-grid h-[22px] w-[22px] place-items-center rounded-[var(--radius)] bg-[rgba(232,162,37,0.15)] text-[11px] font-extrabold text-[var(--accent)]">
                          {i + 1}
                        </span>
                        {x.name}
                      </td>
                      <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                        {(x.units || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                        {fmtIDR(x.revenue, true)}
                      </td>
                      <td className="border-t border-[var(--panel-border)] py-3 text-right text-slate-300 max-[720px]:hidden">
                        {fmtPct(x.share_pct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <Empty>Belum ada penjualan snack pada periode ini.</Empty>
          )}
        </Panel>

        <Panel>
          <h2 className="m-0 text-base text-white">Konversi pengunjung ke pembelian snack</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Booking tiket yang menyertakan snack
          </p>
          <div
            className="mx-auto grid aspect-square w-[150px] place-items-center rounded-full"
            style={{
              background: conic([
                [f.attach_pct || 0, "#e8a225"],
                [100 - (f.attach_pct || 0), "#243552"],
              ]),
            }}
          >
            <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-[var(--card)] text-center text-[11px] text-[var(--muted)]">
              Attach rate
              <strong className="block text-[17px] text-white">{fmtPct(f.attach_pct)}</strong>
            </div>
          </div>
          <div className="mt-5 grid gap-3.5">
            <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200">
              <i className="h-2.5 w-2.5 rounded-sm bg-[var(--accent)]" />
              <span>Membeli snack</span>
              <b className="text-xs text-white">
                {(f.buyers || 0).toLocaleString("id-ID")} booking
              </b>
            </div>
            <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#243552]" />
              <span>Tanpa snack</span>
              <b className="text-xs text-white">
                {Math.max(0, (f.visitors || 0) - (f.buyers || 0)).toLocaleString("id-ID")} booking
              </b>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Waktu pembelian</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Distribusi transaksi snack per slot
          </p>
          {f.hours?.length ? (
            <div className="grid grid-cols-[178px_1fr] items-center gap-5">
              <div
                className="grid aspect-square w-[150px] place-items-center rounded-full"
                style={{
                  background: conic(
                    f.hours.map((x, i) => [x.pct || 0, COLORS[i % COLORS.length]])
                  ),
                }}
              >
                <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-[var(--card)] text-center text-[11px] text-[var(--muted)]">
                  Puncak {peak?.slot || "—"}
                  <strong className="block text-[17px] text-white">
                    {fmtPct(peak?.pct || 0)}
                  </strong>
                </div>
              </div>
              <div className="grid gap-3.5">
                {f.hours.map((x, i) => (
                  <div
                    key={x.slot}
                    className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-slate-200"
                  >
                    <i
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span>{x.slot}</span>
                    <b className="text-xs text-white">{fmtPct(x.pct)}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty>Belum ada distribusi waktu.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Catatan F&B</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Sumber: booking_snacks CMS
          </p>
          <div className="grid gap-2.5">
            <div className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3">
              <b className="block text-white">Attach rate berbasis transaksi</b>
              <small className="text-[var(--muted)]">
                Dihitung dari booking berstatus paid/used yang punya baris snack.
              </small>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3">
              <b className="block text-white">
                Vending machine / POS counter <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">(Belum ada di cms)</span>
              </b>
              <small className="text-[var(--muted)]">
                Metrik F&B di dashboard hanya dari snack yang dipesan lewat aplikasi booking.
              </small>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
