import Link from "next/link";
import { formatBytes } from "@/hooks/useCmsSnapshot";
import { fmtPct } from "@/lib/format";
import {
  agentVersionRows,
  checkInMetrics,
  failedAssetCount,
  nowPlayingItems,
  pipelineAssetCount,
  showStatusMetrics,
  storageShare,
} from "@/lib/opsMetrics";
import type { AssetRow, BookingRow, DeviceAdminRow, DeviceRow, ShowRow, StorageStats } from "@/lib/types";
import { Empty, MetricTile, Panel, PanelHead } from "./Leaderboard";

const KIND_LABEL: Record<string, string> = {
  feature: "Film",
  trailer: "Trailer",
  ad: "Iklan",
};

const KIND_COLOR: Record<string, string> = {
  feature: "bg-[var(--accent)]",
  trailer: "bg-[var(--success)]",
  ad: "bg-[#5b8def]",
};

export function CheckInPanel({ bookings }: { bookings: BookingRow[] }) {
  const m = checkInMetrics(bookings);
  return (
    <Panel>
      <PanelHead
        title="Check-in & no-show"
        subtitle="Paid vs used dari snapshot booking. No-show = paid setelah jam tayang."
      />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <MetricTile label="Check-in" value={fmtPct(m.check_in_pct, 0)} hint={`${m.used} sudah discan`} tone="ok" />
        <MetricTile
          label="No-show"
          value={String(m.no_show)}
          hint={m.awaiting ? `${m.awaiting} belum jam tayang` : "Tidak ada antrean"}
          tone={m.no_show ? "danger" : "ok"}
        />
      </div>
      <p className="m-0 text-[11px] leading-relaxed text-[var(--muted)]">
        {m.eligible} tiket paid/used pada 200 booking terbaru. Bukan audit jam scan.
      </p>
    </Panel>
  );
}

export function NowPlayingPanel({
  shows,
  devices,
}: {
  shows: ShowRow[];
  devices: Array<DeviceAdminRow | DeviceRow>;
}) {
  const items = nowPlayingItems(shows, devices);
  return (
    <Panel>
      <PanelHead title="Sedang tayang" subtitle="Dari is_playing dan playback device saat ini." />
      {items.length ? (
        <div className="grid gap-2">
          {items.slice(0, 6).map((item) => {
            const body = (
              <>
                <b className="block text-[13px] text-white">{item.title}</b>
                <small className="text-[var(--muted)]">
                  {item.site}
                  {item.screen ? ` · ${item.screen}` : ""}
                  {item.device ? ` · ${item.device}` : ""}
                </small>
              </>
            );
            return item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-lg border border-[var(--panel-border)] bg-black/20 px-3 py-2.5 text-inherit no-underline transition hover:bg-white/[0.04]"
              >
                {body}
              </Link>
            ) : (
              <div
                key={item.key}
                className="rounded-lg border border-[var(--panel-border)] bg-black/20 px-3 py-2.5"
              >
                {body}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty>Tidak ada player yang sedang memutar.</Empty>
      )}
    </Panel>
  );
}

export function ShowStatusPanel({ shows }: { shows: ShowRow[] }) {
  const m = showStatusMetrics(shows);
  return (
    <Panel>
      <PanelHead
        title="Nasib jadwal"
        subtitle="Scheduled, selesai (done), dan dibatalkan dari CMS."
      />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <MetricTile label="Scheduled" value={String(m.scheduled)} hint={m.overdue ? `${m.overdue} sudah lewat` : "On schedule"} />
        <MetricTile label="Selesai" value={String(m.done)} tone="ok" />
        <MetricTile label="Batal" value={String(m.cancelled)} tone={m.cancelled ? "warn" : undefined} />
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-[var(--muted)]">Completion</span>
        <b className="text-sm text-white">{fmtPct(m.completion_pct, 0)}</b>
      </div>
      <p className="mb-0 mt-3 text-[11px] leading-relaxed text-[var(--muted)]">
        Completion = done / (done + cancelled + scheduled yang sudah lewat jam mulai).
      </p>
    </Panel>
  );
}

export function AgentFleetPanel({ devices }: { devices: DeviceAdminRow[] }) {
  const rows = agentVersionRows(devices);
  return (
    <Panel>
      <PanelHead title="Versi agent" subtitle="Perbandingan versi software antar device." />
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div
              key={row.version}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--panel-border)] bg-black/15 px-3 py-2"
            >
              <span className="font-mono text-xs text-slate-200">{row.version}</span>
              <span className="flex items-center gap-2">
                <b className="text-sm text-white">{row.count}</b>
                {row.majority ? <span className="badge badge-ok">Mayoritas</span> : null}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty>Belum ada laporan versi agent.</Empty>
      )}
    </Panel>
  );
}

export function StorageBreakdownPanel({
  storage,
  assets,
}: {
  storage: StorageStats;
  assets: AssetRow[];
}) {
  const parts = storageShare(storage);
  const failed = failedAssetCount(assets);
  const pipeline = pipelineAssetCount(assets);
  return (
    <Panel>
      <PanelHead
        title="Storage media"
        subtitle="Ukuran file verified di CMS, plus pipeline upload/encrypt."
      />
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <span className="kpi-label">Terpakai</span>
          <b className="mt-1 block text-[22px] text-white">{formatBytes(storage.total_size_bytes || 0)}</b>
        </div>
        <span className="text-xs text-[var(--muted)]">{storage.total_count || 0} objek</span>
      </div>
      {parts.length ? (
        <div className="grid gap-2.5">
          {parts.map((row) => (
            <div key={row.kind} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
              <span className="text-xs text-slate-300">{KIND_LABEL[row.kind] || row.kind}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full ${KIND_COLOR[row.kind] || "bg-slate-400"}`}
                  style={{ width: `${Math.max(4, row.pct)}%` }}
                />
              </div>
              <span className="text-right text-[11px] text-[var(--muted)]">
                {formatBytes(row.total_size_bytes)} · {row.count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty>Belum ada file verified di storage.</Empty>
      )}
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={`badge ${failed ? "badge-stale" : "badge-ok"}`}>{failed} gagal</span>
        <span className={`badge ${pipeline ? "badge-warn" : "badge-ok"}`}>{pipeline} sedang diproses</span>
      </div>
    </Panel>
  );
}
