"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, fetchCmsSnapshot } from "@/lib/api";
import { clearToken, hasToken } from "@/lib/auth";
import type { CmsSnapshot } from "@/lib/types";

export function useCmsSnapshot() {
  const [data, setData] = useState<CmsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const snap = await fetchCmsSnapshot();
      setData(snap);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat data CMS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function isDeviceOnline(lastHeartbeat?: string): boolean {
  if (!lastHeartbeat) return false;
  const t = new Date(lastHeartbeat).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 120_000;
}

export function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}
