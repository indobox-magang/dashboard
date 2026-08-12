-- =============================================================================
-- IndoBox Dashboard — REMOVE demo seed
--
-- Hapus semua baris bertanda seed:
--   sites code LIKE 'dash-%'
--   booking/user/snack/promo id LIKE '%_dash_%' / 'usr_dash_%' / 'snk_dash_%' / ...
--   asset title LIKE 'DASH-SEED%'
--
-- Usage:
--   psql "postgres://indobox:indobox@127.0.0.1:5432/indobox?sslmode=disable" \
--     -f scripts/unseed-dashboard-demo.sql
-- =============================================================================

BEGIN;

-- Clear device playback pointers before deleting shows/devices.
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
WHERE id LIKE 'bsk_dash_%'
   OR booking_id LIKE 'bkg_dash_%';

DELETE FROM booking.showtime_seats
WHERE booking_id LIKE 'bkg_dash_%'
   OR show_id IN (
    SELECT sh.id
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    JOIN cms.sites s ON s.id = sc.site_id
    WHERE s.code LIKE 'dash-%'
  );

DELETE FROM booking.bookings
WHERE id LIKE 'bkg_dash_%'
   OR show_id IN (
    SELECT sh.id
    FROM cms.shows sh
    JOIN cms.screens sc ON sc.id = sh.screen_id
    JOIN cms.sites s ON s.id = sc.site_id
    WHERE s.code LIKE 'dash-%'
  );

DELETE FROM cms.playlist_items
WHERE show_id IN (
  SELECT sh.id
  FROM cms.shows sh
  JOIN cms.screens sc ON sc.id = sh.screen_id
  JOIN cms.sites s ON s.id = sc.site_id
  WHERE s.code LIKE 'dash-%'
);

DELETE FROM cms.shows
WHERE screen_id IN (
  SELECT sc.id
  FROM cms.screens sc
  JOIN cms.sites s ON s.id = sc.site_id
  WHERE s.code LIKE 'dash-%'
)
   OR title LIKE 'DASH-SEED%'
   OR title LIKE '[SEED]%';

DELETE FROM cms.device_pairings
WHERE device_id IN (
  SELECT d.id
  FROM cms.devices d
  JOIN cms.sites s ON s.id = d.site_id
  WHERE s.code LIKE 'dash-%'
);

DELETE FROM cms.device_screens
WHERE device_id IN (
  SELECT d.id
  FROM cms.devices d
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
WHERE title LIKE 'DASH-SEED%'
   OR title LIKE '[SEED]%';

DELETE FROM booking.notifications WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.user_auth_versions WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.partner_applications WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.ph_members WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.user_memberships WHERE user_id LIKE 'usr_dash_%';
DELETE FROM booking.users WHERE id LIKE 'usr_dash_%';

DELETE FROM booking.snacks WHERE id LIKE 'snk_dash_%';
DELETE FROM booking.promos WHERE id LIKE 'prm_dash_%' OR code LIKE 'DASH%';

UPDATE cms.schedule_meta SET global_rev = global_rev + 1, updated_at = NOW() WHERE id = 1;

COMMIT;
