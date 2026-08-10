"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Empty, Leaderboard, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fmtIDR, fmtPct } from "@/lib/format";

export default function OperationsPage() {
  const { data, loading, error, alerts } = useDashboard();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const h = data.health;

  return (
    <div>
      <PageHead
        title="Operasional"
        subtitle="Efisiensi cabang, device player, dan ketersediaan snack katalog."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="mb-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">Device online</span>
          <b className="mt-1.5 block text-2xl">{fmtPct(h.device_online_pct, 0)}</b>
          <span className={`text-xs font-bold ${h.devices_offline ? "text-[var(--red)]" : "text-[#078168]"}`}>
            {h.devices_offline || 0} offline
          </span>
        </div>
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">Device offline</span>
          <b className="mt-1.5 block text-2xl">{h.devices_offline || 0}</b>
          <span className="text-xs text-[var(--muted)]">Butuh pengecekan</span>
        </div>
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">F&B spend / admission</span>
          <b className="mt-1.5 block text-2xl">{fmtIDR(h.fnb_per_admission)}</b>
        </div>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Branch leaderboard</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Peringkat berdasarkan pendapatan
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Device tracker</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Player edge (bukan vending)
          </p>
          <DeviceList devices={data.devices || []} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Snack katalog</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Item dengan available = 0 di CMS
          </p>
          {data.unavailable_snacks?.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] text-[var(--muted)]">Produk</th>
                  <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.unavailable_snacks.map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--line)] py-3">{s.name}</td>
                    <td className="border-t border-[var(--line)] py-3 text-right">
                      <span className="rounded-full bg-[#fff0d2] px-2 py-1 text-[11px] font-extrabold text-[#985a02]">
                        Unavailable
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Semua snack katalog berstatus tersedia.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Catatan untuk manajer</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Dari sinyal CMS</p>
          {alerts.slice(0, 3).length ? (
            <div className="grid gap-2.5">
              {alerts.slice(0, 3).map((a) => (
                <div key={a.title} className="rounded-[9px] border border-[var(--line)] p-3">
                  <b className="block">{a.title}</b>
                  <small className="text-[var(--muted)]">{a.detail}</small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Tidak ada catatan prioritas saat ini.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
