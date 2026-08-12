/**
 * Dashboard summary types — mirror GET /v1/admin/dashboard/summary.
 * Semantic notes (CMS-aligned): see docs/DATA-CONTRACT.md and PRD v2.1.
 */

export type SiteOption = {
  id: number;
  code: string;
  name: string;
};

export type Deltas = {
  net_revenue_pct?: number | null;
  admissions_pct?: number | null;
  occupancy_pts?: number | null;
  atp_pct?: number | null;
  fnb_per_admission_pct?: number | null;
  revpash_pct?: number | null;
};

/** KPIs from CMS booking + shows. ticket_* is face total today (not full PRD net). */
export type KPIs = {
  ticket_revenue: number;
  public_ticket_revenue?: number;
  private_ticket_revenue?: number;
  /** In-app booking_snacks only — not counter/vending. */
  snack_revenue: number;
  /** ticket_revenue + snack_revenue (current API proxy for “net”). */
  net_revenue: number;
  /** Sold seats on paid|used bookings (not scanned-only). */
  admissions: number;
  /** Uses screens.rows * cols as capacity proxy. */
  occupancy_pct: number;
  atp: number;
  fnb_per_admission: number;
  revpash: number;
  deltas: Deltas;
};

/** Mix is ticket vs in-app snack share — no vending/counter split yet. */
export type Mix = {
  ticket_pct: number;
  snack_pct: number;
  public_ticket_pct?: number;
  private_ticket_pct?: number;
  snack_mix_pct?: number;
};

export type TrendPoint = {
  date: string;
  label: string;
  revenue: number;
};

export type BranchRow = {
  site_id: number;
  name: string;
  revenue: number;
  occupancy_pct: number;
  revpash: number;
  change_pct?: number | null;
};

/** Edge player row from cms.devices — not a vending machine. */
export type DeviceRow = {
  id: number;
  name: string;
  site: string;
  /** Heartbeat within ~120s. */
  online: boolean;
  last_heartbeat_at?: string | null;
  playback_status?: string;
  playback_error?: string;
  status_label: string;
  warn: boolean;
  /** Extra fields when sourced from GET /v1/admin/devices */
  hostname?: string;
  current_show_title?: string;
  agent_version?: string;
};

export type Heatmap = {
  days: string[];
  slots: string[];
  cells: number[][];
};

export type GenreRow = {
  genre: string;
  slots: number[];
};

export type FilmRow = {
  title: string;
  occupancy_pct: number;
  revpash: number;
  admissions: number;
};

export type FNBItem = {
  name: string;
  units: number;
  revenue: number;
  share_pct: number;
};

export type FNBHour = {
  slot: string;
  pct: number;
};

export type FNBDeltas = {
  revenue_pct?: number | null;
  attach_pts?: number | null;
  basket_pct?: number | null;
};

/** F&B block = booking-app snacks linked to tickets. */
export type FNBBlock = {
  revenue: number;
  attach_pct: number;
  basket: number;
  buyers: number;
  visitors: number;
  items: FNBItem[];
  hours: FNBHour[];
  deltas: FNBDeltas;
};

export type Alert = {
  level: "high" | "med" | string;
  title: string;
  detail: string;
  action: string;
  type?: string;
  key?: string;
};

export type DashAlertCatalogue = {
  demand_overflow: boolean;
  under_utilised: boolean;
  device_offline: boolean;
  snack_unavailable: boolean;
};

export type DashAlertThresholds = {
  demand_overflow_occupancy_pct: number;
  under_utilised_occupancy_pct: number;
  device_online_window_minutes: number;
};

export type DashAlertSettings = {
  catalogue: DashAlertCatalogue;
  thresholds: DashAlertThresholds;
  updated_at?: string | null;
};

export type Health = {
  /** Player fleet online %, not vending uptime. */
  device_online_pct: number;
  devices_offline: number;
  fnb_per_admission: number;
};

export type SnackAvail = {
  id: string;
  name: string;
};

export type SnackInventoryRow = {
  site_id: number;
  site_name: string;
  snack_id: string;
  snack_name: string;
  qty_on_hand: number;
  updated_at: string;
  catalog_available?: number;
};

export type SnackRestockRow = {
  id: number;
  site_id: number;
  site_name: string;
  snack_id: string;
  snack_name: string;
  qty_delta: number;
  qty_after: number;
  note: string;
  created_by?: number;
  created_at: string;
};

export type VendingSlot = {
  slot_code: string;
  product_name: string;
  qty_on_hand: number;
  capacity: number;
  stockout: boolean;
};

export type VendingEvent = {
  event_type: string;
  detail: string;
  occurred_at: string;
};

export type VendingMachine = {
  id: number;
  site_id: number;
  site_name: string;
  code: string;
  name: string;
  status: string;
  uptime_pct: number;
  last_telemetry_at?: string | null;
  error_code?: string | null;
  is_seed?: boolean;
  open_stockouts: number;
  slots: VendingSlot[];
  recent_events: VendingEvent[];
};

export type DashboardSummary = {
  as_of: string;
  period: string;
  label: string;
  site_id?: number | null;
  sites: SiteOption[];
  kpis: KPIs;
  mix: Mix;
  trend: TrendPoint[];
  branches: BranchRow[];
  devices: DeviceRow[];
  heat: Heatmap;
  genres: GenreRow[];
  films: FilmRow[];
  fnb: FNBBlock;
  alerts: Alert[];
  health: Health;
  /** Catalog snacks with available = 0 (not stockout duration). */
  unavailable_snacks: SnackAvail[];
};

export type PeriodKey = "1d" | "7d" | "28d";

export type ScreenRow = {
  id: number;
  site_id: number;
  name: string;
  rows?: number;
  cols?: number;
};

export type DeviceAdminRow = {
  id: number;
  site_id: number;
  site: string;
  name: string;
  status?: string;
  last_heartbeat_at?: string;
  playback_status?: string;
  playback_error?: string;
};

export type AssetRow = {
  id: number;
  kind: string;
  title: string;
  status: string;
  genre?: string;
  duration_ms?: number;
  created_at?: string;
};

export type ShowRow = {
  id: number;
  screen_id: number;
  screen_name: string;
  site_name: string;
  starts_at: string;
  ends_at?: string;
  title: string;
  status: string;
  price?: number;
  show_no?: number;
  booking_enabled?: boolean;
  is_private?: boolean;
};

export type ScheduleGroup = {
  site_id: number;
  site_name: string;
  shows: ShowRow[];
};

export type BookingRow = {
  id: string;
  code: string;
  status: string;
  total: number;
  created_at: string;
  paid_at?: string;
  user_name: string;
  email?: string;
  movie_title: string;
  start_time: string;
  city: string;
};

export type SnackRow = {
  id: string;
  name: string;
  size: string;
  price: number;
  category: string;
  available: number;
};

export type PromoRow = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  kind: string;
  value_pct: number;
  value_flat: number;
  active: number;
};

export type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  active: number;
};

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  points: number;
  active: boolean;
  booking_count: number;
  tier: string;
};

export type StorageStats = {
  bucket_name?: string;
  total_quota_bytes?: number;
  total_size_bytes: number;
  total_count: number;
  breakdown: { kind: string; count: number; total_size_bytes: number }[];
};

export type CmsSnapshot = {
  sites: SiteOption[];
  screens: ScreenRow[];
  devices: DeviceAdminRow[];
  assets: AssetRow[];
  shows: ShowRow[];
  bookings: BookingRow[];
  snacks: SnackRow[];
  promos: PromoRow[];
  banners: BannerRow[];
  staff: StaffRow[];
  customers: CustomerRow[];
  storage: StorageStats;
  fetched_at: string;
};
