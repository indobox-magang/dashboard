# Dashboard metrics & data sources

## Architecture

Dashboard reads the **same Postgres** as `indobox-cms` (schemas `cms` + `booking`).  
Booking SPA and core-scheduler also use that CMS API/DB — there is no separate analytics warehouse.

| Layer | Role |
|---|---|
| CMS Postgres | Single OLTP (`cms.*` + `booking.*`) |
| Dashboard BFF | `GET /api/dashboard/summary` queries CMS DB; verifies admin JWT |
| Login | CMS `POST /v1/admin/auth/login` |

## Environment

```bash
cp .env.local.example .env.local
# Start indobox-cms docker postgres + API, then:
npm run seed    # dummy sites / shows / bookings
npm run dev     # :3001 (run from a path without "!" on Windows)
```

## Seed

`npm run seed` runs [`scripts/seed-demo.mjs`](../scripts/seed-demo.mjs):

- 3 branches (`dash-seed-depok`, `belitung`, `morowali`)
- Screens, devices (online + one offline/error), feature films
- ~21 days of showtimes + paid/used bookings + snacks
- Re-runnable (deletes previous `dash-seed-*` rows first)

## Metric dictionary

| Metric | Definition |
|---|---|
| Admissions | Count of `booking.showtime_seats` with status `sold` on paid/used bookings |
| Ticket revenue | `grand_total − admin_fee − snack lines` (fallback `total`) |
| Snack revenue | Sum of `booking_snacks.qty * price_each` |
| Occupancy | Admissions ÷ Σ(screen rows×cols) for shows in period |
| Device online | `last_heartbeat_at` within 120s |

## Not in CMS

Vending telemetry, edge download progress, heartbeat history — not available.
