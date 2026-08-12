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
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Device online
          </span>
          <b className="mt-1.5 block text-2xl text-white">{fmtPct(h.device_online_pct, 0)}</b>
          <span className={`text-xs font-bold ${h.devices_offline ? "down" : "up"}`}>
            {h.devices_offline || 0} offline
          </span>
        </div>
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Device offline
          </span>
          <b className="mt-1.5 block text-2xl text-white">{h.devices_offline || 0}</b>
          <span className="text-xs text-[var(--muted)]">Butuh pengecekan</span>
        </div>
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            F&B spend / admission
          </span>
          <b className="mt-1.5 block text-2xl text-white">{fmtIDR(h.fnb_per_admission)}</b>
        </div>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Branch leaderboard</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Peringkat berdasarkan pendapatan
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Device tracker</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Player edge — vending telemetry (Belum ada di cms)
          </p>
          <DeviceList devices={data.devices || []} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Snack katalog</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Item dengan available = 0 di CMS
          </p>
          {data.unavailable_snacks?.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    Produk
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.unavailable_snacks.map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                      {s.name}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right">
                      <span className="badge badge-warn">Unavailable</span>
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
          <h2 className="m-0 text-base text-white">Catatan untuk manajer</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Dari sinyal CMS</p>
          {alerts.slice(0, 3).length ? (
            <div className="grid gap-2.5">
              {alerts.slice(0, 3).map((a) => (
                <div key={a.title} className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3">
                  <b className="block text-white">{a.title}</b>
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
