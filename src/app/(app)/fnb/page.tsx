"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { conic, fmtDelta, fmtIDR, fmtPct } from "@/lib/format";

const COLORS = ["#276ef1", "#61c5b0", "#f1b64d", "#7656d6", "#c1d3fa"];

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
    ["Pendapatan F&B", fmtIDR(f.revenue, true), fmtDelta(f.deltas?.revenue_pct)],
    ["Attach rate", fmtPct(f.attach_pct), fmtDelta(f.deltas?.attach_pts, true)],
    ["Basket rata-rata pembeli", fmtIDR(f.basket), fmtDelta(f.deltas?.basket_pct)],
  ] as const;

  return (
    <div>
      <PageHead
        title="F&B Detail"
        subtitle="Snack dari booking.booking_snacks di CMS DB — bukan vending / POS counter."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="mb-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {summary.map((s) => (
          <div key={s[0]} className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
            <span className="text-xs font-semibold text-[var(--muted)]">{s[0]}</span>
            <b className="mt-1.5 block text-2xl">{s[1]}</b>
            <span className={`text-xs font-bold ${s[2].down ? "text-[var(--red)]" : "text-[#078168]"}`}>
              {s[2].text}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="m-0 text-base">Item terlaris</h2>
              <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
                Pangsa unit terjual · {data.label}
              </p>
            </div>
            {f.items?.[0] ? (
              <span className="rounded-full bg-[#e3f7ef] px-2 py-1 text-[11px] font-extrabold text-[#08745d]">
                {f.items[0].name}
              </span>
            ) : null}
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
                  <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-white text-center text-[11px] text-[var(--muted)]">
                    Unit terjual
                    <strong className="block text-[17px] text-[var(--ink)]">
                      {units.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
                <div className="grid gap-3.5">
                  {f.items.map((x, i) => (
                    <div
                      key={x.name}
                      className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]"
                    >
                      <i
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span>{x.name}</span>
                      <b className="text-xs">{fmtPct(x.share_pct)}</b>
                    </div>
                  ))}
                </div>
              </div>
              <table className="mt-5 w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="pb-2.5 text-left text-[11px] text-[var(--muted)]">Produk</th>
                    <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Unit terjual</th>
                    <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Pendapatan</th>
                    <th className="pb-2.5 text-right text-[11px] text-[var(--muted)] max-[720px]:hidden">
                      Pangsa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {f.items.map((x, i) => (
                    <tr key={x.name}>
                      <td className="border-t border-[var(--line)] py-3">
                        <span className="mr-1.5 inline-grid h-[22px] w-[22px] place-items-center rounded-md bg-[#ebf2ff] text-[11px] font-extrabold text-[#3461b4]">
                          {i + 1}
                        </span>
                        {x.name}
                      </td>
                      <td className="border-t border-[var(--line)] py-3 text-right">
                        {(x.units || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="border-t border-[var(--line)] py-3 text-right">
                        {fmtIDR(x.revenue, true)}
                      </td>
                      <td className="border-t border-[var(--line)] py-3 text-right max-[720px]:hidden">
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
          <h2 className="m-0 text-base">Konversi pengunjung ke pembelian snack</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Booking tiket yang menyertakan snack
          </p>
          <div
            className="mx-auto grid aspect-square w-[150px] place-items-center rounded-full"
            style={{
              background: conic([
                [f.attach_pct || 0, "#276ef1"],
                [100 - (f.attach_pct || 0), "#e7ebf2"],
              ]),
            }}
          >
            <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-white text-center text-[11px] text-[var(--muted)]">
              Attach rate
              <strong className="block text-[17px] text-[var(--ink)]">{fmtPct(f.attach_pct)}</strong>
            </div>
          </div>
          <div className="mt-5 grid gap-3.5">
            <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#276ef1]" />
              <span>Membeli snack</span>
              <b className="text-xs">{(f.buyers || 0).toLocaleString("id-ID")} booking</b>
            </div>
            <div className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]">
              <i className="h-2.5 w-2.5 rounded-sm bg-[#e7ebf2]" />
              <span>Tanpa snack</span>
              <b className="text-xs">
                {Math.max(0, (f.visitors || 0) - (f.buyers || 0)).toLocaleString("id-ID")} booking
              </b>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Waktu pembelian</h2>
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
                <div className="grid aspect-square w-[104px] place-items-center rounded-full bg-white text-center text-[11px] text-[var(--muted)]">
                  Puncak {peak?.slot || "—"}
                  <strong className="block text-[17px] text-[var(--ink)]">
                    {fmtPct(peak?.pct || 0)}
                  </strong>
                </div>
              </div>
              <div className="grid gap-3.5">
                {f.hours.map((x, i) => (
                  <div
                    key={x.slot}
                    className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px]"
                  >
                    <i
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span>{x.slot}</span>
                    <b className="text-xs">{fmtPct(x.pct)}</b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty>Belum ada distribusi waktu.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Catatan F&B</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Sumber: booking_snacks CMS
          </p>
          <div className="grid gap-2.5">
            <div className="rounded-[9px] border border-[var(--line)] p-3">
              <b className="block">Attach rate berbasis transaksi</b>
              <small className="text-[var(--muted)]">
                Dihitung dari booking berstatus paid/used yang punya baris snack.
              </small>
            </div>
            <div className="rounded-[9px] border border-[var(--line)] p-3">
              <b className="block">Bukan penjualan vending</b>
              <small className="text-[var(--muted)]">
                Metrik ini hanya mencakup snack yang dipesan lewat aplikasi booking.
              </small>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
