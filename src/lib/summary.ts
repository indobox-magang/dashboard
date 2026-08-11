import type {
  Alert,
  BranchRow,
  DashboardSummary,
  DeviceRow,
  FilmRow,
  GenreRow,
  PeriodKey,
  TrendPoint,
} from "@/lib/types";
import { dbQuery } from "./db";

const DAY_MS = 86_400_000;
const DEVICE_ONLINE_MS = 120_000;

type Window = { start: Date; end: Date; label: string; days: number };

function periodWindow(period: PeriodKey, now = new Date()): Window {
  const end = now;
  const days = period === "1d" ? 1 : period === "7d" ? 7 : 28;
  const start = new Date(end.getTime() - days * DAY_MS);
  const label =
    period === "1d" ? "Hari ini (24 jam)" : period === "7d" ? "7 hari terakhir" : "28 hari terakhir";
  return { start, end, label, days };
}

function prevWindow(w: Window): Window {
  return {
    start: new Date(w.start.getTime() - w.days * DAY_MS),
    end: w.start,
    label: "previous",
    days: w.days,
  };
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function ptsChange(curr: number, prev: number): number | null {
  return curr - prev;
}

type Agg = {
  ticket_revenue: number;
  snack_revenue: number;
  admissions: number;
  capacity: number;
  seat_hours: number;
  paid_bookings: number;
  snack_buyers: number;
};

const paidFilter = `b.status IN ('paid', 'used')`;
const eventAt = `COALESCE(b.paid_at, b.created_at)`;

async function aggregate(siteId: number | null, start: Date, end: Date): Promise<Agg> {
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }

  const bookingQ = await dbQuery<{
    ticket_revenue: string;
    snack_revenue: string;
    admissions: string;
    paid_bookings: string;
    snack_buyers: string;
  }>(
    `
    SELECT
      COALESCE(SUM(
        GREATEST(
          0,
          COALESCE(b.grand_total, b.total, 0)
            - COALESCE(b.admin_fee, 0)
            - COALESCE((
                SELECT SUM(bs.qty * bs.price_each) FROM booking.booking_snacks bs
                WHERE bs.booking_id = b.id
              ), 0)
        )
      ), 0)::text AS ticket_revenue,
      COALESCE(SUM((
        SELECT COALESCE(SUM(bs.qty * bs.price_each), 0) FROM booking.booking_snacks bs
        WHERE bs.booking_id = b.id
      )), 0)::text AS snack_revenue,
      COALESCE(SUM((
        SELECT COUNT(*)::int FROM booking.showtime_seats ss
        WHERE ss.booking_id = b.id AND ss.status = 'sold'
      )), 0)::text AS admissions,
      COUNT(*)::text AS paid_bookings,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM booking.booking_snacks bs WHERE bs.booking_id = b.id
      ))::text AS snack_buyers
    FROM booking.bookings b
    JOIN cms.shows sh ON sh.id = b.show_id
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE ${paidFilter}
      AND ${eventAt} >= $1::timestamptz
      AND ${eventAt} < $2::timestamptz
      ${siteClause}
    `,
    params
  );

  const showParams: unknown[] = [start.toISOString(), end.toISOString()];
  let showSite = "";
  if (siteId != null) {
    showParams.push(siteId);
    showSite = ` AND sc.site_id = $3`;
  }
  const showQ = await dbQuery<{ capacity: string; seat_hours: string }>(
    `
    SELECT
      COALESCE(SUM(COALESCE(sc."rows", 0) * COALESCE(sc.cols, 0)), 0)::text AS capacity,
      COALESCE(SUM(
        (COALESCE(sc."rows", 0) * COALESCE(sc.cols, 0))::float
        * GREATEST(
            EXTRACT(EPOCH FROM (
              COALESCE(sh.ends_at, sh.starts_at + INTERVAL '3 hours 30 minutes') - sh.starts_at
            )) / 3600.0,
            0.1
          )
      ), 0)::text AS seat_hours
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE sh.status <> 'cancelled'
      AND sh.starts_at >= $1::timestamptz
      AND sh.starts_at < $2::timestamptz
      ${showSite}
    `,
    showParams
  );

  const b = bookingQ.rows[0];
  const s = showQ.rows[0];
  return {
    ticket_revenue: Number(b?.ticket_revenue || 0),
    snack_revenue: Number(b?.snack_revenue || 0),
    admissions: Number(b?.admissions || 0),
    paid_bookings: Number(b?.paid_bookings || 0),
    snack_buyers: Number(b?.snack_buyers || 0),
    capacity: Number(s?.capacity || 0),
    seat_hours: Number(s?.seat_hours || 0),
  };
}

function kpisFromAgg(a: Agg) {
  const net = a.ticket_revenue + a.snack_revenue;
  const occupancy = a.capacity > 0 ? (100 * a.admissions) / a.capacity : 0;
  const atp = a.admissions > 0 ? a.ticket_revenue / a.admissions : 0;
  const fnbPer = a.admissions > 0 ? a.snack_revenue / a.admissions : 0;
  const revpash = a.seat_hours > 0 ? net / a.seat_hours : 0;
  return {
    ticket_revenue: a.ticket_revenue,
    snack_revenue: a.snack_revenue,
    net_revenue: net,
    admissions: a.admissions,
    occupancy_pct: occupancy,
    atp,
    fnb_per_admission: fnbPer,
    revpash,
  };
}

async function loadSites() {
  const r = await dbQuery<{ id: string; code: string; name: string }>(
    `SELECT id::text, code, name FROM cms.sites WHERE COALESCE(active, TRUE) = TRUE ORDER BY name`
  );
  return r.rows.map((x) => ({ id: Number(x.id), code: x.code, name: x.name }));
}

async function loadTrend(siteId: number | null, start: Date, end: Date): Promise<TrendPoint[]> {
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }
  const r = await dbQuery<{ d: string; revenue: string }>(
    `
    SELECT date_trunc('day', ${eventAt} AT TIME ZONE 'UTC')::date::text AS d,
           COALESCE(SUM(COALESCE(b.grand_total, b.total, 0)), 0)::text AS revenue
    FROM booking.bookings b
    JOIN cms.shows sh ON sh.id = b.show_id
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE ${paidFilter}
      AND ${eventAt} >= $1::timestamptz
      AND ${eventAt} < $2::timestamptz
      ${siteClause}
    GROUP BY 1
    ORDER BY 1
    `,
    params
  );
  return r.rows.map((row) => ({
    date: row.d,
    label: row.d.slice(5),
    revenue: Number(row.revenue),
  }));
}

async function loadBranches(
  start: Date,
  end: Date,
  prevStart: Date,
  prevEnd: Date
): Promise<BranchRow[]> {
  const r = await dbQuery<{
    site_id: string;
    name: string;
    revenue: string;
    admissions: string;
    capacity: string;
    seat_hours: string;
  }>(
    `
    SELECT
      s.id::text AS site_id,
      s.name,
      COALESCE((
        SELECT SUM(COALESCE(b.grand_total, b.total, 0))
        FROM booking.bookings b
        JOIN cms.shows sh ON sh.id = b.show_id
        JOIN cms.screens sc ON sc.id = sh.screen_id
        WHERE sc.site_id = s.id AND ${paidFilter}
          AND ${eventAt} >= $1::timestamptz AND ${eventAt} < $2::timestamptz
      ), 0)::text AS revenue,
      COALESCE((
        SELECT COUNT(*)::int
        FROM booking.showtime_seats ss
        JOIN booking.bookings b ON b.id = ss.booking_id
        JOIN cms.shows sh ON sh.id = b.show_id
        JOIN cms.screens sc ON sc.id = sh.screen_id
        WHERE sc.site_id = s.id AND ss.status = 'sold' AND ${paidFilter}
          AND ${eventAt} >= $1::timestamptz AND ${eventAt} < $2::timestamptz
      ), 0)::text AS admissions,
      COALESCE((
        SELECT SUM(COALESCE(sc."rows",0) * COALESCE(sc.cols,0))
        FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        WHERE sc.site_id = s.id AND sh.status <> 'cancelled'
          AND sh.starts_at >= $1::timestamptz AND sh.starts_at < $2::timestamptz
      ), 0)::text AS capacity,
      COALESCE((
        SELECT SUM(
          (COALESCE(sc."rows",0) * COALESCE(sc.cols,0))::float
          * GREATEST(EXTRACT(EPOCH FROM (
              COALESCE(sh.ends_at, sh.starts_at + INTERVAL '3 hours 30 minutes') - sh.starts_at
            )) / 3600.0, 0.1)
        )
        FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        WHERE sc.site_id = s.id AND sh.status <> 'cancelled'
          AND sh.starts_at >= $1::timestamptz AND sh.starts_at < $2::timestamptz
      ), 0)::text AS seat_hours
    FROM cms.sites s
    WHERE COALESCE(s.active, TRUE) = TRUE
    ORDER BY 3 DESC
    `,
    [start.toISOString(), end.toISOString()]
  );

  const prev = await dbQuery<{ site_id: string; revenue: string }>(
    `
    SELECT sc.site_id::text,
           COALESCE(SUM(COALESCE(b.grand_total, b.total, 0)), 0)::text AS revenue
    FROM booking.bookings b
    JOIN cms.shows sh ON sh.id = b.show_id
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE ${paidFilter}
      AND ${eventAt} >= $1::timestamptz AND ${eventAt} < $2::timestamptz
    GROUP BY sc.site_id
    `,
    [prevStart.toISOString(), prevEnd.toISOString()]
  );
  const prevMap = new Map(prev.rows.map((x) => [Number(x.site_id), Number(x.revenue)]));

  return r.rows.map((row) => {
    const revenue = Number(row.revenue);
    const admissions = Number(row.admissions);
    const capacity = Number(row.capacity);
    const seatHours = Number(row.seat_hours);
    const site_id = Number(row.site_id);
    return {
      site_id,
      name: row.name,
      revenue,
      occupancy_pct: capacity > 0 ? (100 * admissions) / capacity : 0,
      revpash: seatHours > 0 ? revenue / seatHours : 0,
      change_pct: pctChange(revenue, prevMap.get(site_id) ?? 0),
    };
  });
}

async function loadDevices(siteId: number | null): Promise<DeviceRow[]> {
  const params: unknown[] = [];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND d.site_id = $1`;
  }
  const r = await dbQuery<{
    id: string;
    name: string;
    site: string;
    last_heartbeat_at: Date | null;
    playback_status: string | null;
    playback_error: string | null;
  }>(
    `
    SELECT d.id::text, d.name, s.name AS site,
           d.last_heartbeat_at, d.playback_status, d.playback_error
    FROM cms.devices d
    JOIN cms.sites s ON s.id = d.site_id
    WHERE COALESCE(d.status, 'active') <> 'revoked'
      ${siteClause}
    ORDER BY d.name
    `,
    params
  );

  const now = Date.now();
  return r.rows.map((d) => {
    const hb = d.last_heartbeat_at ? new Date(d.last_heartbeat_at).getTime() : 0;
    const online = hb > 0 && now - hb <= DEVICE_ONLINE_MS;
    const err = (d.playback_error || "").trim();
    const warn = !online || !!err || d.playback_status === "error";
    let status_label = online ? "Online" : "Offline";
    if (online && d.playback_status) status_label = d.playback_status;
    if (err) status_label = "Error";
    return {
      id: Number(d.id),
      name: d.name,
      site: d.site,
      online,
      last_heartbeat_at: d.last_heartbeat_at
        ? new Date(d.last_heartbeat_at).toISOString()
        : null,
      playback_status: d.playback_status || undefined,
      playback_error: err || undefined,
      status_label,
      warn,
    };
  });
}

async function loadHeatmap(siteId: number | null, start: Date, end: Date) {
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const slots = ["10:00", "13:00", "16:00", "19:00", "21:00"];
  const slotHours = [10, 13, 16, 19, 21];

  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }

  const r = await dbQuery<{ dow: string; hour: string; occ: string }>(
    `
    SELECT
      EXTRACT(DOW FROM sh.starts_at AT TIME ZONE 'UTC')::int::text AS dow,
      EXTRACT(HOUR FROM sh.starts_at AT TIME ZONE 'UTC')::int::text AS hour,
      CASE WHEN COALESCE(sc."rows",0)*COALESCE(sc.cols,0) > 0 THEN
        100.0 * COALESCE((
          SELECT COUNT(*)::float FROM booking.showtime_seats ss
          JOIN booking.bookings b ON b.id = ss.booking_id
          WHERE ss.show_id = sh.id AND ss.status = 'sold' AND ${paidFilter}
        ), 0) / (sc."rows" * sc.cols)::float
      ELSE 0 END::text AS occ
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE sh.status <> 'cancelled'
      AND sh.starts_at >= $1::timestamptz AND sh.starts_at < $2::timestamptz
      ${siteClause}
    `,
    params
  );

  const sums: number[][] = slotHours.map(() => days.map(() => 0));
  const counts: number[][] = slotHours.map(() => days.map(() => 0));
  for (const row of r.rows) {
    const dow = Number(row.dow);
    const hour = Number(row.hour);
    let si = 0;
    let best = 99;
    slotHours.forEach((h, i) => {
      const d = Math.abs(h - hour);
      if (d < best) {
        best = d;
        si = i;
      }
    });
    if (dow >= 0 && dow < 7) {
      sums[si][dow] += Number(row.occ);
      counts[si][dow] += 1;
    }
  }
  const cells = sums.map((row, i) =>
    row.map((v, j) => (counts[i][j] ? Math.round(v / counts[i][j]) : 0))
  );
  return { days, slots, cells };
}

async function loadGenres(siteId: number | null, start: Date, end: Date): Promise<GenreRow[]> {
  const slots = [10, 13, 16, 19, 21];
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }
  const r = await dbQuery<{ genre: string; hour: string; adm: string }>(
    `
    SELECT
      COALESCE(NULLIF(TRIM(av.genre), ''), 'Lainnya') AS genre,
      EXTRACT(HOUR FROM sh.starts_at AT TIME ZONE 'UTC')::int::text AS hour,
      COALESCE((
        SELECT COUNT(*)::int FROM booking.showtime_seats ss
        JOIN booking.bookings b ON b.id = ss.booking_id
        WHERE ss.show_id = sh.id AND ss.status = 'sold' AND ${paidFilter}
      ), 0)::text AS adm
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    LEFT JOIN cms.asset_versions av ON av.id = sh.feature_asset_id
    WHERE sh.status <> 'cancelled'
      AND sh.starts_at >= $1::timestamptz AND sh.starts_at < $2::timestamptz
      ${siteClause}
    `,
    params
  );

  const map = new Map<string, number[]>();
  for (const row of r.rows) {
    if (!map.has(row.genre)) map.set(row.genre, slots.map(() => 0));
    const hour = Number(row.hour);
    let si = 0;
    let best = 99;
    slots.forEach((h, i) => {
      const d = Math.abs(h - hour);
      if (d < best) {
        best = d;
        si = i;
      }
    });
    map.get(row.genre)![si] += Number(row.adm);
  }
  return [...map.entries()]
    .map(([genre, slotVals]) => ({ genre, slots: slotVals }))
    .sort((a, b) => b.slots.reduce((x, y) => x + y, 0) - a.slots.reduce((x, y) => x + y, 0))
    .slice(0, 6);
}

async function loadFilms(siteId: number | null, start: Date, end: Date): Promise<FilmRow[]> {
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }
  const r = await dbQuery<{
    title: string;
    admissions: string;
    capacity: string;
    revenue: string;
    seat_hours: string;
  }>(
    `
    SELECT
      COALESCE(NULLIF(sh.title, ''), av.title, 'Tanpa judul') AS title,
      COALESCE(SUM((
        SELECT COUNT(*)::int FROM booking.showtime_seats ss
        JOIN booking.bookings b ON b.id = ss.booking_id
        WHERE ss.show_id = sh.id AND ss.status = 'sold' AND ${paidFilter}
      )), 0)::text AS admissions,
      COALESCE(SUM(COALESCE(sc."rows",0)*COALESCE(sc.cols,0)), 0)::text AS capacity,
      COALESCE(SUM((
        SELECT COALESCE(SUM(COALESCE(b.grand_total, b.total, 0)), 0)
        FROM booking.bookings b
        WHERE b.show_id = sh.id AND ${paidFilter}
      )), 0)::text AS revenue,
      COALESCE(SUM(
        (COALESCE(sc."rows",0)*COALESCE(sc.cols,0))::float
        * GREATEST(EXTRACT(EPOCH FROM (
            COALESCE(sh.ends_at, sh.starts_at + INTERVAL '3 hours 30 minutes') - sh.starts_at
          )) / 3600.0, 0.1)
      ), 0)::text AS seat_hours
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    LEFT JOIN cms.asset_versions av ON av.id = sh.feature_asset_id
    WHERE sh.status <> 'cancelled'
      AND sh.starts_at >= $1::timestamptz AND sh.starts_at < $2::timestamptz
      ${siteClause}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 12
    `,
    params
  );
  return r.rows.map((row) => {
    const admissions = Number(row.admissions);
    const capacity = Number(row.capacity);
    const revenue = Number(row.revenue);
    const seatHours = Number(row.seat_hours);
    return {
      title: row.title,
      admissions,
      occupancy_pct: capacity > 0 ? (100 * admissions) / capacity : 0,
      revpash: seatHours > 0 ? revenue / seatHours : 0,
    };
  });
}

async function loadFnb(siteId: number | null, start: Date, end: Date, prev: Window, currAgg: Agg) {
  const params: unknown[] = [start.toISOString(), end.toISOString()];
  let siteClause = "";
  if (siteId != null) {
    params.push(siteId);
    siteClause = ` AND sc.site_id = $3`;
  }

  const itemsQ = await dbQuery<{ name: string; units: string; revenue: string }>(
    `
    SELECT COALESCE(NULLIF(bs.name, ''), 'Item') AS name,
           COALESCE(SUM(bs.qty), 0)::text AS units,
           COALESCE(SUM(bs.qty * bs.price_each), 0)::text AS revenue
    FROM booking.booking_snacks bs
    JOIN booking.bookings b ON b.id = bs.booking_id
    JOIN cms.shows sh ON sh.id = b.show_id
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE ${paidFilter}
      AND ${eventAt} >= $1::timestamptz AND ${eventAt} < $2::timestamptz
      ${siteClause}
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 8
    `,
    params
  );

  const totalUnits = itemsQ.rows.reduce((a, x) => a + Number(x.units), 0) || 1;
  const items = itemsQ.rows.map((x) => ({
    name: x.name,
    units: Number(x.units),
    revenue: Number(x.revenue),
    share_pct: (100 * Number(x.units)) / totalUnits,
  }));

  const hoursQ = await dbQuery<{ slot: string; pct: string }>(
    `
    SELECT to_char(date_trunc('hour', ${eventAt} AT TIME ZONE 'UTC'), 'HH24:00') AS slot,
           COALESCE(SUM(bs.qty * bs.price_each), 0)::text AS pct
    FROM booking.booking_snacks bs
    JOIN booking.bookings b ON b.id = bs.booking_id
    JOIN cms.shows sh ON sh.id = b.show_id
    JOIN cms.screens sc ON sc.id = sh.screen_id
    WHERE ${paidFilter}
      AND ${eventAt} >= $1::timestamptz AND ${eventAt} < $2::timestamptz
      ${siteClause}
    GROUP BY 1
    ORDER BY 1
    `,
    params
  );
  const maxH = Math.max(1, ...hoursQ.rows.map((x) => Number(x.pct)));
  const hours = hoursQ.rows.map((x) => ({
    slot: x.slot,
    pct: (100 * Number(x.pct)) / maxH,
  }));

  const prevAgg = await aggregate(siteId, prev.start, prev.end);
  const attach =
    currAgg.paid_bookings > 0 ? (100 * currAgg.snack_buyers) / currAgg.paid_bookings : 0;
  const prevAttach =
    prevAgg.paid_bookings > 0 ? (100 * prevAgg.snack_buyers) / prevAgg.paid_bookings : 0;
  const basket =
    currAgg.snack_buyers > 0 ? currAgg.snack_revenue / currAgg.snack_buyers : 0;
  const prevBasket =
    prevAgg.snack_buyers > 0 ? prevAgg.snack_revenue / prevAgg.snack_buyers : 0;

  return {
    revenue: currAgg.snack_revenue,
    attach_pct: attach,
    basket,
    buyers: currAgg.snack_buyers,
    visitors: currAgg.paid_bookings,
    items,
    hours,
    deltas: {
      revenue_pct: pctChange(currAgg.snack_revenue, prevAgg.snack_revenue),
      attach_pts: ptsChange(attach, prevAttach),
      basket_pct: pctChange(basket, prevBasket),
    },
  };
}

async function loadUnavailableSnacks() {
  const r = await dbQuery<{ id: string; name: string }>(
    `SELECT id, name FROM booking.snacks WHERE COALESCE(available, 1) = 0 ORDER BY name`
  );
  return r.rows.map((x) => ({ id: x.id, name: x.name }));
}

function buildAlerts(opts: {
  devices: DeviceRow[];
  branches: BranchRow[];
  kpis: ReturnType<typeof kpisFromAgg>;
  fnbAttach: number;
}): Alert[] {
  const alerts: Alert[] = [];
  const offline = opts.devices.filter((d) => !d.online);
  if (offline.length) {
    alerts.push({
      level: "high",
      title: `${offline.length} device offline`,
      detail: offline
        .slice(0, 3)
        .map((d) => `${d.name} (${d.site})`)
        .join(", "),
      action: "Cek jaringan/Tailscale dan heartbeat-service di cabang terkait.",
    });
  }
  const errDev = opts.devices.filter((d) => d.playback_error);
  if (errDev.length) {
    alerts.push({
      level: "high",
      title: "Playback error pada device",
      detail: errDev[0].playback_error || errDev[0].name,
      action: "Periksa asset lokal, license, dan log player-daemon.",
    });
  }
  if (opts.kpis.occupancy_pct >= 80) {
    alerts.push({
      level: "high",
      title: "Demand overflow — okupansi tinggi",
      detail: `Okupansi ${opts.kpis.occupancy_pct.toFixed(1)}% pada periode terpilih.`,
      action: "Pertimbangkan menambah showtime pada slot padat (Optimizer).",
    });
  } else if (opts.kpis.occupancy_pct > 0 && opts.kpis.occupancy_pct < 25) {
    alerts.push({
      level: "med",
      title: "Okupansi rendah pada periode ini",
      detail: `Okupansi ${opts.kpis.occupancy_pct.toFixed(1)}% — pertimbangkan penyesuaian jadwal.`,
      action: "Buka Optimizer Showtime dan tinjau slot under-utilised.",
    });
  }
  if (opts.fnbAttach < 15 && opts.kpis.admissions > 10) {
    alerts.push({
      level: "med",
      title: "Attach rate F&B rendah",
      detail: `Hanya ${opts.fnbAttach.toFixed(1)}% booking membawa snack.`,
      action: "Dorong promo bundle di booking app untuk film/slot teratas.",
    });
  }
  const weak = opts.branches.filter((b) => b.occupancy_pct > 0 && b.occupancy_pct < 20);
  if (weak.length) {
    alerts.push({
      level: "med",
      title: "Cabang under-utilised",
      detail: weak.map((b) => b.name).join(", "),
      action: "Bandingkan jadwal cabang dengan peer trailing average.",
    });
  }
  return alerts.slice(0, 8);
}

export async function buildDashboardSummary(opts: {
  period: PeriodKey;
  siteId?: number | null;
}): Promise<DashboardSummary> {
  const w = periodWindow(opts.period);
  const prev = prevWindow(w);
  const siteId = opts.siteId ?? null;

  const [sites, currAgg, prevAgg, trend, branches, devices, heat, genres, films, unavailable] =
    await Promise.all([
      loadSites(),
      aggregate(siteId, w.start, w.end),
      aggregate(siteId, prev.start, prev.end),
      loadTrend(siteId, w.start, w.end),
      loadBranches(w.start, w.end, prev.start, prev.end),
      loadDevices(siteId),
      loadHeatmap(siteId, w.start, w.end),
      loadGenres(siteId, w.start, w.end),
      loadFilms(siteId, w.start, w.end),
      loadUnavailableSnacks(),
    ]);

  const k = kpisFromAgg(currAgg);
  const pk = kpisFromAgg(prevAgg);
  const fnb = await loadFnb(siteId, w.start, w.end, prev, currAgg);
  const online = devices.filter((d) => d.online).length;
  const offline = devices.length - online;
  const net = k.net_revenue || 1;
  const alerts = buildAlerts({
    devices,
    branches: siteId != null ? branches.filter((b) => b.site_id === siteId) : branches,
    kpis: k,
    fnbAttach: fnb.attach_pct,
  });

  return {
    as_of: new Date().toISOString(),
    period: opts.period,
    label: w.label,
    site_id: siteId,
    sites,
    kpis: {
      ...k,
      deltas: {
        net_revenue_pct: pctChange(k.net_revenue, pk.net_revenue),
        admissions_pct: pctChange(k.admissions, pk.admissions),
        occupancy_pts: ptsChange(k.occupancy_pct, pk.occupancy_pct),
        atp_pct: pctChange(k.atp, pk.atp),
        fnb_per_admission_pct: pctChange(k.fnb_per_admission, pk.fnb_per_admission),
        revpash_pct: pctChange(k.revpash, pk.revpash),
      },
    },
    mix: {
      ticket_pct: (100 * k.ticket_revenue) / net,
      snack_pct: (100 * k.snack_revenue) / net,
    },
    trend,
    branches: siteId != null ? branches.filter((b) => b.site_id === siteId) : branches,
    devices,
    heat,
    genres,
    films,
    fnb,
    alerts,
    health: {
      device_online_pct: devices.length ? (100 * online) / devices.length : 0,
      devices_offline: offline,
      fnb_per_admission: k.fnb_per_admission,
    },
    unavailable_snacks: unavailable,
  };
}
