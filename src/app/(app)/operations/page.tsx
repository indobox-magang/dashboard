"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { DeviceList } from "@/components/DeviceList";
import { PageHead } from "@/components/Filters";
import { Empty, Leaderboard, MetricTile, Panel, PanelHead } from "@/components/Leaderboard";
import { AgentFleetPanel, NowPlayingPanel, ShowStatusPanel } from "@/components/OpsPanels";
import { useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fmtIDR, fmtPct } from "@/lib/format";
import { normalizePlaybackStatus } from "@/lib/dashboardMeta";

export default function OperationsPage() {
  const { data, loading, error, alerts } = useDashboard();
  const snapshot = useCmsSnapshot();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const h = data.health;
  const playback = (data.devices || []).map((device) => normalizePlaybackStatus(device.playback_status));
  const playing = playback.filter((status) => status === "playing").length;
  const idle = playback.filter((status) => status === "idle").length;
  const errors = (data.devices || []).filter(
    (device) => Boolean(device.playback_error) || normalizePlaybackStatus(device.playback_status) === "error"
  ).length;

  return (
    <div className="section-stack">
      <PageHead
        title="Operasional"
        subtitle="Player, jadwal, dan kesiapan cabang dari data live CMS."
      />
      {error ? <ErrorState message={error} /> : null}

      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
        <MetricTile
          label="Device online"
          value={fmtPct(h.device_online_pct, 0)}
          hint={`${h.devices_offline || 0} offline`}
          tone={h.devices_offline ? "danger" : "ok"}
        />
        <MetricTile label="Sedang playing" value={String(playing)} hint={`${idle} idle`} />
        <MetricTile
          label="Playback error"
          value={String(errors)}
          hint={errors ? "Butuh pengecekan" : "Tidak ada error"}
          tone={errors ? "danger" : "ok"}
        />
        <MetricTile label="F&B / admission" value={fmtIDR(h.fnb_per_admission)} />
      </div>

      <div className="grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
        {snapshot.data ? (
          <NowPlayingPanel shows={snapshot.data.shows} devices={snapshot.data.devices} />
        ) : (
          <Panel>
            <PanelHead title="Sedang tayang" />
            {snapshot.loading ? <LoadingState /> : <ErrorState message={snapshot.error || "Tidak tersedia"} />}
          </Panel>
        )}
        {snapshot.data ? (
          <ShowStatusPanel shows={snapshot.data.shows} />
        ) : (
          <Panel>
            <PanelHead title="Nasib jadwal" />
            {snapshot.loading ? <LoadingState /> : <ErrorState message={snapshot.error || "Tidak tersedia"} />}
          </Panel>
        )}
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Performa cabang" subtitle="Klik baris untuk detail cabang" />
          <Leaderboard rows={data.branches || []} />
        </Panel>
        <Panel>
          <PanelHead title="Device player" subtitle="Heartbeat dan playback dari CMS" />
          <DeviceList devices={data.devices || []} />
        </Panel>
      </div>

      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 max-[1100px]:grid-cols-1">
        {snapshot.data ? <AgentFleetPanel devices={snapshot.data.devices} /> : null}
        <Panel>
          <PanelHead title="Snack katalog" subtitle="Item dengan available = 0" />
          {data.unavailable_snacks?.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Produk
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.unavailable_snacks.map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">{s.name}</td>
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
      </div>

      <Panel>
        <PanelHead title="Catatan manajer" subtitle="Dari sinyal CMS" />
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
  );
}
