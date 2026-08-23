"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fetchSnackInventory, fetchSnackRestocks } from "@/lib/api";
import { conic, fmtDelta, fmtIDR, fmtPct } from "@/lib/format";
import type { SnackInventoryRow, SnackRestockRow } from "@/lib/types";

const COLORS = ["#e8a225", "#3dbe78", "#c8393a", "#5b8def", "#8b7cc9"];

export default function FnbPage() {
  const { data, loading, error, siteId, cms } = useDashboard();
  const [inventory, setInventory] = useState<SnackInventoryRow[]>([]);
  const [restocks, setRestocks] = useState<SnackRestockRow[]>([]);
  const [invError, setInvError] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    try {
      setInvError(null);
      const [inv, logs] = await Promise.all([
        fetchSnackInventory(siteId || undefined),
        fetchSnackRestocks({ siteId: siteId || undefined, limit: 8 }),
      ]);
      setInventory(inv.items || []);
      setRestocks(logs.items || []);
    } catch (err) {
      setInvError(err instanceof Error ? err.message : "Gagal memuat inventori");
    }
  }, [siteId]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

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
  const recentPaid = cms.bookings
    .filter((b) => b.status === "paid" || b.status === "used")
    .slice(0, 8);
  const lowStock = inventory.filter((x) => x.qty_on_hand <= 5);

  return (
    <div>
      <PageHead
        title="F&B Detail"
        subtitle="Snack sales dari booking_snacks · stok on-hand dari snack_inventory CMS. Vending (Belum ada di cms)."
      />
      {error ? <ErrorState message={error} /> : null}
      {cms.error ? <ErrorState message={cms.error} /> : null}
      <div className="mb-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {summary.map((s) => (
          <div key={s[0]} className="health-tile">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {s[0]}
            </span>
            <b className="mt-1.5 block text-2xl text-white">{s[1]}</b>
            <span className={`text-xs font-bold ${s[2].down ? "down" : "up"}`}>{s[2].text}</span>
          </div>
        ))}
      </div>

      <Panel className="mb-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-base text-white">Stok on-hand (CMS)</h2>
            <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
              booking.snack_inventory · filter cabang mengikuti dashboard
            </p>
          </div>
          {lowStock.length ? (
            <span className="text-xs font-extrabold text-[var(--danger)]">
              {lowStock.length} SKU ≤ 5
            </span>
          ) : null}
        </div>
        {invError ? <p className="text-sm text-[var(--danger)]">{invError}</p> : null}
        {inventory.length ? (
          <div className="grid gap-2">
            {inventory.slice(0, 12).map((row) => (
              <div
                key={`${row.site_id}-${row.snack_id}`}
                className="flex items-center justify-between gap-3 border-t border-[var(--panel-border)] py-2.5 text-sm first:border-t-0"
              >
                <div>
                  <b className="text-white">{row.snack_name}</b>
                  <div className="text-xs text-[var(--muted)]">{row.site_name}</div>
                </div>
                <b
                  className={`text-sm ${
                    row.qty_on_hand <= 5 ? "text-[var(--danger)]" : "text-white"
                  }`}
                >
                  {row.qty_on_hand} unit
                </b>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Belum ada baris inventori. Restock lewat API CMS dulu.</Empty>
        )}
        {restocks.length ? (
          <div className="mt-4 border-t border-[var(--panel-border)] pt-3">
            <h3 className="m-0 mb-2 text-sm text-white">Restock terbaru</h3>
            <div className="grid gap-2">
              {restocks.map((r) => (
                <div key={r.id} className="flex justify-between gap-3 text-xs text-[var(--muted)]">
                  <span>
                    {r.snack_name} · {r.site_name}
                    {r.note ? ` — ${r.note}` : ""}
                  </span>
                  <span className="text-white">
                    {r.qty_delta > 0 ? "+" : ""}
                    {r.qty_delta} → {r.qty_after}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Panel>

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
                    className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-[var(--foreground)]"
                  >
                    <i
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span>{x.name}</span>
                    <b className="text-xs text-white">
                      {x.units} · {fmtPct(x.share_pct)}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty>Belum ada penjualan snack pada periode ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Distribusi jam</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Peak: {peak ? peak.slot : "—"}
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
                  Jam
                  <strong className="block text-[17px] text-white">{peak?.slot || "—"}</strong>
                </div>
              </div>
              <div className="grid gap-3.5">
                {f.hours.map((x, i) => (
                  <div
                    key={x.slot}
                    className="grid grid-cols-[9px_1fr_auto] items-center gap-2 text-[13px] text-[var(--foreground)]"
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
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Katalog snack CMS</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/snacks
          </p>
          {cms.snacks.length ? (
            <div className="mb-4 grid gap-2">
              {cms.snacks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 border-t border-[var(--panel-border)] py-2 first:border-t-0 first:pt-0"
                >
                  <span className="text-[var(--foreground)]">
                    {s.name}
                    <small className="ml-1 text-[var(--muted)]">
                      {s.available ? "available" : "unavailable"}
                    </small>
                  </span>
                  <b className="text-xs text-white">{fmtIDR(s.price)}</b>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Katalog snack belum termuat.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Catatan F&B</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Sumber: booking_snacks + snack_inventory CMS
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
                Vending machine / POS counter{" "}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                  (Belum ada di cms)
                </span>
              </b>
              <small className="text-[var(--muted)]">
                Counter stock sudah ada di inventori CMS; vending telemetry belum.
              </small>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="m-0 text-base text-white">Booking paid/used terbaru</h2>
        <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
          GET /v1/admin/bookings · sample untuk konteks F&B
        </p>
        {recentPaid.length ? (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="pb-2.5 text-left text-[11px] text-[var(--muted)]">Kode</th>
                <th className="pb-2.5 text-left text-[11px] text-[var(--muted)]">Film</th>
                <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Total</th>
                <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPaid.map((b) => (
                <tr key={b.id}>
                  <td className="border-t border-[var(--panel-border)] py-2.5 text-[var(--foreground)]">
                    {b.code}
                  </td>
                  <td className="border-t border-[var(--panel-border)] py-2.5 text-[var(--foreground)]">
                    {b.movie_title || "—"}
                  </td>
                  <td className="border-t border-[var(--panel-border)] py-2.5 text-right text-white">
                    {fmtIDR(b.total, true)}
                  </td>
                  <td className="border-t border-[var(--panel-border)] py-2.5 text-right text-[var(--muted)]">
                    {b.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>Belum ada booking paid/used.</Empty>
        )}
        <p className="mt-4 mb-0 text-xs text-[var(--muted)]">
          Metrik attach/revenue di atas tetap dari summary (`booking_snacks`); panel ini dari list
          endpoint CMS.
        </p>
      </Panel>
    </div>
  );
}
