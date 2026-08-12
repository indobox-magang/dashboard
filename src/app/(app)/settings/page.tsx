"use client";

import { useState } from "react";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { NotInCms } from "@/components/NotInCms";
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
        title={
          <>
            Konfigurasi Alert <NotInCms />
          </>
        }
        subtitle="Ambang & katalog alert tidak disimpan di indobox-cms — hanya tampilan lokal dashboard."
        controls={false}
      />
      <div className="notice">
        ⚙{" "}
        <span>
          Sumber sinyal (device, snack, okupansi) dari CMS; modul pengaturan alert sendiri{" "}
          <b>(Belum ada di cms)</b>. Alert live memakai sinyal CMS yang sudah ada — spek lengkap
          + item belum di CMS: PRD v2.1 / docs/CMS-ALIGNMENT-BACKLOG.
        </span>
      </div>

      <Panel className="mb-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base text-white">Koneksi CMS</h2>
            <p className="mt-1 mb-0 text-xs font-medium text-[var(--muted)]">
              API: {getApiUrl()}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3 py-2 text-xs font-bold text-[#1a1205]"
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
                  <td className="border-t border-[var(--panel-border)] py-2 text-slate-200">
                    {ep.key === "health" ? "/health" : `/v1/admin/${ep.key}`}
                  </td>
                  <td
                    className={`border-t border-[var(--panel-border)] py-2 text-right font-bold ${
                      ep.ok ? "text-[#08745d]" : "text-[var(--red)]"
                    }`}
                  >
                    {ep.ok ? "ok" : ep.error || "fail"}
                  </td>
                  <td className="border-t border-[var(--panel-border)] py-2 text-right text-[var(--muted)]">
                    {ep.count ?? "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="border-t border-[var(--panel-border)] py-3 text-[var(--muted)]"
                >
                  Belum ada probe endpoint (login dulu / refresh).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <div className="grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base text-white">
            Alert catalogue (live) <NotInCms />
          </h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Implemented / Partial di CMS hari ini — toggle hanya tampilan lokal; bukan daftar penuh
            PRD (vending, ack audit, dll).
          </p>
          {CATALOGUE.map((x, i) => (
            <div
              key={x[0]}
              className={`flex items-center justify-between gap-4 py-3.5 ${
                i === 0 ? "" : "border-t border-[var(--panel-border)]"
              }`}
            >
              <div>
                <b className="text-white">{x[0]}</b>
                <p className="m-0 mt-1 text-xs text-[var(--muted)]">{x[1]}</p>
              </div>
              <button
                type="button"
                aria-label="Status"
                className={`relative h-[23px] w-[41px] rounded-full border-0 ${
                  enabled[i] ? "bg-[var(--accent)]" : "bg-[#3a4d6b]"
                }`}
                onClick={() => {
                  setEnabled((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
                  toast("Tampilan lokal diperbarui (Belum ada di cms).");
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
          <h2 className="m-0 text-base text-white">
            Nilai pemicu (referensi) <NotInCms />
          </h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Tidak ada konfigurasi threshold di CMS admin.
          </p>
          {[
            ["Demand overflow · okupansi", "80", "%"],
            ["Under-utilised · okupansi", "25", "%"],
            ["Device online window", "2", "mnt"],
          ].map(([label, value, unit]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-t border-[var(--panel-border)] py-3.5 first:border-t-0"
            >
              <span className="text-slate-200">{label}</span>
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <input className="input w-[78px] text-right" value={value} type="number" disabled />
                {unit}
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-[var(--muted)]">
            Ambang dikunci di kode API dashboard summary — bukan setting CMS (backlog B-06). Target
            PRD: editable tanpa release.
          </p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="m-0 text-base text-white">Sumber data & celah CMS</h2>
        <p className="mt-1 mb-3 text-xs font-medium text-[var(--muted)]">
          Channel live: booking app + CMS schedule + edge player. Entitas dipakai vs belum ada di
          CMS — detail: docs/DATA-CONTRACT.md.
        </p>
        <div className="mb-3 grid gap-2 text-sm text-slate-200">
          <div>
            Vending machine / stockout / telemetry <NotInCms />
          </div>
          <div>
            Private screening sebagai stream revenue <NotInCms />
          </div>
          <div>
            Inventori stok harian / restock log <NotInCms />
          </div>
          <div>
            Persistensi acknowledgement alert <NotInCms />
          </div>
        </div>
        <code className="text-xs text-[var(--accent)]">
          Ada di CMS: summary · sites · screens · devices · shows · assets · snacks · bookings ·
          health · showtime_seats · booking_snacks
        </code>
      </Panel>
    </div>
  );
}
