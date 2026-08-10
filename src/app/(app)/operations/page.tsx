"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Empty, Leaderboard, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { deviceHealth, mapDeviceToRow } from "@/lib/cms";
import { fmtIDR, fmtPct } from "@/lib/format";

export default function OperationsPage() {
  const { data, loading, error, alerts, cms } = useDashboard();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const deviceRows = cms.devices.length
    ? cms.devices.map(mapDeviceToRow)
    : data.devices || [];
  const health = cms.devices.length
    ? deviceHealth(cms.devices)
    : {
        onlinePct: data.health.device_online_pct,
        offline: data.health.devices_offline,
        onlineN: 0,
        total: data.devices?.length || 0,
      };
  const snacks = cms.snacks;
  const unavailable = snacks.filter((s) => s.available === 0);
  const seatCapacity = cms.screens.reduce(
    (n, sc) => n + (sc.rows || 0) * (sc.cols || 0),
    0
  );

  return (
    <div>
      <PageHead
        title="Operasional"
        subtitle="Efisiensi cabang, device player, dan katalog snack CMS."
      />
      {error ? <ErrorState message={error} /> : null}
      {cms.error ? <ErrorState message={cms.error} /> : null}
      <div className="mb-4 grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">Device online</span>
          <b className="mt-1.5 block text-2xl">{fmtPct(health.onlinePct, 0)}</b>
          <span
            className={`text-xs font-bold ${
              health.offline ? "text-[var(--red)]" : "text-[#078168]"
            }`}
          >
            {health.offline || 0} offline · dari /devices
          </span>
        </div>
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">Kapasitas studio</span>
          <b className="mt-1.5 block text-2xl">{seatCapacity.toLocaleString("id-ID")}</b>
          <span className="text-xs text-[var(--muted)]">
            {cms.screens.length} screen · /screens
          </span>
        </div>
        <div className="rounded-[11px] border border-[#e4ecfc] bg-[#f7faff] p-4">
          <span className="text-xs font-semibold text-[var(--muted)]">F&B spend / admission</span>
          <b className="mt-1.5 block text-2xl">{fmtIDR(data.health.fnb_per_admission)}</b>
        </div>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Branch leaderboard</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Peringkat dari dashboard summary
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Device tracker</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Player edge · GET /v1/admin/devices
          </p>
          <DeviceList devices={deviceRows} />
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Snack katalog</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/snacks · {unavailable.length} unavailable
          </p>
          {snacks.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] text-[var(--muted)]">Produk</th>
                  <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Harga</th>
                  <th className="pb-2.5 text-right text-[11px] text-[var(--muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {snacks.map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--line)] py-3">
                      {s.name}
                      {s.size ? (
                        <small className="ml-1 text-[var(--muted)]">({s.size})</small>
                      ) : null}
                    </td>
                    <td className="border-t border-[var(--line)] py-3 text-right">
                      {fmtIDR(s.price)}
                    </td>
                    <td className="border-t border-[var(--line)] py-3 text-right">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${
                          s.available
                            ? "bg-[#e3f7ef] text-[#08745d]"
                            : "bg-[#fff0d2] text-[#985a02]"
                        }`}
                      >
                        {s.available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Katalog snack kosong atau /snacks gagal dimuat.</Empty>
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
