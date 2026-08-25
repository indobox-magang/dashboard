"use client";

import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Empty, Leaderboard, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fetchVendingMachines } from "@/lib/api";
import { deviceHealth, mapDeviceToRow } from "@/lib/cms";
import { fmtIDR, fmtPct } from "@/lib/format";
import type { VendingMachine } from "@/lib/types";

export default function OperationsPage() {
  const { data, loading, error, alerts, cms, siteId, deviceOnlineWindowMinutes } = useDashboard();
  const [vending, setVending] = useState<VendingMachine[]>([]);
  const [vendNote, setVendNote] = useState<string | null>(null);
  const [vendError, setVendError] = useState<string | null>(null);

  const loadVending = useCallback(async () => {
    try {
      setVendError(null);
      const res = await fetchVendingMachines(siteId || undefined);
      setVending(res.items || []);
      setVendNote(res.note || null);
    } catch (err) {
      setVendError(err instanceof Error ? err.message : "Gagal memuat vending");
    }
  }, [siteId]);

  useEffect(() => {
    void loadVending();
  }, [loadVending]);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const deviceRows = cms.devices.length
    ? cms.devices.map((d) => mapDeviceToRow(d, deviceOnlineWindowMinutes))
    : data.devices || [];
  const health = cms.devices.length
    ? deviceHealth(cms.devices, deviceOnlineWindowMinutes)
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
  const stockouts = vending.reduce((n, m) => n + (m.open_stockouts || 0), 0);
  const offlineVend = vending.filter((m) => m.status !== "online").length;

  return (
    <div>
      <PageHead
        title="Operasional"
        subtitle="Efisiensi cabang, device player, snack katalog, dan vending (seed / simulasi eksternal)."
      />
      {error ? <ErrorState message={error} /> : null}
      {cms.error ? <ErrorState message={cms.error} /> : null}
      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Device online
          </span>
          <b className="mt-1.5 block text-2xl text-white">{fmtPct(health.onlinePct, 0)}</b>
          <span className={`text-xs font-bold ${health.offline ? "down" : "up"}`}>
            {health.offline || 0} offline · dari /devices
          </span>
        </div>
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Kapasitas studio
          </span>
          <b className="mt-1.5 block text-2xl text-white">
            {seatCapacity.toLocaleString("id-ID")}
          </b>
          <span className="text-xs text-[var(--muted)]">
            {cms.screens.length} screen · /screens
          </span>
        </div>
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Vending issue
          </span>
          <b className="mt-1.5 block text-2xl text-white">{offlineVend}</b>
          <span className="text-xs text-[var(--muted)]">{stockouts} slot stockout</span>
        </div>
        <div className="health-tile">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            F&B spend / admission
          </span>
          <b className="mt-1.5 block text-2xl text-white">
            {fmtIDR(data.health.fnb_per_admission)}
          </b>
        </div>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Branch leaderboard</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Peringkat dari dashboard summary
          </p>
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Device tracker</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Player edge · GET /v1/admin/devices — vending telemetry terpisah di bawah
          </p>
          <DeviceList devices={deviceRows} />
        </Panel>
      </div>

      <Panel className="mt-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-base text-white">Vending machines</h2>
            <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
              {vendNote || "Simulated external telemetry (seed) — bukan feed vendor live."}
            </p>
          </div>
        </div>
        {vendError ? <p className="text-sm text-[var(--danger)]">{vendError}</p> : null}
        {vending.length ? (
          <div className="grid gap-3">
            {vending.map((m) => (
              <div
                key={m.id}
                className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <b className="text-white">{m.name}</b>
                    <div className="text-xs text-[var(--muted)]">
                      {m.site_name} · {m.code}
                      {m.is_seed ? " · SEED" : ""}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span
                      className={`font-bold ${
                        m.status === "online" ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {m.status.toUpperCase()}
                    </span>
                    <div className="text-[var(--muted)]">uptime {fmtPct(m.uptime_pct, 1)}</div>
                  </div>
                </div>
                {m.error_code ? (
                  <p className="mt-2 mb-0 text-xs text-[var(--danger)]">Error: {m.error_code}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-[var(--muted)]">
                  {(m.slots || []).map((s) => (
                    <span
                      key={s.slot_code}
                      className={`rounded border px-2 py-1 ${
                        s.stockout
                          ? "border-[var(--danger)] text-[var(--danger)]"
                          : "border-[var(--panel-border)]"
                      }`}
                    >
                      {s.slot_code} {s.product_name} ({s.qty_on_hand}/{s.capacity})
                    </span>
                  ))}
                </div>
                {(m.recent_events || []).length ? (
                  <div className="mt-2 grid gap-1 text-[11px] text-[var(--muted)]">
                    {m.recent_events.map((e, i) => (
                      <div key={`${e.occurred_at}-${i}`}>
                        [{e.event_type}] {e.detail}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            Belum ada data vending. Jalankan seed:{" "}
            <code className="text-[var(--accent)]">scripts/seed-inventory-vending.sql</code>
          </Empty>
        )}
      </Panel>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Snack katalog</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/snacks · {unavailable.length} unavailable
          </p>
          {snacks.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Produk
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Harga
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {snacks.map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-[var(--foreground)]">
                      {s.name}
                      {s.size ? (
                        <small className="ml-1 text-[var(--muted)]">({s.size})</small>
                      ) : null}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                      {fmtIDR(s.price)}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right">
                      <span
                        className={`badge ${s.available ? "badge-ok" : "badge-warn"}`}
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
          <h2 className="m-0 text-base text-white">Catatan untuk manajer</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Dari sinyal CMS</p>
          {alerts.slice(0, 3).length ? (
            <div className="grid gap-2.5">
              {alerts.slice(0, 3).map((a) => (
                <div
                  key={a.key || a.title}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
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
