# Dashboard ↔ indobox-cms Data Contract

| Field | Value |
|---|---|
| Consumer | Indobox Business Dashboard (`dashboard/`) |
| Producer | indobox-cms Go API |
| PRD | [`../indobox-dashboard-prd-v2.1.md`](../indobox-dashboard-prd-v2.1.md) |
| CMS backlog | [`CMS-ALIGNMENT-BACKLOG.md`](CMS-ALIGNMENT-BACKLOG.md) |
| Last updated | 10 August 2026 |

This document describes **what the dashboard consumes today**.  
Target PRD definitions that differ are marked Partial / Not implemented in PRD v2.1 and tracked in the CMS backlog.

## Auth & transport

| Item | Value |
|---|---|
| Base URL | `NEXT_PUBLIC_API_URL` (local default `http://127.0.0.1:8081`) |
| Login | `POST /v1/admin/auth/login` → CMS admin JWT |
| Summary | `GET /v1/admin/dashboard/summary?period={1d\|7d\|28d}&site_id={optional}` |
| Auth header | `Authorization: Bearer <token>` |
| CORS | Dashboard origin `:3001` must be allowed by CMS |

Token storage (browser): `localStorage` key `indobox_dashboard_token`.

## Period window (current)

| `period` | Meaning |
|---|---|
| `1d` | Rolling last 24h from request time (UTC window in API) |
| `7d` | Rolling last 7 days |
| `28d` | Rolling last 28 days |

Not yet supported (see backlog **A-04**, **A-05**): `yesterday`, custom `from`/`to`, YoY.

## Response shape → CMS sources

Top-level type: `DashboardSummary` in [`../src/lib/types.ts`](../src/lib/types.ts).

| Field | Current meaning | CMS sources | PRD status |
|---|---|---|---|
| `as_of` | Response generation time (UTC RFC3339) | API clock | Partial vs EC-07 (no fresh/stale) → **A-12** |
| `period` / `label` | Echo of query period | — | Partial vs EC-02 → **A-04** |
| `sites[]` | Active branches | `cms.sites` (`active = true`) | Implemented |
| `kpis.ticket_revenue` | Sum `booking.bookings.total` for `paid\|used` | `booking.bookings` | Partial (gross face, not PRD net) → **A-01** |
| `kpis.snack_revenue` | Sum `qty * price_each` | `booking.booking_snacks` | Partial (booking-app only) → **C-04**, **D-02** |
| `kpis.net_revenue` | `ticket_revenue + snack_revenue` | derived | Partial → **A-01** |
| `kpis.admissions` | Count sold seats on those bookings | `booking.showtime_seats` status `sold` | Partial (sold ≠ scanned) → **A-02** |
| `kpis.occupancy_pct` | admissions ÷ Σ(`rows*cols`) over non-cancelled shows in window | `cms.shows`, `cms.screens` | Partial → **B-02** |
| `kpis.atp` | `ticket_revenue / admissions` | derived | Partial → **A-01**, **B-04** |
| `kpis.fnb_per_admission` | `snack_revenue / admissions` | derived | Implemented (for booking channel) |
| `kpis.revpash` | `net_revenue / seat_hours` | shows `ends_at` or 3.5h fallback | Partial → **A-14** |
| `kpis.deltas.*` | vs previous equal-length window | derived | Partial (not 8w DOW / YoY) → **A-10**, **A-05** |
| `mix.ticket_pct` / `snack_pct` | Share of net | derived | Partial (no counter/vending split) → **C-04**, **D-01** |
| `trend[]` | Daily ticket+snack revenue (WIB date) | bookings + snacks | Implemented |
| `branches[]` | Per-site revenue, occupancy, revpash, change vs prev window | sites/screens/shows/bookings | Partial vs OP-01 → **A-06** |
| `devices[]` | Edge **players** (not vending) | `cms.devices` (+ site name) | Implemented interim; vending → **D-01** |
| `devices[].online` | `last_heartbeat_at` within 120s | `cms.devices` | Implemented |
| `heat` | Dow × slot avg occupancy | shows + sold seats | Partial vs SO-02 → **A-07** |
| `genres[]` | Genre × daypart occupancy | `cms.asset_versions.genre` | Partial (metadata quality) → **B-03** |
| `films[]` | Title, occupancy, revpash, admissions | shows + assets + seats | Partial vs SO-04 → **A-08**, **A-09** |
| `fnb.*` | Booking-app snack attach/basket/items/hours | `booking_snacks` + bookings | Implemented (channel-limited) |
| `alerts[]` | Heuristic list (offline player, snack unavailable, low occ, …) | devices, snacks, occupancy | Partial vs §8 engine → **A-11** |
| `health.*` | Device online % / offline count + fnb/admission | devices | Implemented (player, not vending) |
| `unavailable_snacks[]` | Catalog `available = 0` | `booking.snacks` | Partial vs stockout duration → **B-05**, **D-03** |

## Explicit non-sources (not in current contract)

| Domain | PRD want | Today |
|---|---|---|
| Vending sales / uptime / planogram | OP-03, EC-03, Machine down | Absent → **D-01** |
| Counter POS F&B | EC-03, §5.1 | Absent → **D-02** |
| PB1 / VAT lines | §6 Net ticket | Absent → **B-08** |
| Seats on sale / blocked | §6 Seats available | Absent → **B-02** |
| Trading hours | Uptime / stockout windows | Absent → **B-01** |
| Demographics | SO-07 | Absent → **D-04** |
| Alert ack/dismiss audit | AT-01/02 | Absent → **B-07** |
| Role-scoped dashboard users | §11 | CMS admin JWT only → **D-05** |

## Multi-endpoint composition

The dashboard loads **summary** (KPIs / heat / aggregates) and a **CMS catalog** in parallel. Catalog soft-fails: one list endpoint failing does not blank the whole UI if summary succeeded.

| Endpoint | Auth | Envelope | Used for |
|---|---|---|---|
| `POST /v1/admin/auth/login` | public | token | Login |
| `GET /v1/admin/dashboard/summary` | admin | `DashboardSummary` | KPIs, mix, trend, heat, films, fnb aggregates, alerts |
| `GET /v1/admin/sites` | admin | `{ items }` | Branch filter + site metadata |
| `GET /v1/admin/screens?site_id=` | admin | `{ items }` | Capacity on Ops / Optimizer |
| `GET /v1/admin/devices?site_id=` | admin | `{ devices }` | Player tracker (hostname, show, agent, heartbeat) |
| `GET /v1/admin/shows?status=` | admin | `{ items }` | Schedule strip (scheduled + done merged client-side) |
| `GET /v1/admin/assets?kind=feature` | admin | `{ items }` | Film metadata enrich (genre, release_date) |
| `GET /v1/admin/snacks` | admin-as-manager | array | Full snack catalog (available + price) |
| `GET /v1/admin/bookings` | admin-as-manager | array | Recent bookings sample |
| `GET /health` | public | `{ status }` | Settings connection status |

Device online rule (client): `last_heartbeat_at` within **120 seconds** — same as CMS web admin.

### Page → sources

| Page | Keep from summary | Prefer from CMS lists |
|---|---|---|
| **Command** | KPIs, mix, trend, alerts, branches | Upcoming/recent shows; bookings sample; devices online from `/devices` |
| **Operations** | Branch leaderboard, health KPIs (fallback) | `DeviceList` from `/devices`; full snack catalog from `/snacks`; screen capacity from `/screens` |
| **F&B** | fnb attach/items/hours | Snack catalog `/snacks`; recent paid/used bookings `/bookings` |
| **Optimizer** | heat, genres, films, alerts | Enrich films via `/assets`; schedule `/shows`; screens capacity `/screens` |
| **Settings** | — (local alert toggles) | `/health` + per-endpoint probe status (`cms.endpoints`) |
| **Filters** | `summary.sites` fallback | Site options from `cms.sites` |

Site filter refetches summary + site-scoped `devices` / `screens` (and filters shows by site).

## Client mapping

| Dashboard code | Role |
|---|---|
| [`../src/lib/api.ts`](../src/lib/api.ts) | `loginAdmin`, `fetchDashboardSummary`, catalog fetchers |
| [`../src/lib/cms.ts`](../src/lib/cms.ts) | CMS types, `isDeviceOnline`, `mapDeviceToRow` |
| [`../src/lib/types.ts`](../src/lib/types.ts) | Summary TypeScript contract |
| [`../src/hooks/useDashboardSummary.tsx`](../src/hooks/useDashboardSummary.tsx) | Summary + catalog fetch; period/site state |

## Change policy

1. If CMS changes summary JSON, update this file and `types.ts` in the same PR as the dashboard consumer change.  
2. If PRD target moves, update PRD v2.1 status + backlog IDs; do not silently change live formulas.  
3. Prefer additive fields over renaming breaking keys.
