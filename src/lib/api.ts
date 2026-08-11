import { getToken } from "./auth";
import type { DashboardSummary, PeriodKey } from "./types";

/** CMS Go API — login only. Dashboard data comes from same-origin BFF. */
const DEFAULT_CMS_API = "http://localhost:8080";

export function getCmsApiUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CMS_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_CMS_API
  ).replace(/\/$/, "");
}

/** @deprecated use getCmsApiUrl — kept for any leftover imports */
export function getApiUrl(): string {
  return getCmsApiUrl();
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function cmsFetch<T>(
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
  const res = await fetch(`${getCmsApiUrl()}${path}`, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText || "request failed", res.status);
  }
  return body as T;
}

async function bffFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText || "request failed", res.status);
  }
  return body as T;
}

export async function loginAdmin(email: string, password: string) {
  return cmsFetch<{ token: string; email: string; display_name?: string }>(
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
  return bffFetch<DashboardSummary>(`/api/dashboard/summary?${params}`);
}
