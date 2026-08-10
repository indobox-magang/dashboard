"use client";

import { useState } from "react";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { toast } from "@/components/Toast";

const CATALOGUE = [
  ["Demand overflow", "Okupansi slot ≥ 80% — pertimbangkan tambah showtime.", true],
  ["Under-utilised show", "Film dengan okupansi < 25% pada periode.", true],
  ["Device offline / error", "Player tanpa heartbeat atau playback_error.", true],
  ["Snack unavailable", "Item katalog dengan available = 0.", true],
] as const;

export default function SettingsPage() {
  const [enabled, setEnabled] = useState<boolean[]>(CATALOGUE.map((x) => x[2]));

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
          Alert dihitung di API dari device offline, snack unavailable, overflow okupansi, dan
          under-utilised film.
        </span>
      </div>

      <div className="grid grid-cols-[1.45fr_0.85fr] gap-4 max-[1100px]:grid-cols-1">
        <Panel>
          <h2 className="m-0 text-base">Alert catalogue</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Hanya sinyal yang sumber datanya ada di CMS.
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
            Ambang ini saat ini dikunci di server. Ubah lewat konfigurasi API bila diperlukan.
          </p>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="m-0 text-base">Sumber data</h2>
        <p className="mt-1 mb-3 text-xs font-medium text-[var(--muted)]">
          Dashboard ini tidak memakai data vending atau private screening terpisah — hanya entitas
          yang ada di indobox-cms.
        </p>
        <code className="text-xs">
          sites · shows · bookings · showtime_seats · booking_snacks · snacks · devices
        </code>
      </Panel>
    </div>
  );
}
