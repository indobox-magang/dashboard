import { getToken } from "./auth";
import type {
  CmsAsset,
  CmsBooking,
  CmsDevice,
  CmsScreen,
  CmsShow,
  CmsSite,
  CmsSnack,
} from "./cms";
import type { DashboardSummary, PeriodKey } from "./types";

/** Prefer NEXT_PUBLIC_API_URL; local CMS often runs on :8081 when :8080 is taken. */
const DEFAULT_API = "http://127.0.0.1:8081";

export function getApiUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API).replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${getApiUrl()}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText || "request failed", res.status);
  }
  return body as T;
}

export async function loginAdmin(email: string, password: string) {
  return api<{ token: string; email: string; display_name?: string }>(
    "/v1/admin/auth/login",
    {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function fetchDashboardSummary(opts: {
  period: PeriodKey;
  siteId?: string;
}) {
  const params = new URLSearchParams({ period: opts.period });
  if (opts.siteId) params.set("site_id", opts.siteId);
  return api<DashboardSummary>(`/v1/admin/dashboard/summary?${params}`);
}

export async function fetchHealth(): Promise<{ status: string }> {
  return api<{ status: string }>("/health", { auth: false });
}

export async function fetchSites(): Promise<CmsSite[]> {
  const res = await api<{ items: CmsSite[] }>("/v1/admin/sites");
  return res.items ?? [];
}

export async function fetchScreens(siteId?: string): Promise<CmsScreen[]> {
  const q = siteId ? `?site_id=${encodeURIComponent(siteId)}` : "";
  const res = await api<{ items: CmsScreen[] }>(`/v1/admin/screens${q}`);
  return res.items ?? [];
}

export async function fetchDevices(siteId?: string): Promise<CmsDevice[]> {
  const q = siteId ? `?site_id=${encodeURIComponent(siteId)}` : "";
  const res = await api<{ devices: CmsDevice[] }>(`/v1/admin/devices${q}`);
  return res.devices ?? [];
}

export async function fetchShows(status = "scheduled"): Promise<CmsShow[]> {
  const res = await api<{ items?: CmsShow[] }>(
    `/v1/admin/shows?status=${encodeURIComponent(status)}`
  );
  return res.items ?? [];
}

/** Merge scheduled + done (demo seed often uses done). */
export async function fetchShowsForDashboard(): Promise<CmsShow[]> {
  const [scheduled, done] = await Promise.all([
    fetchShows("scheduled").catch(() => [] as CmsShow[]),
    fetchShows("done").catch(() => [] as CmsShow[]),
  ]);
  const byId = new Map<number, CmsShow>();
  for (const s of [...scheduled, ...done]) byId.set(s.id, s);
  return [...byId.values()].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
}

export async function fetchAssets(kind = "feature"): Promise<CmsAsset[]> {
  const res = await api<{ items: CmsAsset[] }>(
    `/v1/admin/assets?kind=${encodeURIComponent(kind)}`
  );
  return res.items ?? [];
}

export async function fetchSnacks(): Promise<CmsSnack[]> {
  const res = await api<CmsSnack[] | { items: CmsSnack[] }>("/v1/admin/snacks");
  if (Array.isArray(res)) return res;
  return res.items ?? [];
}

export async function fetchBookings(): Promise<CmsBooking[]> {
  const res = await api<CmsBooking[] | { items: CmsBooking[] }>("/v1/admin/bookings");
  if (Array.isArray(res)) return res;
  return res.items ?? [];
}
