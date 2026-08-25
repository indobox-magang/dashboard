"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fmtIDR, fmtPct, genreClass, heatClass } from "@/lib/format";

const GENRE_SLOTS = ["10:30", "13:00", "16:00", "19:00", "21:30"];

export default function OptimizerPage() {
  const { data, loading, error, alerts, cms } = useDashboard();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const heat = data.heat || { days: [], slots: [], cells: [] };
  const genres = data.genres || [];
  const insightAlerts = alerts
    .filter((a) => /showtime|okupansi|Under-utilised|Permintaan/i.test(a.title + a.detail))
    .slice(0, 3);
  const assetByTitle = new Map(
    cms.assets.map((a) => [a.title.toLowerCase(), a] as const)
  );
  const schedule = [...cms.shows]
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 10);
  const seatCapacity = cms.screens.reduce(
    (n, sc) => n + (sc.rows || 0) * (sc.cols || 0),
    0
  );

  return (
    <div>
      <PageHead
        title="Optimizer Showtime"
        subtitle="Pola okupansi dari cms.shows + kursi terjual."
      />
      {error ? <ErrorState message={error} /> : null}
      {cms.error ? <ErrorState message={cms.error} /> : null}
      <div className="notice">
        ℹ{" "}
        <span>
          Keputusan dari jadwal/booking <b>indobox-cms</b> · heatmap summary · jadwal/assets/screens
          dari endpoint CMS admin.
        </span>
        <span className="ml-auto text-xs font-bold text-[var(--accent-hover)]">
          {cms.screens.length} screen · {seatCapacity} seats · {cms.assets.length} feature assets
        </span>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Heatmap okupansi</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Hari × slot waktu</p>
          {heat.slots?.length && heat.days?.length ? (
            <div
              className="grid items-center gap-1.5 text-[11px]"
              style={{ gridTemplateColumns: `64px repeat(${heat.days.length}, 1fr)` }}
            >
              <span />
              {heat.days.map((d) => (
                <span key={d} className="text-center text-[var(--muted)]">
                  {d}
                </span>
              ))}
              {heat.slots.map((slot, si) => (
                <div key={slot} className="contents">
                  <span className="text-[var(--muted)]">{slot}</span>
                  {heat.days.map((day, di) => {
                    const v = heat.cells[di]?.[si] ?? 0;
                    return (
                      <button
                        key={`${day}-${slot}`}
                        type="button"
                        className={`min-h-9 rounded-[var(--radius)] border-0 font-semibold ${heatClass(v)}`}
                      >
                        {Math.round(v)}%
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum cukup data showtime untuk heatmap.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Insight terpilih</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari alert & film ranking
          </p>
          {insightAlerts.length ? (
            <div className="grid gap-2.5">
              {insightAlerts.map((a) => (
                <div
                  key={a.title}
                  className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                >
                  <b className="block text-white">{a.title}</b>
                  <small className="text-[var(--muted)]">{a.detail}</small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada insight overflow/under-utilised.</Empty>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Heatmap genre × slot waktu</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Okupansi rata-rata per genre · {data.label}
          </p>
          {genres.length ? (
            <>
              <div
                className="grid items-center gap-1.5 text-[11px]"
                style={{ gridTemplateColumns: `88px repeat(5, 1fr)` }}
              >
                <span />
                {GENRE_SLOTS.map((s) => (
                  <span key={s} className="text-center text-[var(--muted)]">
                    {s}
                  </span>
                ))}
                {genres.map((genre) => {
                  const vals = genre.slots || [];
                  let peakIdx = 0;
                  vals.forEach((v, i) => {
                    if (v > vals[peakIdx]) peakIdx = i;
                  });
                  return (
                    <div key={genre.genre} className="contents">
                      <span className="text-left font-bold text-white">{genre.genre}</span>
                      {vals.map((value, col) => (
                        <button
                          key={`${genre.genre}-${col}`}
                          type="button"
                          className={`min-h-[34px] rounded-[var(--radius)] border-0 font-bold ${genreClass(value)} ${
                            col === peakIdx
                              ? "shadow-[0_0_0_2px_var(--card),0_0_0_3px_var(--accent)]"
                              : ""
                          }`}
                        >
                          {Math.round(value)}%
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  Rendah
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#162e28]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#1d4a38]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#246b4a]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#2f9a62]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[var(--success)]" />
                  Tinggi
                </span>
                <span className="flex items-center gap-2">
                  <i className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--card)] shadow-[0_0_0_2px_var(--card),0_0_0_3px_var(--accent)]" />
                  Slot puncak genre
                </span>
              </div>
            </>
          ) : (
            <Empty>Belum ada data genre pada periode ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Ranking film</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Summary + enrich /assets
          </p>
          {data.films?.length ? (
            <div className="grid gap-2.5">
              {data.films.map((f) => {
                const meta =
                  assetByTitle.get(f.title.toLowerCase()) ||
                  assetByTitle.get(f.title.replace(/^Demo:\s*/i, "").toLowerCase());
                return (
                  <div
                    key={f.title}
                    className="rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/15 p-3"
                  >
                    <b className="block text-white">{f.title}</b>
                    <small className="text-[var(--muted)]">
                      Okupansi {fmtPct(f.occupancy_pct, 0)} · RevPASH {fmtIDR(f.revpash)} ·{" "}
                      {f.admissions} admissions
                      {meta?.genre ? ` · ${meta.genre}` : ""}
                      {meta?.release_date ? ` · rilis ${meta.release_date}` : ""}
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty>Belum ada film pada periode ini.</Empty>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-[1.2fr_0.8fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">Jadwal show CMS</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/shows
          </p>
          {schedule.length ? (
            <div className="grid gap-2">
              {schedule.map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between gap-3 border-t border-[var(--panel-border)] py-2.5 first:border-t-0 first:pt-0"
                >
                  <div>
                    <b className="block text-[13px] text-white">{s.title || "Untitled"}</b>
                    <small className="text-[var(--muted)]">
                      {s.site_name} · {s.screen_name}
                    </small>
                  </div>
                  <span className="text-right text-[11px] text-[var(--muted)]">
                    {new Date(s.starts_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <br />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada show untuk filter ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Studio / kapasitas</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            GET /v1/admin/screens
          </p>
          {cms.screens.length ? (
            <div className="grid gap-2">
              {cms.screens.map((sc) => (
                <div
                  key={sc.id}
                  className="flex justify-between gap-2 border-t border-[var(--panel-border)] py-2.5 first:border-t-0 first:pt-0"
                >
                  <span>
                    <b className="text-white">{sc.name}</b>
                    <small className="mt-0.5 block text-[var(--muted)]">{sc.site_name}</small>
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {(sc.rows || 0) * (sc.cols || 0)} seats
                    <br />
                    {sc.rows}×{sc.cols}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada screen di CMS.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
