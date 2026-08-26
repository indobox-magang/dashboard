export type SiteOption = {
  id: number;
  code: string;
  name: string;
  city?: string;
  address?: string;
  timezone?: string;
  active?: boolean;
};

export type Deltas = {
  net_revenue_pct?: number | null;
  admissions_pct?: number | null;
  occupancy_pts?: number | null;
  atp_pct?: number | null;
  fnb_per_admission_pct?: number | null;
  revpash_pct?: number | null;
};

export type KPIs = {
  ticket_revenue: number;
  snack_revenue: number;
  net_revenue: number;
  admissions: number;
  occupancy_pct: number;
  atp: number;
  fnb_per_admission: number;
  revpash: number;
  deltas: Deltas;
};

export type Mix = {
  ticket_pct: number;
  snack_pct: number;
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

export type DeviceRow = {
  id: number;
  name: string;
  site: string;
  online: boolean;
  last_heartbeat_at?: string | null;
  playback_status?: string;
  playback_error?: string;
  status_label: string;
  warn: boolean;
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
};

export type Health = {
  device_online_pct: number;
  devices_offline: number;
  fnb_per_admission: number;
};

export type SnackAvail = {
  id: string;
  name: string;
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
  hostname?: string;
  screens?: number[];
  last_heartbeat_at?: string;
  playback_status?: string;
  playback_error?: string;
  current_show_id?: number;
  current_show_title?: string;
  current_asset_id?: number;
  agent_version?: string;
  agent_git_sha?: string;
  agent_updated_at?: string;
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
  site_id?: number;
  site_name: string;
  starts_at: string;
  ends_at?: string;
  title: string;
  status: string;
  price?: number;
  show_no?: number;
  booking_enabled?: boolean;
  is_playing?: boolean;
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

export type BookingStatusCount = {
  status: "pending" | "paid" | "used" | "expired" | "cancelled";
  count: number;
};

export type BookingFunnelMetrics = {
  total: number;
  converted: number;
  conversion_pct: number;
  stages: BookingStatusCount[];
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
