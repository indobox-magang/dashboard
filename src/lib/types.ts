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
