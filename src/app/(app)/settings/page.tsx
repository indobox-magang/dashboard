"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { toast } from "@/components/Toast";
import { useDashboard } from "@/hooks/useDashboardSummary";
import {
  ApiError,
  fetchAlertSettings,
  getApiUrl,
  saveAlertSettings,
} from "@/lib/api";
import type { DashAlertCatalogue, DashAlertSettings, DashAlertThresholds } from "@/lib/types";

const CATALOGUE_ROWS: {
  key: keyof DashAlertCatalogue;
  title: string;
  hint: string;
}[] = [
  {
    key: "demand_overflow",
    title: "Demand overflow",
    hint: "Okupansi periode ≥ ambang overflow — pertimbangkan tambah showtime.",
  },
  {
    key: "under_utilised",
    title: "Under-utilised show",
    hint: "Okupansi periode di bawah ambang under-utilised.",
  },
  {
    key: "device_offline",
    title: "Device offline / error",
    hint: "Player tanpa heartbeat atau playback_error.",
  },
  {
    key: "snack_unavailable",
    title: "Snack unavailable",
    hint: "Item katalog dengan available = 0.",
  },
];

const DEFAULT_SETTINGS: DashAlertSettings = {
  catalogue: {
    demand_overflow: true,
    under_utilised: true,
    device_offline: true,
    snack_unavailable: true,
  },
  thresholds: {
    demand_overflow_occupancy_pct: 80,
    under_utilised_occupancy_pct: 25,
    device_online_window_minutes: 2,
  },
};

export default function SettingsPage() {
  const { cms, refresh } = useDashboard();
  const [settings, setSettings] = useState<DashAlertSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = await fetchAlertSettings();
      setSettings({
        catalogue: { ...DEFAULT_SETTINGS.catalogue, ...remote.catalogue },
        thresholds: { ...DEFAULT_SETTINGS.thresholds, ...remote.thresholds },
        updated_at: remote.updated_at,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat settings";
      if (err instanceof ApiError && err.status === 401) {
        window.location.href = "/login";
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: DashAlertSettings) {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveAlertSettings(next);
      setSettings({
        catalogue: saved.catalogue,
        thresholds: saved.thresholds,
        updated_at: saved.updated_at,
      });
      toast("Pengaturan alert disimpan ke CMS.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan";
      setError(message);
      toast(message);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function toggleCatalogue(key: keyof DashAlertCatalogue) {
    const next: DashAlertSettings = {
      ...settings,
      catalogue: { ...settings.catalogue, [key]: !settings.catalogue[key] },
    };
    setSettings(next);
    void persist(next);
  }

  function setThreshold(key: keyof DashAlertThresholds, raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setSettings((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [key]: n },
    }));
  }

  async function saveThresholds() {
    await persist(settings);
  }

  const t = settings.thresholds;

  return (
    <div>
      <PageHead
        title="Konfigurasi Alert"
        subtitle="Katalog & ambang alert disimpan di indobox-cms (system_settings)."
        controls={false}
      />
      <div className="notice">
        ⚙{" "}
        <span>
          Sumber sinyal (device, snack, okupansi) dan pengaturan alert sekarang dari CMS. Ubah di
          sini langsung memengaruhi <b>/v1/admin/dashboard/summary</b>.
          {settings.updated_at ? (
            <>
              {" "}
              Terakhir diubah: <b>{new Date(settings.updated_at).toLocaleString()}</b>.
            </>
          ) : null}
        </span>
      </div>
      {error ? (
        <div className="notice mb-4" role="alert">
          ⚠ {error}
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-[var(--muted)]">Memuat pengaturan dari CMS…</p>
      ) : null}

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
          <h2 className="m-0 text-base text-white">Alert catalogue</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Toggle disimpan ke CMS. Dinonaktifkan = tipe alert tidak muncul di summary.
          </p>
          {CATALOGUE_ROWS.map((row, i) => (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-4 py-3.5 ${
                i === 0 ? "" : "border-t border-[var(--panel-border)]"
              }`}
            >
              <div>
                <b className="text-white">{row.title}</b>
                <p className="m-0 mt-1 text-xs text-[var(--muted)]">{row.hint}</p>
              </div>
              <button
                type="button"
                aria-label={row.title}
                disabled={saving || loading}
                className={`relative h-[23px] w-[41px] rounded-full border-0 disabled:opacity-50 ${
                  settings.catalogue[row.key] ? "bg-[var(--accent)]" : "bg-[#3a4d6b]"
                }`}
                onClick={() => toggleCatalogue(row.key)}
              >
                <i
                  className={`absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition ${
                    settings.catalogue[row.key] ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </button>
            </div>
          ))}
        </Panel>
        <Panel>
          <h2 className="m-0 text-base text-white">Nilai pemicu</h2>
          <p className="mt-1 mb-4 text-xs font-medium text-[var(--muted)]">
            Ambang dipakai engine alert CMS saat membangun summary.
          </p>
          {(
            [
              ["Demand overflow · okupansi", "demand_overflow_occupancy_pct", "%"],
              ["Under-utilised · okupansi", "under_utilised_occupancy_pct", "%"],
              ["Device online window", "device_online_window_minutes", "mnt"],
            ] as const
          ).map(([label, key, unit]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 border-t border-[var(--panel-border)] py-3.5 first:border-t-0"
            >
              <span className="text-slate-200">{label}</span>
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <input
                  className="input w-[78px] text-right"
                  value={t[key]}
                  type="number"
                  disabled={loading || saving}
                  onChange={(e) => setThreshold(key, e.target.value)}
                />
                {unit}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost mt-4 w-full text-[var(--accent)] disabled:opacity-50"
            disabled={loading || saving}
            onClick={() => void saveThresholds()}
          >
            {saving ? "Menyimpan…" : "Simpan ambang ke CMS"}
          </button>
        </Panel>
      </div>

      <Panel className="mt-4">
        <h2 className="m-0 text-base text-white">Sumber data & celah CMS</h2>
        <p className="mt-1 mb-3 text-xs font-medium text-[var(--muted)]">
          Channel live: booking app + CMS schedule + edge player. Entitas dipakai vs belum ada di
          CMS — detail: docs/DATA-CONTRACT.md.
        </p>
        <div className="mb-3 grid gap-2 text-sm text-slate-200">
          <div className="text-[var(--muted)]">
            Vending machine / stockout / telemetry —{" "}
            <span className="text-[var(--accent)]">seed simulasi di CMS (bukan vendor live)</span>
          </div>
          <div className="text-[var(--muted)]">
            Private screening sebagai stream revenue —{" "}
            <span className="text-[var(--accent)]">sudah di CMS (shows.is_private)</span>
          </div>
          <div className="text-[var(--muted)]">
            Inventori stok harian / restock log —{" "}
            <span className="text-[var(--accent)]">sudah di CMS (+ seed)</span>
          </div>
          <div className="text-[var(--muted)]">
            Alert settings + acknowledgement —{" "}
            <span className="text-[var(--accent)]">sudah di CMS</span>
          </div>
        </div>
        <code className="text-xs text-[var(--accent)]">
          Ada di CMS: summary · sites · screens · devices · shows · assets · snacks · bookings ·
          health · showtime_seats · booking_snacks · snack_inventory · snack_restocks ·
          alert-settings · alert-acknowledgements · shows.is_private · vending (seed)
        </code>
      </Panel>
    </div>
  );
}
