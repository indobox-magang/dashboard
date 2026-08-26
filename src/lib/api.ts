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
import type {
  AssetRow,
  BannerRow,
  BookingRow,
  CmsSnapshot,
  CustomerRow,
  DashAlertSettings,
  DashboardSummary,
  DeviceAdminRow,
  PeriodKey,
  PromoRow,
  ScheduleGroup,
  ScreenRow,
  ShowRow,
  SiteOption,
  SnackInventoryRow,
  SnackRestockRow,
  SnackRow,
  StaffRow,
  StorageStats,
  VendingMachine,
} from "./types";

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

/**
 * KPI summary from CMS admin API (shared Postgres).
 * Prefer this over the local BFF now that CMS destin-embun mounts
 * GET /v1/admin/dashboard/summary (alerts with stable keys, private mix).
 */
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

export async function fetchAlertSettings() {
  return api<DashAlertSettings>("/v1/admin/dashboard/alert-settings");
}

export async function saveAlertSettings(settings: DashAlertSettings) {
  return api<DashAlertSettings>("/v1/admin/dashboard/alert-settings", {
    method: "PUT",
    body: JSON.stringify({
      catalogue: settings.catalogue,
      thresholds: settings.thresholds,
    }),
  });
}

export async function acknowledgeAlert(alertKey: string, reason = "") {
  return api<{
    alert_key: string;
    reason: string;
    admin_user_id?: number;
    acked_at: string;
  }>("/v1/admin/dashboard/alert-acknowledgements", {
    method: "POST",
    body: JSON.stringify({ alert_key: alertKey, reason }),
  });
}

export async function fetchSnackInventory(siteId?: string) {
  const params = new URLSearchParams();
  if (siteId) params.set("site_id", siteId);
  const q = params.toString();
  return api<{ items: SnackInventoryRow[] }>(
    `/v1/admin/inventory/snacks${q ? `?${q}` : ""}`
  );
}

export async function restockSnackInventory(input: {
  site_id: number;
  snack_id: string;
  qty_delta: number;
  note?: string;
}) {
  return api<{ restock: SnackRestockRow; inventory: SnackInventoryRow }>(
    "/v1/admin/inventory/snacks/restock",
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  );
}

export async function fetchSnackRestocks(opts?: { siteId?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (opts?.siteId) params.set("site_id", opts.siteId);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const q = params.toString();
  return api<{ items: SnackRestockRow[] }>(
    `/v1/admin/inventory/snacks/restocks${q ? `?${q}` : ""}`
  );
}

export async function fetchVendingMachines(siteId?: string) {
  const params = new URLSearchParams();
  if (siteId) params.set("site_id", siteId);
  const q = params.toString();
  return api<{ items: VendingMachine[]; note?: string }>(
    `/v1/admin/vending/machines${q ? `?${q}` : ""}`
  );
}

async function soft<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

/** Parallel read of existing CMS admin endpoints (no new CMS APIs). */
export async function fetchCmsSnapshot(): Promise<CmsSnapshot> {
  const [
    sitesRes,
    screensRes,
    devicesRes,
    assetsRes,
    showsRes,
    bookings,
    snacks,
    promos,
    banners,
    staff,
    customers,
    storage,
  ] = await Promise.all([
    soft(api<{ items: SiteOption[] }>("/v1/admin/sites"), { items: [] }),
    soft(api<{ items: ScreenRow[] }>("/v1/admin/screens"), { items: [] }),
    soft(api<{ devices: DeviceAdminRow[] }>("/v1/admin/devices"), { devices: [] }),
    soft(api<{ items: AssetRow[] }>("/v1/admin/assets?kind=feature&status=verified"), {
      items: [],
    }),
    soft(api<{ items: ShowRow[]; groups?: ScheduleGroup[] }>(
      "/v1/admin/shows?status=scheduled&view=grouped"
    ), { items: [] }),
    soft(api<BookingRow[]>("/v1/admin/bookings"), []),
    soft(api<SnackRow[]>("/v1/admin/snacks"), []),
    soft(api<PromoRow[]>("/v1/admin/promos"), []),
    soft(api<BannerRow[]>("/v1/admin/banners"), []),
    soft(api<StaffRow[]>("/v1/admin/booking-staff"), []),
    soft(api<CustomerRow[]>("/v1/admin/booking-users"), []),
    soft(api<StorageStats>("/v1/admin/storage-stats"), {
      total_size_bytes: 0,
      total_count: 0,
      breakdown: [],
    }),
  ]);

  const showsFromGroups =
    showsRes.groups?.flatMap((g) =>
      (g.shows || []).map((s) => ({
        id: s.id,
        screen_id: s.screen_id,
        screen_name: s.screen_name,
        site_name: s.site_name || g.site_name,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        title: s.title,
        status: s.status,
        price: s.price,
        show_no: s.show_no,
        booking_enabled: s.booking_enabled,
      }))
    ) || [];

  const shows = showsFromGroups.length ? showsFromGroups : showsRes.items || [];

  return {
    sites: sitesRes.items || [],
    screens: screensRes.items || [],
    devices: devicesRes.devices || [],
    assets: assetsRes.items || [],
    shows,
    bookings: bookings || [],
    snacks: snacks || [],
    promos: promos || [],
    banners: banners || [],
    staff: staff || [],
    customers: customers || [],
    storage,
    fetched_at: new Date().toISOString(),
  };
}
