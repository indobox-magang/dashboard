-- =============================================================================
-- IndoBox Dashboard — DEMO SEED DATA
--
-- Semua baris bertanda jelas sebagai seed (aman dihapus kapan saja):
--   • site code     : dash-jaksel | dash-sentul | dash-ikn
--   • nama UI       : prefix "[SEED] …"
--   • film title    : "DASH-SEED: …"
--   • booking/user  : bkg_dash_* / usr_dash_* / snk_dash_* / bsk_dash_* / prm_dash_*
--   • promo code    : DASH10
--
-- Idempotent: membersihkan seed lama dulu, lalu insert ulang.
--
-- Usage:
--   psql "postgres://indobox:indobox@127.0.0.1:5432/indobox?sslmode=disable" \
--     -f scripts/seed-dashboard-demo.sql
--
-- Remove:
--   psql "postgres://indobox:indobox@127.0.0.1:5432/indobox?sslmode=disable" \
--     -f scripts/unseed-dashboard-demo.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0) Bersihkan seed lama (mirror unseed, scoped ke prefix seed)
-- ---------------------------------------------------------------------------
UPDATE cms.devices d
SET current_show_id = NULL, current_asset_id = NULL
WHERE d.site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-%')
   OR d.name LIKE '[SEED]%';

DO $$ BEGIN
  IF to_regclass('cms.license_grants') IS NOT NULL THEN
    DELETE FROM cms.license_grants lg
    WHERE lg.show_id IN (
        SELECT sh.id FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-%'
      )
       OR lg.device_id IN (
        SELECT d.id FROM cms.devices d
        JOIN cms.sites s ON s.id = d.site_id
        WHERE s.code LIKE 'dash-%'
      );
  END IF;
  IF to_regclass('cms.proof_of_play') IS NOT NULL THEN
    DELETE FROM cms.proof_of_play pop
    WHERE pop.show_id IN (
        SELECT sh.id FROM cms.shows sh
        JOIN cms.screens sc ON sc.id = sh.screen_id
        JOIN cms.sites s ON s.id = sc.site_id
        WHERE s.code LIKE 'dash-%'
      )
       OR pop.device_id IN (
        SELECT d.id FROM cms.devices d
        JOIN cms.sites s ON s.id = d.site_id
        WHERE s.code LIKE 'dash-%'
      );
  END IF;
  IF to_regclass('booking.payment_checkouts') IS NOT NULL THEN
    DELETE FROM booking.payment_checkouts WHERE booking_id LIKE 'bkg_dash_%';
  END IF;
END $$;

DELETE FROM booking.booking_snacks
WHERE id LIKE 'bsk_dash_%' OR booking_id LIKE 'bkg_dash_%';

DELETE FROM booking.showtime_seats
WHERE booking_id LIKE 'bkg_dash_%'
   OR show_id IN (
    SELECT sh.id FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    JOIN cms.sites s ON s.id = sc.site_id
    WHERE s.code LIKE 'dash-%'
  );

DELETE FROM booking.bookings
WHERE id LIKE 'bkg_dash_%'
   OR show_id IN (
    SELECT sh.id FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    JOIN cms.sites s ON s.id = sc.site_id
    WHERE s.code LIKE 'dash-%'
  );

DELETE FROM cms.playlist_items
WHERE show_id IN (
  SELECT sh.id FROM cms.shows sh
  JOIN cms.screens sc ON sc.id = sh.screen_id
  JOIN cms.sites s ON s.id = sc.site_id
  WHERE s.code LIKE 'dash-%'
);

DELETE FROM cms.shows
WHERE screen_id IN (
  SELECT sc.id FROM cms.screens sc
  JOIN cms.sites s ON s.id = sc.site_id
  WHERE s.code LIKE 'dash-%'
)
   OR title LIKE 'DASH-SEED%'
   OR title LIKE '[SEED]%';

DELETE FROM cms.device_pairings
WHERE device_id IN (
  SELECT d.id FROM cms.devices d
  JOIN cms.sites s ON s.id = d.site_id
  WHERE s.code LIKE 'dash-%'
);

DELETE FROM cms.device_screens
WHERE device_id IN (
  SELECT d.id FROM cms.devices d
  JOIN cms.sites s ON s.id = d.site_id
  WHERE s.code LIKE 'dash-%'
);

DELETE FROM cms.devices
WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-%')
   OR name LIKE '[SEED]%';

DELETE FROM booking.investor_partners
WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-%')
   OR user_id LIKE 'usr_dash_%';

DELETE FROM cms.screens
WHERE site_id IN (SELECT id FROM cms.sites WHERE code LIKE 'dash-%')
   OR name LIKE '[SEED]%';

DELETE FROM cms.sites WHERE code LIKE 'dash-%';

DELETE FROM cms.asset_versions
WHERE title LIKE 'DASH-SEED%' OR title LIKE '[SEED]%';

DELETE FROM booking.notifications WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.user_auth_versions WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.partner_applications WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.ph_members WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.user_memberships WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.users WHERE id LIKE 'usr_dash_%';
DELETE FROM booking.snacks WHERE id LIKE 'snk_dash_%';
DELETE FROM booking.promos WHERE id LIKE 'prm_dash_%' OR code LIKE 'DASH%';

-- ---------------------------------------------------------------------------
-- 1) Sites — Jakarta Selatan, Sentul, IKN
-- ---------------------------------------------------------------------------
INSERT INTO cms.sites (code, name, timezone, city, address, active)
VALUES
  ('dash-jaksel', '[SEED] Indobox Jakarta Selatan', 'Asia/Jakarta', 'Jakarta Selatan',
   'DEMO SEED — Jl. Kemang Raya (data contoh dashboard, boleh dihapus)', TRUE),
  ('dash-sentul', '[SEED] Indobox Sentul', 'Asia/Jakarta', 'Sentul',
   'DEMO SEED — Sentul City (data contoh dashboard, boleh dihapus)', TRUE),
  ('dash-ikn', '[SEED] Indobox IKN', 'Asia/Jakarta', 'IKN',
   'DEMO SEED — Ibu Kota Nusantara (data contoh dashboard, boleh dihapus)', TRUE);

-- ---------------------------------------------------------------------------
-- 2) Screens (kapasitas 5×10 = 50)
-- ---------------------------------------------------------------------------
INSERT INTO cms.screens (site_id, name, tags_json, rows, cols, aisle_after)
SELECT s.id, '[SEED] Studio 1', '["STANDARD","SEED"]'::jsonb, 5, 10, 5
FROM cms.sites s
WHERE s.code IN ('dash-jaksel', 'dash-sentul', 'dash-ikn');

-- ---------------------------------------------------------------------------
-- 3) Feature assets (film) — title diawali DASH-SEED
-- ---------------------------------------------------------------------------
INSERT INTO cms.asset_versions (
  kind, title, sha256, size_bytes, duration_ms, status,
  synopsis, genre, rating, booking_status, release_date
) VALUES
  ('feature', 'DASH-SEED: Neon Chase',
   'd45d000000000000000000000000000000000000000000000000000000000001',
   1500000000, 7200000, 'verified',
   '[SEED DEMO] Film action contoh untuk mengisi ranking & heatmap dashboard.',
   'Action', '13+', 'now_showing', DATE '2026-01-10'),
  ('feature', 'DASH-SEED: Senja Kota',
   'd45d000000000000000000000000000000000000000000000000000000000002',
   1400000000, 6900000, 'verified',
   '[SEED DEMO] Film drama contoh untuk mengisi ranking & heatmap dashboard.',
   'Drama', '17+', 'now_showing', DATE '2026-02-01'),
  ('feature', 'DASH-SEED: Kopi & Kekacauan',
   'd45d000000000000000000000000000000000000000000000000000000000003',
   1300000000, 6600000, 'verified',
   '[SEED DEMO] Film comedy contoh untuk mengisi ranking & heatmap dashboard.',
   'Comedy', 'SU', 'now_showing', DATE '2026-03-01');

-- ---------------------------------------------------------------------------
-- 4) Shows — ~5 per site across 7 hari terakhir (WIB)
-- ---------------------------------------------------------------------------
INSERT INTO cms.shows (
  screen_id, starts_at, title, status, price, show_no, booking_enabled, feature_asset_id
)
SELECT
  sc.id,
  (
    ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::date - offs.day_back)
    + offs.show_time
  ) AT TIME ZONE 'Asia/Jakarta',
  av.title,
  'scheduled',
  offs.price,
  offs.show_no,
  TRUE,
  av.id
FROM cms.sites s
JOIN cms.screens sc ON sc.site_id = s.id AND sc.name = '[SEED] Studio 1'
CROSS JOIN (
  VALUES
    (0, TIME '19:00', 1, 45000, 'DASH-SEED: Neon Chase'),
    (1, TIME '14:00', 2, 40000, 'DASH-SEED: Senja Kota'),
    (1, TIME '19:00', 3, 45000, 'DASH-SEED: Kopi & Kekacauan'),
    (2, TIME '19:00', 4, 45000, 'DASH-SEED: Neon Chase'),
    (3, TIME '15:00', 5, 40000, 'DASH-SEED: Senja Kota'),
    (4, TIME '19:00', 6, 45000, 'DASH-SEED: Kopi & Kekacauan'),
    (5, TIME '14:00', 7, 40000, 'DASH-SEED: Neon Chase'),
    (6, TIME '19:00', 8, 45000, 'DASH-SEED: Senja Kota')
) AS offs(day_back, show_time, show_no, price, film_title)
JOIN cms.asset_versions av ON av.title = offs.film_title
WHERE s.code IN ('dash-jaksel', 'dash-sentul', 'dash-ikn');

-- Playlist (1 feature per show) — opsional tapi lengkap
INSERT INTO cms.playlist_items (show_id, seq, asset_version_id, item_type, required_flag)
SELECT sh.id, 1, sh.feature_asset_id, 'content', TRUE
FROM cms.shows sh
JOIN cms.screens sc ON sc.id = sh.screen_id
JOIN cms.sites s ON s.id = sc.site_id
WHERE s.code LIKE 'dash-%'
  AND sh.feature_asset_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 5) Devices — 1 online (Jaksel), 1 offline (Sentul)
-- ---------------------------------------------------------------------------
INSERT INTO cms.devices (site_id, name, token_hash, status, last_heartbeat_at, playback_status, hostname)
SELECT s.id,
       '[SEED] Player Jakarta Selatan',
       'seed-dash-token-jaksel-not-for-prod',
       'active',
       NOW(),
       'idle',
       'seed-dash-jaksel-player'
FROM cms.sites s WHERE s.code = 'dash-jaksel';

INSERT INTO cms.devices (site_id, name, token_hash, status, last_heartbeat_at, playback_status, hostname)
SELECT s.id,
       '[SEED] Player Sentul (offline)',
       'seed-dash-token-sentul-not-for-prod',
       'active',
       NOW() - INTERVAL '2 hours',
       'idle',
       'seed-dash-sentul-player'
FROM cms.sites s WHERE s.code = 'dash-sentul';

INSERT INTO cms.device_screens (device_id, screen_id)
SELECT d.id, sc.id
FROM cms.devices d
JOIN cms.sites s ON s.id = d.site_id
JOIN cms.screens sc ON sc.site_id = s.id AND sc.name = '[SEED] Studio 1'
WHERE d.name LIKE '[SEED]%';

-- ---------------------------------------------------------------------------
-- 6) Consumers + snacks + promo
-- ---------------------------------------------------------------------------
INSERT INTO booking.users (id, name, email, phone, role, active, points)
VALUES
  ('usr_dash_01', '[SEED] Customer 01', 'seed.dash.01@example.local', '6281100000001', 'customer', TRUE, 100),
  ('usr_dash_02', '[SEED] Customer 02', 'seed.dash.02@example.local', '6281100000002', 'customer', TRUE, 50),
  ('usr_dash_03', '[SEED] Customer 03', 'seed.dash.03@example.local', '6281100000003', 'customer', TRUE, 0),
  ('usr_dash_04', '[SEED] Customer 04', 'seed.dash.04@example.local', '6281100000004', 'customer', TRUE, 20),
  ('usr_dash_05', '[SEED] Customer 05', 'seed.dash.05@example.local', '6281100000005', 'customer', TRUE, 10);

INSERT INTO booking.snacks (id, name, size, price, category, glyph, available, sort)
VALUES
  ('snk_dash_popcorn', '[SEED] Popcorn Salted', 'M', 35000, 'Snack', NULL, 1, 1),
  ('snk_dash_soda',    '[SEED] Soft Drink',     'L', 25000, 'Drink', NULL, 1, 2),
  ('snk_dash_nachos',  '[SEED] Nachos Cheese',  'R', 40000, 'Snack', NULL, 1, 3);

INSERT INTO booking.promos (
  id, code, title, subtitle, kind, value_pct, value_flat, max_discount, min_spend, active, terms
) VALUES (
  'prm_dash_demo', 'DASH10',
  '[SEED] Diskon Demo 10%',
  'Hanya untuk data seed dashboard — boleh dihapus',
  'discount', 10, 0, 20000, 50000, 1,
  'DEMO SEED — tidak untuk produksi'
);

-- ---------------------------------------------------------------------------
-- 7) Paid bookings + sold seats + snack lines
--    Distribusi ke 3 cabang; paid_at dalam ~7 hari (WIB).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  i INT := 0;
  booking_id TEXT;
  booking_code TEXT;
  user_id TEXT;
  seat_a TEXT;
  seat_b TEXT;
  seat_c TEXT;
  ticket_total INT;
  snack_total INT;
  grand INT;
  paid_ts TIMESTAMPTZ;
  st TEXT;
BEGIN
  FOR r IN
    SELECT sh.id AS show_id, sh.price, s.code AS site_code, sh.starts_at
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    JOIN cms.sites s ON s.id = sc.site_id
    WHERE s.code LIKE 'dash-%'
    ORDER BY s.code, sh.starts_at
  LOOP
    -- 1 booking per show (24 shows total) — cukup untuk KPI
    i := i + 1;
    booking_id := 'bkg_dash_' || lpad(i::text, 3, '0');
    booking_code := 'IBX-DASH' || lpad(i::text, 3, '0');
    user_id := 'usr_dash_0' || ((i - 1) % 5 + 1)::text;
    seat_a := chr(65 + ((i - 1) % 5)) || ((i - 1) % 8 + 1)::text;         -- A1..E8
    seat_b := chr(65 + ((i - 1) % 5)) || ((i - 1) % 8 + 2)::text;
    seat_c := CASE WHEN i % 3 = 0
      THEN chr(65 + ((i - 1) % 5)) || ((i - 1) % 8 + 3)::text
      ELSE NULL END;

    ticket_total := COALESCE(r.price, 45000) * (CASE WHEN seat_c IS NULL THEN 2 ELSE 3 END);
    snack_total := CASE WHEN i % 2 = 0 THEN 35000 ELSE 0 END
                + CASE WHEN i % 4 = 0 THEN 25000 ELSE 0 END;
    grand := ticket_total + snack_total + 2000; -- admin fee
    paid_ts := r.starts_at - INTERVAL '3 hours' + ((i % 5) * INTERVAL '7 minutes');
    st := CASE WHEN i % 7 = 0 THEN 'used' ELSE 'paid' END;

    INSERT INTO booking.bookings (
      id, code, user_id, show_id, status, total,
      payment_ref, payment_method, paid_at, created_at,
      admin_fee, discount, grand_total, promo_code
    ) VALUES (
      booking_id, booking_code, user_id, r.show_id, st, ticket_total,
      'seed_dash_pay_' || lpad(i::text, 3, '0'),
      'qris',
      paid_ts, paid_ts - INTERVAL '10 minutes',
      2000, 0, grand,
      CASE WHEN i % 5 = 0 THEN 'DASH10' ELSE NULL END
    );

    INSERT INTO booking.showtime_seats (show_id, seat_label, status, booking_id)
    VALUES (r.show_id, seat_a, 'sold', booking_id),
           (r.show_id, seat_b, 'sold', booking_id);

    IF seat_c IS NOT NULL THEN
      INSERT INTO booking.showtime_seats (show_id, seat_label, status, booking_id)
      VALUES (r.show_id, seat_c, 'sold', booking_id);
    END IF;

    IF i % 2 = 0 THEN
      INSERT INTO booking.booking_snacks (id, booking_id, snack_id, name, qty, price_each)
      VALUES (
        'bsk_dash_' || lpad(i::text, 3, '0') || 'a',
        booking_id, 'snk_dash_popcorn', '[SEED] Popcorn Salted', 1, 35000
      );
    END IF;

    IF i % 4 = 0 THEN
      INSERT INTO booking.booking_snacks (id, booking_id, snack_id, name, qty, price_each)
      VALUES (
        'bsk_dash_' || lpad(i::text, 3, '0') || 'b',
        booking_id, 'snk_dash_soda', '[SEED] Soft Drink', 1, 25000
      );
    END IF;
  END LOOP;
END $$;

UPDATE cms.schedule_meta SET global_rev = global_rev + 1, updated_at = NOW() WHERE id = 1;

COMMIT;

-- Ringkasan cepat
SELECT 'sites' AS kind, COUNT(*)::text AS n FROM cms.sites WHERE code LIKE 'dash-%'
UNION ALL
SELECT 'screens', COUNT(*)::text FROM cms.screens sc
  JOIN cms.sites s ON s.id = sc.site_id WHERE s.code LIKE 'dash-%'
UNION ALL
SELECT 'assets', COUNT(*)::text FROM cms.asset_versions WHERE title LIKE 'DASH-SEED%'
UNION ALL
SELECT 'shows', COUNT(*)::text FROM cms.shows sh
  JOIN cms.screens sc ON sc.id = sh.screen_id
  JOIN cms.sites s ON s.id = sc.site_id WHERE s.code LIKE 'dash-%'
UNION ALL
SELECT 'bookings', COUNT(*)::text FROM booking.bookings WHERE id LIKE 'bkg_dash_%'
UNION ALL
SELECT 'sold_seats', COUNT(*)::text FROM booking.showtime_seats WHERE booking_id LIKE 'bkg_dash_%'
UNION ALL
SELECT 'devices', COUNT(*)::text FROM cms.devices WHERE name LIKE '[SEED]%';
