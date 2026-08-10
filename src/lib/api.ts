import { getToken } from "./auth";
import type { DashboardSummary, PeriodKey } from "./types";

const DEFAULT_API = "http://localhost:8080";

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
