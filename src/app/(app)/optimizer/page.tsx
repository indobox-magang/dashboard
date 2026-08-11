"use client";

import { ErrorState, LoadingState } from "@/components/Alerts";
import { PageHead } from "@/components/Filters";
import { Empty, Panel } from "@/components/Leaderboard";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { fmtIDR, fmtPct, genreClass, heatClass } from "@/lib/format";

const GENRE_SLOTS = ["10:30", "13:00", "16:00", "19:00", "21:30"];

export default function OptimizerPage() {
  const { data, loading, error, alerts } = useDashboard();
  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;

  const heat = data.heat || { days: [], slots: [], cells: [] };
  const genres = data.genres || [];
  const insightAlerts = alerts
    .filter((a) => /showtime|okupansi|Under-utilised|Permintaan/i.test(a.title + a.detail))
    .slice(0, 3);

  return (
    <div>
      <PageHead
        title="Optimizer Showtime"
        subtitle="Pola okupansi dari cms.shows + kursi terjual."
      />
      {error ? <ErrorState message={error} /> : null}
      <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[#f0d7a9] bg-[#fff8e9] px-4 py-3 text-[#755311]">
        ℹ{" "}
        <span>
          Heatmap dari <b className="text-[#5e4106]">cms.shows</b> + kursi terjual di{" "}
          <code className="text-[11px]">booking</code>. Demografi & vending tidak tersedia.
        </span>
      </div>

      <div className="grid grid-cols-[1.15fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Heatmap okupansi</h2>
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
                  {(heat.cells[si] || []).map((v, di) => (
                    <button
                      key={`${slot}-${di}`}
                      type="button"
                      className={`min-h-9 rounded-md border-0 font-semibold ${heatClass(v)}`}
                    >
                      {Math.round(v)}%
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum cukup data showtime untuk heatmap.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Insight terpilih</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Dari alert & film ranking
          </p>
          {insightAlerts.length ? (
            <div className="grid gap-2.5">
              {insightAlerts.map((a) => (
                <div key={a.title} className="rounded-[9px] border border-[var(--line)] p-3">
                  <b className="block">{a.title}</b>
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
          <h2 className="m-0 text-base">Heatmap genre × slot waktu</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Okupansi rata-rata per genre · {data.label}
          </p>
          {genres.length ? (
            <>
              <div
                className="grid items-center gap-1.5 text-[11px] max-[720px]:gap-1"
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
                      <span className="text-left font-bold text-[var(--ink)]">{genre.genre}</span>
                      {vals.map((value, col) => (
                        <button
                          key={`${genre.genre}-${col}`}
                          type="button"
                          className={`min-h-[34px] rounded-md border-0 font-bold ${genreClass(value)} ${
                            col === peakIdx ? "shadow-[0_0_0_2px_#fff,0_0_0_3px_var(--ink)]" : ""
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
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#eef6f3]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#cfeae1]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#94d6c2]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#37ad8e]" />
                  <i className="inline-block h-2 w-4 rounded-sm bg-[#0f7a62]" />
                  Tinggi
                </span>
                <span className="flex items-center gap-2">
                  <i className="inline-block h-2.5 w-2.5 rounded-sm bg-white shadow-[0_0_0_2px_#fff,0_0_0_3px_var(--ink)]" />
                  Slot puncak genre
                </span>
              </div>
            </>
          ) : (
            <Empty>Belum ada data genre pada periode ini.</Empty>
          )}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Ranking film</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">Urut admissions</p>
          {data.films?.length ? (
            <div className="grid gap-2.5">
              {data.films.map((f) => (
                <div key={f.title} className="rounded-[9px] border border-[var(--line)] p-3">
                  <b className="block">{f.title}</b>
                  <small className="text-[var(--muted)]">
                    Okupansi {fmtPct(f.occupancy_pct, 0)} · RevPASH {fmtIDR(f.revpash)} ·{" "}
                    {f.admissions} admissions
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <Empty>Belum ada film pada periode ini.</Empty>
          )}
        </Panel>
      </div>
    </div>
  );
}
