"use client";

import { useState } from "react";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { toast } from "@/components/Toast";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { getApiUrl } from "@/lib/api";

const CATALOGUE = [
  ["Demand overflow", "Okupansi slot ≥ 80% — pertimbangkan tambah showtime.", true],
  ["Under-utilised show", "Film dengan okupansi < 25% pada periode.", true],
  ["Device offline / error", "Player tanpa heartbeat atau playback_error.", true],
  ["Snack unavailable", "Item katalog dengan available = 0.", true],
] as const;

export default function SettingsPage() {
  const [enabled, setEnabled] = useState<boolean[]>(CATALOGUE.map((x) => x[2]));
  const { cms, refresh } = useDashboard();

  return (
    <div>
      <PageHead
        title="Konfigurasi Alert"
        subtitle="Ambang batas yang dipakai untuk sinyal dari data CMS."
        controls={false}
      />
      <div className="mb-5 flex items-center gap-3 rounded-[10px] border border-[#f0d7a9] bg-[#fff8e9] px-4 py-3 text-[#755311]">
        ⚙{" "}
        <span>
          Alert yang tampil sekarang memakai sinyal CMS yang sudah ada (player, snack flag,
          okupansi). Spek lengkap + item belum di CMS: lihat PRD v2.1 dan docs/CMS-ALIGNMENT-BACKLOG.
        </span>
      </div>

      <Panel className="mb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base">Koneksi CMS</h2>
            <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
              API: {getApiUrl()}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--blue)] bg-[var(--blue)] px-3 py-2 text-xs font-bold text-white"
            onClick={() => {
              void refresh();
              toast("Memuat ulang summary + katalog CMS…");
            }}
          >
            Refresh
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-bold ${
              cms.healthOk
                ? "bg-[#e3f7ef] text-[#08745d]"
                : cms.healthOk === false
                  ? "bg-[#fde8ea] text-[var(--red)]"
                  : "bg-[#eef1f6] text-[var(--muted)]"
            }`}
          >
            /health {cms.healthOk ? "ok" : cms.healthOk === false ? "down" : "—"}
          </span>
          {cms.loading ? (
            <span className="rounded-full bg-[#eef1f6] px-2.5 py-1 font-bold text-[var(--muted)]">
              Memuat katalog…
            </span>
          ) : null}
        </div>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="pb-2 text-left text-[11px] text-[var(--muted)]">Endpoint</th>
              <th className="pb-2 text-right text-[11px] text-[var(--muted)]">Status</th>
              <th className="pb-2 text-right text-[11px] text-[var(--muted)]">Rows</th>
            </tr>
          </thead>
          <tbody>
            {cms.endpoints.length ? (
              cms.endpoints.map((ep) => (
                <tr key={ep.key}>
                  <td className="border-t border-[var(--line)] py-2">
                    {ep.key === "health" ? "/health" : `/v1/admin/${ep.key}`}
                  </td>
                  <td
                    className={`border-t border-[var(--line)] py-2 text-right font-bold ${
                      ep.ok ? "text-[#08745d]" : "text-[var(--red)]"
                    }`}
                  >
                    {ep.ok ? "ok" : ep.error || "fail"}
                  </td>
                  <td className="border-t border-[var(--line)] py-2 text-right text-[var(--muted)]">
                    {ep.count ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="border-t border-[var(--line)] py-3 text-[var(--muted)]">
                  Belum ada probe endpoint (login dulu / refresh).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <div className="grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Alert catalogue (live)</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Implemented / Partial di CMS hari ini — bukan daftar penuh PRD (vending, ack audit, dll).
          </p>
          {CATALOGUE.map((x, i) => (
            <div
              key={x[0]}
              className={`flex items-center justify-between gap-4 py-3.5 ${
                i === 0 ? "" : "border-t border-[var(--line)]"
              }`}
            >
              <div>
                <b>{x[0]}</b>
                <p className="m-0 mt-1 text-xs text-[var(--muted)]">{x[1]}</p>
              </div>
              <button
                type="button"
                aria-label="Status"
                className={`relative h-[23px] w-[41px] rounded-full border-0 ${
                  enabled[i] ? "bg-[var(--blue)]" : "bg-[#cbd3df]"
                }`}
                onClick={() => {
                  setEnabled((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
                  toast("Tampilan lokal diperbarui (ambang server tetap).");
                }}
              >
                <i
                  className={`absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition ${
                    enabled[i] ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </button>
            </div>
          ))}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base">Nilai pemicu (referensi)</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Diselaraskan dengan logika API dashboard.
          </p>
          {[
            ["Demand overflow · okupansi", "80", "%"],
            ["Under-utilised · okupansi", "25", "%"],
            ["Device online window", "2", "mnt"],
          ].map(([label, value, unit]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-t border-[var(--line)] py-3.5 first:border-t-0"
            >
              <span>{label}</span>
              <div className="flex items-center gap-2">
                <input
                  value={value}
                  type="number"
                  disabled
                  className="w-[78px] rounded-md border border-[var(--line)] px-2 py-2 text-right"
                />
                {unit}
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-[var(--muted)]">
            Ambang dikunci di server sampai CMS settings (backlog B-06). Target PRD: editable tanpa
            release.
          </p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="m-0 text-base">Sumber data (kontrak live)</h2>
        <p className="mt-1 mb-3 text-xs font-medium text-[var(--muted)]">
          Channel live: booking app + CMS schedule + edge player. Vending / counter POS = Not
          implemented di PRD v2.1 (backlog D-01 / D-02). Detail: docs/DATA-CONTRACT.md.
        </p>
        <code className="text-xs">
          summary · sites · screens · devices · shows · assets · snacks · bookings · health
        </code>
      </Panel>
    </div>
  );
}
