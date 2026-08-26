"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { SeedBadge } from "@/components/DataBadges";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fmtIDR, fmtPct } from "@/lib/format";

export default function BranchDetailPage() {
  const params = useParams<{ siteId: string }>();
  const snapshot = useCmsSnapshot();
  const { data: summary } = useDashboard();

  if (snapshot.loading && !snapshot.data) return <LoadingState />;
  if (snapshot.error && !snapshot.data) return <ErrorState message={snapshot.error} />;

  const siteId = Number(params.siteId);
  const site = snapshot.data?.sites.find((item) => item.id === siteId);
  if (!site) {
    return (
      <Panel>
        <h1 className="mt-0 text-xl text-white">Cabang tidak ditemukan</h1>
        <Link href="/command" className="btn-ghost inline-flex no-underline">
          Kembali ke Command Center
        </Link>
      </Panel>
    );
  }

  const metrics = summary?.branches.find((item) => item.site_id === siteId);
  const devices = snapshot.data?.devices.filter((item) => item.site_id === siteId) || [];
  const screens = snapshot.data?.screens.filter((item) => item.site_id === siteId) || [];
  const shows =
    snapshot.data?.shows.filter(
      (item) => item.site_name === site.name || screens.some((screen) => screen.id === item.screen_id)
    ) || [];
  const city = site.city?.toLowerCase();
  const bookings =
    snapshot.data?.bookings.filter((item) => city && item.city?.toLowerCase() === city).slice(0, 10) || [];

  return (
    <div>
      <PageHead
        controls={false}
        title={
          <>
            {site.name}
            <SeedBadge values={[site.code, site.name]} />
          </>
        }
        subtitle={`${site.city || "Kota belum diisi"} · ${site.address || "Alamat belum diisi"}`}
      />
      <div className="mb-4 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Pendapatan</span>
          <b className="mt-1 block text-xl text-white">{fmtIDR(metrics?.revenue || 0, true)}</b>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Okupansi</span>
          <b className="mt-1 block text-xl text-white">{fmtPct(metrics?.occupancy_pct || 0)}</b>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">RevPASH</span>
          <b className="mt-1 block text-xl text-white">{fmtIDR(metrics?.revpash || 0, true)}</b>
        </div>
        <div className="health-tile">
          <span className="text-xs uppercase tracking-wide text-[var(--label)]">Operasional</span>
          <b className="mt-1 block text-xl text-white">
            {screens.length} screen · {devices.length} device
          </b>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
        <Panel>
          <h2 className="mt-0 text-base text-white">Device cabang</h2>
          {devices.length ? (
            <div className="grid gap-2">
              {devices.map((device) => (
                <Link
                  key={device.id}
                  href={`/devices/${device.id}`}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3 text-inherit no-underline hover:bg-white/[0.03]"
                >
                  <b className="flex items-center gap-2 text-white">
                    {device.name}
                    <SeedBadge values={[device.name]} />
                  </b>
                  <small className="text-[var(--muted)]">
                    {device.playback_status || "unknown"} · {device.status || "—"}
                  </small>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>Belum ada device pada cabang ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="mt-0 text-base text-white">Show terjadwal</h2>
          {shows.length ? (
            <div className="grid gap-2">
              {shows.slice(0, 8).map((show) => (
                <div
                  key={show.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="flex items-center gap-2 text-white">
                    {show.title}
                    <SeedBadge values={[show.title]} />
                  </b>
                  <small className="text-[var(--muted)]">
                    {show.screen_name} · {new Date(show.starts_at).toLocaleString("id-ID")}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada show scheduled pada snapshot.</Empty>
          )}
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="mt-0 text-base text-white">Booking terbaru cabang</h2>
        <p className="text-xs text-[var(--muted)]">
          Pencocokan berdasarkan field kota pada respons booking.
        </p>
        {bookings.length ? (
          <div className="grid gap-2">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${encodeURIComponent(booking.id)}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3 text-inherit no-underline hover:bg-white/[0.03]"
              >
                <span>
                  <b className="flex items-center gap-2 text-white">
                    {booking.code}
                    <SeedBadge values={[booking.id, booking.code, booking.movie_title]} />
                  </b>
                  <small className="text-[var(--muted)]">{booking.movie_title}</small>
                </span>
                <span className="badge badge-ok">{booking.status}</span>
              </Link>
            ))}
          </div>
        ) : (
          <Empty>Tidak ada booking yang dapat dicocokkan ke kota cabang ini.</Empty>
        )}
      </Panel>
    </div>
  );
}
