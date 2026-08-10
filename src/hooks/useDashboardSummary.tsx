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
import { ApiError, fetchDashboardSummary } from "@/lib/api";
import { clearToken, hasToken } from "@/lib/auth";
import type { Alert, DashboardSummary, PeriodKey } from "@/lib/types";

type DashboardContextValue = {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  period: PeriodKey;
  siteId: string;
  alerts: Alert[];
  setPeriod: (p: PeriodKey) => void;
  setSiteId: (id: string) => void;
  dismissAlert: (index: number) => void;
  refresh: () => Promise<void>;
  logout: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [siteId, setSiteId] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refresh = useCallback(async () => {
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
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
    } finally {
      setLoading(false);
    }
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
      setPeriod,
      setSiteId,
      dismissAlert,
      refresh,
      logout,
    }),
    [data, loading, error, period, siteId, alerts, dismissAlert, refresh, logout]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
