"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { DataFreshnessBadge, SeedBadge } from "@/components/DataBadges";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { isDeviceOnline, useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { normalizePlaybackStatus } from "@/lib/dashboardMeta";
import { relativeTime } from "@/lib/format";

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useCmsSnapshot();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;

  const id = Number(params.id);
  const device = data?.devices.find((item) => item.id === id);
  if (!device) {
    return (
      <Panel>
        <h1 className="mt-0 text-xl text-white">Device tidak ditemukan</h1>
        <p className="text-[var(--muted)]">
          Device tidak ada pada snapshot endpoint admin CMS saat ini.
        </p>
        <Link href="/operations" className="btn-ghost inline-flex no-underline">
          Kembali ke Operasional
        </Link>
      </Panel>
    );
  }

  const online = isDeviceOnline(device.last_heartbeat_at);
  const playback = normalizePlaybackStatus(device.playback_status);
  const screens = (device.screens || [])
    .map((screenId) => data?.screens.find((screen) => screen.id === screenId)?.name)
    .filter(Boolean);

  return (
    <div>
      <PageHead
        controls={false}
        title={
          <>
            {device.name}
            <SeedBadge values={[device.name]} />
          </>
        }
        subtitle="Detail device dari endpoint admin indobox-cms."
      />
      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-1">
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Koneksi</span>
          <b className={`mt-1 block text-xl ${online ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {online ? "Online" : "Offline"}
          </b>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Playback</span>
          <b className="mt-1 block text-xl capitalize text-white">{playback}</b>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Heartbeat</span>
          <b className="mt-1 block text-sm text-white">
            {device.last_heartbeat_at ? relativeTime(device.last_heartbeat_at) : "Belum pernah"}
          </b>
          <div className="mt-2">
            <DataFreshnessBadge
              timestamp={device.last_heartbeat_at}
              delayedAfterMs={120_000}
              staleAfterMs={15 * 60_000}
            />
          </div>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Agent</span>
          <b className="mt-1 block text-sm text-white">{device.agent_version || "Tidak dilaporkan"}</b>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
        <Panel>
          <h2 className="mt-0 text-base text-white">Identitas & assignment</h2>
          <dl className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
            <dt className="text-[var(--muted)]">Cabang</dt>
            <dd className="m-0 text-white">{device.site}</dd>
            <dt className="text-[var(--muted)]">Hostname</dt>
            <dd className="m-0 font-mono text-white">{device.hostname || "—"}</dd>
            <dt className="text-[var(--muted)]">Status CMS</dt>
            <dd className="m-0 text-white">{device.status || "—"}</dd>
            <dt className="text-[var(--muted)]">Screen</dt>
            <dd className="m-0 text-white">{screens.join(", ") || "Belum di-assign"}</dd>
            <dt className="text-[var(--muted)]">Git SHA</dt>
            <dd className="m-0 font-mono text-white">{device.agent_git_sha || "—"}</dd>
          </dl>
        </Panel>
        <Panel>
          <h2 className="mt-0 text-base text-white">Playback saat ini</h2>
          <dl className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
            <dt className="text-[var(--muted)]">Show</dt>
            <dd className="m-0 text-white">{device.current_show_title || "Tidak ada show aktif"}</dd>
            <dt className="text-[var(--muted)]">Show ID</dt>
            <dd className="m-0 font-mono text-white">{device.current_show_id || "—"}</dd>
            <dt className="text-[var(--muted)]">Asset ID</dt>
            <dd className="m-0 font-mono text-white">{device.current_asset_id || "—"}</dd>
            <dt className="text-[var(--muted)]">Error</dt>
            <dd className={`m-0 ${device.playback_error ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
              {device.playback_error || "Tidak ada error"}
            </dd>
          </dl>
          <p className="mb-0 mt-5 text-xs text-[var(--muted)]">
            Proof-of-play belum ditampilkan karena endpoint admin read belum tersedia di CMS.
          </p>
        </Panel>
      </div>
    </div>
  );
}
