"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  fetchAssets,
  fetchBookings,
  fetchDashboardSummary,
  fetchDevices,
  fetchHealth,
  fetchScreens,
  fetchShowsForDashboard,
  fetchSites,
  fetchSnacks,
} from "@/lib/api";
import type { CmsCatalog, CmsEndpointStatus } from "@/lib/cms";
import { clearToken, hasToken } from "@/lib/auth";
import type { Alert, DashboardSummary, PeriodKey } from "@/lib/types";

type DashboardContextValue = {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  period: PeriodKey;
  siteId: string;
  alerts: Alert[];
  cms: CmsCatalog;
  setPeriod: (p: PeriodKey) => void;
  setSiteId: (id: string) => void;
  dismissAlert: (index: number) => void;
  refresh: () => Promise<void>;
  logout: () => void;
};

const emptyCms = (): CmsCatalog => ({
  sites: [],
  screens: [],
  devices: [],
  shows: [],
  assets: [],
  snacks: [],
  bookings: [],
  healthOk: null,
  endpoints: [],
  loading: false,
  error: null,
});

const DashboardContext = createContext<DashboardContextValue | null>(null);

async function loadOne<T>(
  key: string,
  fn: () => Promise<T>,
  endpoints: CmsEndpointStatus[]
): Promise<T | null> {
  try {
    const value = await fn();
    const count = Array.isArray(value) ? value.length : undefined;
    endpoints.push({ key, ok: true, count });
    return value;
  } catch (err) {
    endpoints.push({
      key,
      ok: false,
      error: err instanceof Error ? err.message : "failed",
    });
    return null;
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [siteId, setSiteId] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cms, setCms] = useState<CmsCatalog>(emptyCms);

  const refresh = useCallback(async () => {
    if (!hasToken()) {
      setLoading(false);
      setCms(emptyCms());
      return;
    }
    setLoading(true);
    setError(null);
    setCms((prev) => ({ ...prev, loading: true, error: null }));

    const endpoints: CmsEndpointStatus[] = [];

    try {
      const summary = await fetchDashboardSummary({ period, siteId });
      setData(summary);
      setAlerts(summary.alerts ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data";
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        window.location.href = "/login";
        return;
      }
      setError(message);
    }

    const siteFilter = siteId || undefined;
    const [sites, screens, devices, shows, assets, snacks, bookings] =
      await Promise.all([
        loadOne("sites", fetchSites, endpoints),
        loadOne("screens", () => fetchScreens(siteFilter), endpoints),
        loadOne("devices", () => fetchDevices(siteFilter), endpoints),
        loadOne("shows", fetchShowsForDashboard, endpoints),
        loadOne("assets", () => fetchAssets("feature"), endpoints),
        loadOne("snacks", fetchSnacks, endpoints),
        loadOne("bookings", fetchBookings, endpoints),
      ]);
    await loadOne("health", fetchHealth, endpoints);

    const failed = endpoints.filter((e) => !e.ok && e.key !== "health");
    const siteList = sites ?? [];
    let filteredShows = shows ?? [];
    if (siteFilter) {
      const siteIdNum = Number(siteFilter);
      const siteName = siteList.find((s) => s.id === siteIdNum)?.name || "";
      filteredShows = filteredShows.filter(
        (s) => s.site_id === siteIdNum || (siteName && s.site_name === siteName)
      );
    }

    const healthEp = endpoints.find((e) => e.key === "health");
    setCms({
      sites: siteList,
      screens: screens ?? [],
      devices: devices ?? [],
      shows: filteredShows,
      assets: assets ?? [],
      snacks: snacks ?? [],
      bookings: bookings ?? [],
      healthOk: healthEp ? healthEp.ok : null,
      endpoints,
      loading: false,
      error: failed.length
        ? `${failed.length} endpoint CMS gagal (lihat Settings)`
        : null,
    });

    setLoading(false);
  }, [period, siteId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dismissAlert = useCallback((index: number) => {
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({
      data,
      loading,
      error,
      period,
      siteId,
      alerts,
      cms,
      setPeriod,
      setSiteId,
      dismissAlert,
      refresh,
      logout,
    }),
    [data, loading, error, period, siteId, alerts, cms, dismissAlert, refresh, logout]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
