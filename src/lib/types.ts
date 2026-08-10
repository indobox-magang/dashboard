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
