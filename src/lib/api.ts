import { getToken } from "./auth";
import type {
  AssetRow,
  BannerRow,
  BookingRow,
  CmsSnapshot,
  CustomerRow,
  DashboardSummary,
  DeviceAdminRow,
  PeriodKey,
  PromoRow,
  ScheduleGroup,
  ScreenRow,
  ShowRow,
  SiteOption,
  SnackRow,
  StaffRow,
  StorageStats,
} from "./types";

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

async function soft<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

function mapShow(s: ShowRow, siteName?: string): ShowRow {
  return {
    id: s.id,
    screen_id: s.screen_id,
    screen_name: s.screen_name,
    site_id: s.site_id,
    site_name: s.site_name || siteName || "",
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    title: s.title,
    status: s.status,
    price: s.price,
    show_no: s.show_no,
    booking_enabled: s.booking_enabled,
    is_playing: s.is_playing,
  };
}

function flattenShows(res: { items?: ShowRow[]; groups?: ScheduleGroup[] }): ShowRow[] {
  const fromGroups =
    res.groups?.flatMap((g) => (g.shows || []).map((s) => mapShow(s, g.site_name))) || [];
  if (fromGroups.length) return fromGroups;
  return (res.items || []).map((s) => mapShow(s));
}

/** Parallel read of existing CMS admin endpoints (no new CMS APIs). */
export async function fetchCmsSnapshot(): Promise<CmsSnapshot> {
  const [
    sitesRes,
    screensRes,
    devicesRes,
    assetsRes,
    scheduledShows,
    doneShows,
    cancelledShows,
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
    soft(api<{ items: AssetRow[] }>("/v1/admin/assets"), { items: [] }),
    soft(api<{ items: ShowRow[]; groups?: ScheduleGroup[] }>(
      "/v1/admin/shows?status=scheduled&view=grouped"
    ), { items: [] }),
    soft(api<{ items: ShowRow[] }>("/v1/admin/shows?status=done"), { items: [] }),
    soft(api<{ items: ShowRow[] }>("/v1/admin/shows?status=cancelled"), { items: [] }),
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

  const showsById = new Map<number, ShowRow>();
  for (const show of [
    ...flattenShows(scheduledShows),
    ...flattenShows(doneShows),
    ...flattenShows(cancelledShows),
  ]) {
    showsById.set(show.id, show);
  }
  const shows = [...showsById.values()];

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
