"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { formatBytes, isDeviceOnline, useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { fmtIDR } from "@/lib/format";

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
  const upcomingShows = [...data.shows]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 8);
  const recentBookings = data.bookings.slice(0, 10);
  const topCustomers = [...data.customers]
    .sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0))
    .slice(0, 8);

  const kpis = [
    { label: "Branches", value: String(data.sites.length) },
    { label: "Screens", value: String(data.screens.length) },
    {
      label: "Devices",
      value: String(data.devices.length),
      sub: data.devices.length ? `${online} online` : undefined,
    },
    { label: "Film verified", value: String(data.assets.length) },
    { label: "Shows scheduled", value: String(data.shows.length) },
    { label: "Bookings", value: String(data.bookings.length) },
    { label: "Promo aktif", value: String(activePromos.length) },
    {
      label: "Storage objects",
      value: String(data.storage.total_count || 0),
      sub: formatBytes(data.storage.total_size_bytes || 0),
    },
  ];

  return (
    <div>
      <PageHead
        title="Data CMS"
        subtitle="Ringkasan entitas yang sudah ada di indobox-cms (sites, jadwal, booking, promo, dll)."
        controls={false}
      />
      {error ? <ErrorState message={error} /> : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-[var(--muted)]">
          Diambil langsung dari endpoint admin CMS ·{" "}
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
        <div className="notice mb-5">
          ℹ{" "}
          <span>
            Belum ada cabang di CMS. Buat site/screen/show di{" "}
            <b>indobox-cms</b> (menu Branches / Schedules) agar dashboard bisnis terisi.
          </span>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-4 gap-3 max-[1100px]:grid-cols-2 max-[720px]:grid-cols-2">
        {kpis.map((k) => (
          <div key={k.label} className="health-tile">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {k.label}
            </span>
            <b className="mt-1.5 block text-2xl text-white">{k.value}</b>
            {k.sub ? <span className="text-xs font-semibold text-[var(--success)]">{k.sub}</span> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Booking terbaru</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari /v1/admin/bookings
          </p>
          {recentBookings.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Kode
                  </th>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Film
                  </th>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)] max-[720px]:hidden">
                    Kota
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Total
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 font-mono text-xs text-[var(--muted)]">
                      {b.code}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-[var(--foreground)]">
                      <div>{b.movie_title || "—"}</div>
                      <small className="text-[var(--muted)]">{b.user_name}</small>
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-[var(--muted)] max-[720px]:hidden">
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
          <h2 className="m-0 text-base text-white">Jadwal show (scheduled)</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari /v1/admin/shows
          </p>
          {upcomingShows.length ? (
            <div className="grid gap-2.5">
              {upcomingShows.map((s) => (
                <div
                  key={s.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="block text-white">{s.title}</b>
                  <small className="text-[var(--muted)]">
                    {s.site_name} · {s.screen_name} ·{" "}
                    {new Date(s.starts_at).toLocaleString("id-ID")}
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

      <div className="mt-4 grid grid-cols-3 gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Promo aktif</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            {activePromos.length}/{data.promos.length} aktif
          </p>
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
          <h2 className="m-0 text-base text-white">Snack katalog</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            {availableSnacks.length}/{data.snacks.length} available
          </p>
          {data.snacks.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Nama
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
                {data.snacks.slice(0, 10).map((s) => (
                  <tr key={s.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-[var(--foreground)]">
                      {s.name}
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

        <Panel>
          <h2 className="m-0 text-base text-white">Device & media</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Devices · assets · banners · staff
          </p>
          <div className="grid gap-2 text-sm text-[var(--foreground)]">
            <div className="flex justify-between border-b border-[var(--panel-border)] py-2">
              <span>Device online</span>
              <b className="text-white">
                {online}/{data.devices.length}
              </b>
            </div>
            <div className="flex justify-between border-b border-[var(--panel-border)] py-2">
              <span>Banner aktif</span>
              <b className="text-white">
                {activeBanners.length}/{data.banners.length}
              </b>
            </div>
            <div className="flex justify-between border-b border-[var(--panel-border)] py-2">
              <span>Staff booking</span>
              <b className="text-white">{data.staff.length}</b>
            </div>
            <div className="flex justify-between border-b border-[var(--panel-border)] py-2">
              <span>Customers</span>
              <b className="text-white">{data.customers.length}</b>
            </div>
            <div className="flex justify-between py-2">
              <span>Storage</span>
              <b className="text-white">{formatBytes(data.storage.total_size_bytes || 0)}</b>
            </div>
          </div>
          {data.devices.length ? (
            <div className="mt-4 grid gap-2">
              {data.devices.slice(0, 5).map((d) => {
                const on = isDeviceOnline(d.last_heartbeat_at);
                return (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 px-3 py-2"
                  >
                    <div>
                      <b className="block text-sm text-white">{d.name}</b>
                      <small className="text-[var(--muted)]">{d.site}</small>
                    </div>
                    <span className={`badge ${on ? "badge-ok" : "badge-warn"}`}>
                      {on ? "Online" : "Offline"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_1fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Film (asset feature verified)</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari /v1/admin/assets
          </p>
          {data.assets.length ? (
            <div className="grid gap-2.5">
              {data.assets.slice(0, 10).map((a) => (
                <div
                  key={a.id}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="block text-white">{a.title}</b>
                  <small className="text-[var(--muted)]">
                    {a.genre || "Tanpa genre"} · {a.status}
                    {a.duration_ms
                      ? ` · ${Math.round(a.duration_ms / 60000)} mnt`
                      : ""}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada film verified di library.</Empty>
          )}
        </Panel>

        <Panel>
          <h2 className="m-0 text-base text-white">Customer aktif</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari /v1/admin/booking-users
          </p>
          {topCustomers.length ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Nama
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Tier
                  </th>
                  <th className="pb-2.5 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    Booking
                  </th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.id}>
                    <td className="border-t border-[var(--panel-border)] py-3 text-[var(--foreground)]">
                      {c.name}
                    </td>
                    <td className="border-t border-[var(--panel-border)] py-3 text-right text-[var(--muted)]">
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
        </Panel>
      </div>
    </div>
  );
}
