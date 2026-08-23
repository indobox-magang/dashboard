/**
 * Seed dummy operational + booking data into the shared CMS Postgres
 * (schemas cms + booking). Idempotent for demo sites tagged dash-seed-*.
 *
 * Usage:
 *   CMS_DATABASE_URL=postgres://indobox:indobox@127.0.0.1:5432/indobox npm run seed
 */
import pg from "pg";

const URL =
  process.env.CMS_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://indobox:indobox@127.0.0.1:5432/indobox";

// bcrypt of seed-device-token-change-in-prod (from cms 002_seed)
const DEVICE_TOKEN_HASH =
  "$2a$10$KTWoj4ELVV8VRutHhALH4eIgVpwm8/8QnlU0aiKjp1nPYYjFPCI8q";

const FILMS = [
  { title: "Senja di Depok", genre: "Drama", rating: "R13", price: 45000 },
  { title: "Belitung Blues", genre: "Romance", rating: "SU", price: 40000 },
  { title: "Morowali Midnight", genre: "Thriller", rating: "D17", price: 50000 },
  { title: "Jakarta Express", genre: "Action", rating: "R13", price: 55000 },
];

const SNACKS = [
  { id: "snack-popcorn-l", name: "Popcorn L", price: 35000, available: 1 },
  { id: "snack-popcorn-m", name: "Popcorn M", price: 28000, available: 1 },
  { id: "snack-soda", name: "Soda 16oz", price: 22000, available: 1 },
  { id: "snack-nachos", name: "Nachos Cheese", price: 32000, available: 1 },
  { id: "snack-combo", name: "Combo Hemat", price: 55000, available: 1 },
  { id: "snack-soldout", name: "Limited Merch Cup", price: 75000, available: 0 },
];

const SITES = [
  {
    code: "dash-seed-depok",
    name: "Indobox Depok",
    city: "Depok",
    tz: "Asia/Jakarta",
    screens: [
      { name: "Studio 1", rows: 6, cols: 8 },
      { name: "Studio 2", rows: 5, cols: 8 },
    ],
  },
  {
    code: "dash-seed-belitung",
    name: "Indobox Belitung",
    city: "Belitung",
    tz: "Asia/Jakarta",
    screens: [{ name: "Studio 1", rows: 5, cols: 6 }],
  },
  {
    code: "dash-seed-morowali",
    name: "Indobox Morowali",
    city: "Morowali",
    tz: "Asia/Makassar",
    screens: [{ name: "Studio 1", rows: 4, cols: 6 }],
  },
];

function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

function rand(n) {
  return Math.floor(Math.random() * n);
}

function pick(arr) {
  return arr[rand(arr.length)];
}

function seatLabel(r, c) {
  return `${String.fromCharCode(65 + r)}${c + 1}`;
}

async function main() {
  const client = new pg.Client({ connectionString: URL });
  await client.connect();
  await client.query(`SET search_path TO cms, booking, public`);

  try {
    await client.query("BEGIN");

    // Wipe previous dash-seed data (order matters for FKs)
    log("Cleaning previous dash-seed-* data…");
    await client.query(`
      DELETE FROM booking.booking_snacks
      WHERE booking_id IN (
        SELECT b.id FROM booking.bookings b
        JOIN cms.shows sh ON sh.id = b.show_id
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      DELETE FROM booking.showtime_seats
      WHERE show_id IN (
        SELECT sh.id FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      DELETE FROM booking.bookings
      WHERE show_id IN (
        SELECT sh.id FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      DELETE FROM booking.users WHERE id LIKE 'dash-seed-user-%'`);
    await client.query(`
      DELETE FROM cms.playlist_items
      WHERE show_id IN (
        SELECT sh.id FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      UPDATE cms.devices SET current_show_id = NULL, current_asset_id = NULL
      WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-seed-%')`);
    await client.query(`
      DELETE FROM cms.shows
      WHERE screen_id IN (
        SELECT sc.id FROM cms.screens sc
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      DELETE FROM cms.device_screens
      WHERE device_id IN (
        SELECT d.id FROM cms.devices d
        JOIN cms.sites s ON s.id = d.site_id
        WHERE s.code LIKE 'dash-seed-%'
      )`);
    await client.query(`
      DELETE FROM cms.devices
      WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-seed-%')`);
    await client.query(`
      DELETE FROM cms.screens
      WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-seed-%')`);
    await client.query(`DELETE FROM cms.sites WHERE code LIKE 'dash-seed-%'`);
    await client.query(`
      DELETE FROM cms.asset_versions WHERE title LIKE 'Dash Seed:%'`);
    await client.query(`
      DELETE FROM booking.snacks WHERE id LIKE 'snack-%'`);

    // Admin user (keep if exists)
    await client.query(`
      INSERT INTO cms.users (email, password_hash, display_name)
      VALUES (
        'admin@indobox.cloud',
        '$2a$10$zo74ibU4yVONcNO2LlG/x.kYCFW/fuhWDy5sM0PbJb0lLgqNta9Zq',
        'Admin User'
      )
      ON CONFLICT ON CONSTRAINT uq_cms_users_email DO NOTHING`);

    // Films
    const filmIds = [];
    for (const f of FILMS) {
      const r = await client.query(
        `INSERT INTO cms.asset_versions
           (kind, title, status, duration_ms, size_bytes, genre, rating, booking_status, synopsis)
         VALUES ('feature', $1, 'verified', $2, $3, $4, $5, 'now_showing', $6)
         RETURNING id`,
        [
          `Dash Seed: ${f.title}`,
          7200000 + rand(600000),
          2_500_000_000 + rand(500_000_000),
          f.genre,
          f.rating,
          `Film demo untuk dashboard — ${f.title}`,
        ]
      );
      filmIds.push({ id: r.rows[0].id, ...f });
    }
    log("films", filmIds.length);

    // Snacks
    for (const s of SNACKS) {
      await client.query(
        `INSERT INTO booking.snacks (id, name, price, category, available, sort)
         VALUES ($1, $2, $3, 'snack', $4, 0)`,
        [s.id, s.name, s.price, s.available]
      );
    }

    // Consumer users
    for (let i = 1; i <= 12; i++) {
      await client.query(
        `INSERT INTO booking.users (id, name, email, phone, role, active)
         VALUES ($1, $2, $3, $4, 'customer', TRUE)`,
        [
          `dash-seed-user-${i}`,
          `Demo User ${i}`,
          `demo${i}@indobox.test`,
          `6281234567${String(100 + i).slice(-3)}`,
        ]
      );
    }

    const now = Date.now();
    let showCount = 0;
    let bookingCount = 0;

    for (const site of SITES) {
      const sr = await client.query(
        `INSERT INTO cms.sites (code, name, timezone, city, address, active)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
        [site.code, site.name, site.tz, site.city, `${site.city} Microcinema`]
      );
      const siteId = sr.rows[0].id;

      const screenIds = [];
      for (const sc of site.screens) {
        const r = await client.query(
          `INSERT INTO cms.screens (site_id, name, "rows", cols, aisle_after)
           VALUES ($1, $2, $3, $4, 3) RETURNING id`,
          [siteId, sc.name, sc.rows, sc.cols]
        );
        screenIds.push({ id: r.rows[0].id, ...sc });
      }

      // Devices: one online, maybe one offline per site
      const onlineDev = await client.query(
        `INSERT INTO cms.devices
           (site_id, name, token_hash, status, hostname, last_heartbeat_at,
            playback_status, agent_version, paired_at)
         VALUES ($1, $2, $3, 'active', $4, NOW() - INTERVAL '20 seconds',
                 'playing', '1.4.2', NOW() - INTERVAL '7 days')
         RETURNING id`,
        [
          siteId,
          `${site.name} Player`,
          DEVICE_TOKEN_HASH,
          `player-${site.code}`,
        ]
      );
      await client.query(
        `INSERT INTO cms.device_screens (device_id, screen_id) VALUES ($1, $2)`,
        [onlineDev.rows[0].id, screenIds[0].id]
      );

      if (site.code.includes("morowali")) {
        await client.query(
          `INSERT INTO cms.devices
             (site_id, name, token_hash, status, hostname, last_heartbeat_at,
              playback_status, playback_error, agent_version)
           VALUES ($1, $2, $3, 'active', $4, NOW() - INTERVAL '45 minutes',
                   'error', 'asset corrupted: feature sha mismatch', '1.3.0')`,
          [siteId, `${site.name} Player B`, DEVICE_TOKEN_HASH, `player-${site.code}-b`]
        );
      }

      // Shows for last 21 days + next 2 days
      for (let day = -20; day <= 2; day++) {
        for (const screen of screenIds) {
          const slots = [10, 13, 16, 19, 21];
          for (const hour of slots) {
            if (rand(100) < 25) continue; // sparse schedule
            const film = pick(filmIds);
            const starts = new Date(now + day * 86400000);
            starts.setUTCHours(hour - 7, 0, 0, 0); // rough Asia/Jakarta as UTC+7
            const ends = new Date(starts.getTime() + 3.5 * 3600000);
            const status =
              ends.getTime() < now ? (rand(100) < 8 ? "cancelled" : "done") : "scheduled";

            const sh = await client.query(
              `INSERT INTO cms.shows
                 (screen_id, starts_at, ends_at, title, status, price, show_no,
                  booking_enabled, feature_asset_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, $8)
               RETURNING id`,
              [
                screen.id,
                starts.toISOString(),
                ends.toISOString(),
                film.title,
                status,
                film.price,
                hour,
                film.id,
              ]
            );
            const showId = sh.rows[0].id;
            showCount++;

            await client.query(
              `INSERT INTO cms.playlist_items (show_id, seq, asset_version_id, item_type, required_flag)
               VALUES ($1, 1, $2, 'content', TRUE)`,
              [showId, film.id]
            );

            if (status === "cancelled") continue;

            // Bookings for past/current shows
            const capacity = screen.rows * screen.cols;
            const nBookings = 1 + rand(Math.min(6, Math.floor(capacity / 2)));
            const usedSeats = new Set();

            for (let bi = 0; bi < nBookings; bi++) {
              const seatsN = 1 + rand(3);
              const labels = [];
              for (let tries = 0; tries < 20 && labels.length < seatsN; tries++) {
                const lab = seatLabel(rand(screen.rows), rand(screen.cols));
                if (!usedSeats.has(lab)) {
                  usedSeats.add(lab);
                  labels.push(lab);
                }
              }
              if (!labels.length) continue;

              const ticketTotal = film.price * labels.length;
              const withSnack = rand(100) < 45;
              let snackTotal = 0;
              const snackLines = [];
              if (withSnack) {
                const snack = pick(SNACKS.filter((s) => s.available));
                const qty = 1 + rand(2);
                snackTotal = snack.price * qty;
                snackLines.push({ snack, qty });
              }
              const adminFee = 2000;
              const discount = rand(100) < 15 ? 5000 : 0;
              const grand = ticketTotal + snackTotal + adminFee - discount;
              const paidAt = new Date(
                starts.getTime() - (2 + rand(48)) * 3600000
              );
              const bookingId = `dash-b-${showId}-${bi}-${rand(1e6)}`;
              const code = `DS${String(showId).padStart(4, "0")}${bi}${rand(90) + 10}`;
              const userId = `dash-seed-user-${1 + rand(12)}`;
              const bStatus =
                starts.getTime() < now - 3600000
                  ? rand(100) < 20
                    ? "used"
                    : "paid"
                  : "paid";

              await client.query(
                `INSERT INTO booking.bookings
                   (id, code, user_id, show_id, status, total, payment_ref, payment_method,
                    created_at, expires_at, paid_at, admin_fee, discount, grand_total)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,'qris',$8,$9,$10,$11,$12,$13)`,
                [
                  bookingId,
                  code,
                  userId,
                  showId,
                  bStatus,
                  ticketTotal,
                  `PAY-${code}`,
                  new Date(paidAt.getTime() - 600000).toISOString(),
                  new Date(paidAt.getTime() + 480000).toISOString(),
                  paidAt.toISOString(),
                  adminFee,
                  discount,
                  grand,
                ]
              );
              bookingCount++;

              for (const lab of labels) {
                await client.query(
                  `INSERT INTO booking.showtime_seats (show_id, seat_label, status, booking_id)
                   VALUES ($1, $2, 'sold', $3)`,
                  [showId, lab, bookingId]
                );
              }
              for (const line of snackLines) {
                await client.query(
                  `INSERT INTO booking.booking_snacks
                     (id, booking_id, snack_id, name, qty, price_each)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    `${bookingId}-${line.snack.id}`,
                    bookingId,
                    line.snack.id,
                    line.snack.name,
                    line.qty,
                    line.snack.price,
                  ]
                );
              }
            }
          }
        }
      }

      // Point online device at a recent show
      const cur = await client.query(
        `SELECT sh.id, sh.feature_asset_id FROM cms.shows sh
         JOIN cms.screens sc ON sc.id = sh.screen_id
         WHERE sc.site_id = $1 AND sh.status IN ('scheduled','done')
         ORDER BY ABS(EXTRACT(EPOCH FROM (sh.starts_at - NOW()))) ASC
         LIMIT 1`,
        [siteId]
      );
      if (cur.rows[0]) {
        await client.query(
          `UPDATE cms.devices
           SET current_show_id = $1, current_asset_id = $2, playback_status = 'playing'
           WHERE id = $3`,
          [cur.rows[0].id, cur.rows[0].feature_asset_id, onlineDev.rows[0].id]
        );
      }
    }

    await client.query(
      `UPDATE cms.schedule_meta SET global_rev = global_rev + 1, updated_at = NOW() WHERE id = 1`
    );

    await client.query("COMMIT");
    log("Seed OK", { shows: showCount, bookings: bookingCount, sites: SITES.length });
    log("Admin: admin@indobox.cloud / admin123");
    log("Device token (bcrypt in DB): seed-device-token-change-in-prod");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
