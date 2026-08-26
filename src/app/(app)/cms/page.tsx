"use client";

import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { BookingFunnel } from "@/components/BookingFunnel";
import { SeedBadge } from "@/components/DataBadges";
import { PageHead } from "@/components/Filters";
import { Empty, MetricTile, Panel, PanelHead } from "@/components/Leaderboard";
import {
  AgentFleetPanel,
  CheckInPanel,
  ShowStatusPanel,
  StorageBreakdownPanel,
} from "@/components/OpsPanels";
import { formatBytes, isDeviceOnline, useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { fmtIDR } from "@/lib/format";
import { verifiedFeatureCount } from "@/lib/opsMetrics";

function statusTone(status: string) {
  if (status === "paid" || status === "used") return "badge-ok";
  if (status === "pending") return "badge-warn";
  return "badge-warn";
}

export default function CmsPage() {
  const { data, loading, error, refresh } = useCmsSnapshot();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const online = data.devices.filter((d) => isDeviceOnline(d.last_heartbeat_at)).length;
  const activePromos = data.promos.filter((p) => p.active === 1);
  const activeBanners = data.banners.filter((b) => b.active === 1);
  const availableSnacks = data.snacks.filter((s) => s.available === 1);
  const verifiedFilms = data.assets.filter(
    (a) => a.kind === "feature" && ["verified", "encrypting", "verifying"].includes(a.status)
  );
  const scheduledShows = data.shows.filter((s) => s.status === "scheduled");
  const upcomingShows = [...scheduledShows]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 8);
  const recentBookings = data.bookings.slice(0, 10);
  const topCustomers = [...data.customers]
    .sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0))
    .slice(0, 8);

  return (
    <div className="section-stack">
      <PageHead
        title="Data CMS"
        subtitle="Inventori live: cabang, jadwal, booking, media, dan promo."
        controls={false}
      />
      {error ? <ErrorState message={error} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-[var(--muted)]">
          Endpoint admin CMS ·{" "}
          {new Date(data.fetched_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          WIB
        </p>
        <button type="button" className="btn-ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>

      {!data.sites.length ? (
        <div className="notice">
          <span>
            Belum ada cabang di CMS. Buat site/screen/show di <b>indobox-cms</b> agar dashboard
            bisnis terisi.
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-2">
        <MetricTile label="Cabang" value={String(data.sites.length)} hint={`${data.screens.length} layar`} />
        <MetricTile
          label="Devices"
          value={String(data.devices.length)}
          hint={data.devices.length ? `${online} online` : undefined}
          tone="ok"
        />
        <MetricTile label="Film verified" value={String(verifiedFeatureCount(data.assets))} />
        <MetricTile label="Show scheduled" value={String(scheduledShows.length)} />
        <MetricTile label="Bookings" value={String(data.bookings.length)} hint="Max 200 terbaru" />
        <MetricTile label="Promo aktif" value={String(activePromos.length)} />
        <MetricTile
          label="Storage"
          value={formatBytes(data.storage.total_size_bytes || 0)}
          hint={`${data.storage.total_count || 0} objek`}
        />
        <MetricTile label="Snack available" value={`${availableSnacks.length}/${data.snacks.length}`} />
      </div>

      <div className="grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
        <CheckInPanel bookings={data.bookings} />
        <Panel>
          <PanelHead title="Booking funnel" subtitle="Lifecycle 200 booking terbaru" />
          <BookingFunnel bookings={data.bookings} compact />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[1100px]:grid-cols-1">
        <ShowStatusPanel shows={data.shows} />
        <StorageBreakdownPanel storage={data.storage} assets={data.assets} />
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Booking terbaru" subtitle="Klik kode untuk detail" />
          {recentBookings.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Kode
                  </th>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Film
                  </th>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)] max-[720px]:hidden">
                    Kota
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Total
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 font-mono text-xs text-slate-300">
                      <Link
                        href={`/bookings/${encodeURIComponent(b.id)}`}
                        className="inline-flex items-center gap-1.5 text-inherit no-underline hover:text-white"
                      >
                        {b.code}
                        <SeedBadge values={[b.id, b.code, b.user_name, b.movie_title]} />
                      </Link>
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                      <div>{b.movie_title || "—"}</div>
                      <small className="text-[var(--muted)]">{b.user_name}</small>
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-300 max-[720px]:hidden">
                      {b.city || "—"}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                      {fmtIDR(b.total)}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right">
                      <span className={`badge ${statusTone(b.status)}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Belum ada booking di CMS.</Empty>
          )}
        </Panel>

        <Panel>
          <PanelHead title="Jadwal scheduled" subtitle="Show yang masih menunggu tayang" />
          {upcomingShows.length ? (
            <div className="grid gap-2.5">
              {upcomingShows.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="block text-white">{s.title}</b>
                  <small className="text-[var(--muted)]">
                    {s.site_name} · {s.screen_name} · {new Date(s.starts_at).toLocaleString("id-ID")}
                    {s.price != null ? ` · ${fmtIDR(s.price)}` : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada show terjadwal.</Empty>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-3 gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Promo aktif" subtitle={`${activePromos.length}/${data.promos.length} aktif`} />
          {activePromos.length ? (
            <div className="grid gap-2.5">
              {activePromos.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="block text-white">
                    {p.code} · {p.title || p.kind}
                  </b>
                  <small className="text-[var(--muted)]">
                    {p.value_pct ? `${p.value_pct}%` : ""}
                    {p.value_flat ? ` Rp${p.value_flat.toLocaleString("id-ID")}` : ""}
                    {p.subtitle ? ` · ${p.subtitle}` : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Tidak ada promo aktif.</Empty>
          )}
        </Panel>

        <Panel>
          <PanelHead
            title="Snack katalog"
            subtitle={`${availableSnacks.length}/${data.snacks.length} available`}
          />
          {data.snacks.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Nama
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Harga
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.snacks.slice(0, 10).map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">
                      <span className="inline-flex items-center gap-1.5">
                        {s.name}
                        <SeedBadge values={[s.id, s.name]} />
                      </span>
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                      {fmtIDR(s.price)}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right">
                      <span className={`badge ${s.available ? "badge-ok" : "badge-warn"}`}>
                        {s.available ? "Available" : "Off"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Belum ada snack di katalog.</Empty>
          )}
        </Panel>

        <AgentFleetPanel devices={data.devices} />
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-5 max-[1100px]:grid-cols-1">
        <Panel>
          <PanelHead title="Film verified" subtitle="Asset feature yang sudah verified / encrypting" />
          {verifiedFilms.length ? (
            <div className="grid gap-2.5">
              {verifiedFilms.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="flex items-center gap-1.5 text-white">
                    {a.title}
                    <SeedBadge values={[a.title]} />
                  </b>
                  <small className="text-[var(--muted)]">
                    {a.genre || "Tanpa genre"} · {a.status}
                    {a.duration_ms ? ` · ${Math.round(a.duration_ms / 60000)} mnt` : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada film verified di library.</Empty>
          )}
        </Panel>

        <Panel>
          <PanelHead title="Customer aktif" subtitle="Dari /v1/admin/booking-users" />
          {topCustomers.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Nama
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Tier
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--label)]">
                    Booking
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-slate-200">{c.name}</td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-slate-300">
                      {c.tier || "—"}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-white">
                      {c.booking_count || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty>Belum ada customer.</Empty>
          )}
          <div className="mt-4 grid gap-2 text-sm text-slate-200">
            <div className="flex justify-between border-t border-[var(--panel-border)] pt-3">
              <span>Banner aktif</span>
              <b className="text-white">
                {activeBanners.length}/{data.banners.length}
              </b>
            </div>
            <div className="flex justify-between">
              <span>Staff booking</span>
              <b className="text-white">{data.staff.length}</b>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
