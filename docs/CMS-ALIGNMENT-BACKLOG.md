# CMS Alignment Backlog — Proposal to indobox-cms owners

| Field | Value |
|---|---|
| Audience | indobox-cms engineering / product owners |
| Source PRD | [`../indobox-dashboard-prd-v2.1.md`](../indobox-dashboard-prd-v2.1.md) |
| Current consumer | Indobox Business Dashboard → `GET /v1/admin/dashboard/summary` |
| Last updated | 10 August 2026 |

This document proposes CMS work so the **dashboard PRD can be fully met**.  
It does **not** change CMS by itself. Items are ordered by blast radius: API-only → small schema → medium → significant.

## Status legend (used in PRD v2.1)

| Status | Meaning |
|---|---|
| Implemented | Available in CMS and consumed by the dashboard today |
| Partial | Proxy exists; PRD definition not fully met |
| Not implemented | Still required by PRD; tracked here |

## Baseline already in place (do not re-open)

| Item | Notes |
|---|---|
| CORS origins for dashboard `:3001` | Dev default includes `localhost:3001` / `127.0.0.1:3001` |
| `GET /v1/admin/dashboard/summary` | Admin JWT; periods `1d\|7d\|28d`; optional `site_id` |
| Local demo seed | `indobox-cms/api/scripts/seed-dashboard-demo.sql` |

---

## A — API / query only (no auth redesign)

| ID | Title | PRD refs | Why | Suggested CMS change | Effort | Depends |
|---|---|---|---|---|---|---|
| A-01 | Net revenue formula | §6 Net ticket / EC-01 | UI “net” currently uses ticket face `total` + snacks | Expose `ticket_revenue_gross`, `ticket_revenue_net = total - discount` (document treatment of `admin_fee`) | S | — |
| A-02 | Admissions basis flag | §6 Admissions | PRD prefers scanned; CMS has sold + `used` | Query param or response field `admissions_basis=sold\|used`; default document | S | — |
| A-03 | Sparkline / series buckets | EC-01 | KPI cards need trailing 14 periods | Add `kpis.series` or `sparkline[]` on summary | S | — |
| A-04 | Period: yesterday + custom range | EC-02 | Only `1d/7d/28d` today | Support `yesterday`, `from`+`to` ISO dates | S | — |
| A-05 | Year-over-year compare | EC-02 | Needs history depth | Comparison mode when ≥13 months data; else omit | M | history |
| A-06 | Branch attach + admissions columns | OP-01 | Leaderboard incomplete vs PRD | Extend `branches[]` with `admissions`, `attach_pct` | S | — |
| A-07 | Heatmap confidence counts | SO-02 | Low-n cells look as reliable as high-n | Per-cell `showtimes_count` (or parallel matrix) | S | — |
| A-08 | Film weeks-on-screen + WoW | SO-04, SO-05, Under-utilised | Needed for programming alerts | Derive from first `cms.shows` per feature asset | M | — |
| A-09 | Film ATP + F&B/admission | SO-04 | Ranking incomplete | Aggregate per `feature_asset_id` | S | — |
| A-10 | Self-baseline 8 weeks | OP-02, Conversion Gap, Revenue anomaly | Branch count typically &lt; 8 | Previous-window / trailing-8w same DOW baselines in summary or alerts | M | — |
| A-11 | Compute-on-read alert engine | EC-04, §8.1 | Alerts today are heuristic stubs | Demand Overflow, Under-utilised, Conversion Gap, Revenue anomaly with sample gates | M | A-08, A-10 |
| A-12 | Freshness metadata | EC-07 | Only `as_of` today | `freshness: { state, sources[] }` on summary | S | — |
| A-13 | Business-day cut 04:00 WIB | §6 Business day | Calendar day from `paid_at` | Shift attribution window; config constant OK at first | S | — |
| A-14 | Enforce / backfill `shows.ends_at` | §6 RevPASH | Duration fallback 3.5h | Ensure create/update always sets `ends_at` | S | — |

---

## B — Small schema (still no new auth system)

| ID | Title | PRD refs | Why | Suggested CMS change | Effort | Depends |
|---|---|---|---|---|---|---|
| B-01 | Site trading hours | Machine uptime, Stockout during hours | No trading-hours master data | `cms.sites.trading_hours_json` or open/close times | S | — |
| B-02 | Seats for sale / blocked | §6 Seats available | Occupancy uses `rows*cols` only | `cms.screens.seats_blocked` or `seats_for_sale` | S | — |
| B-03 | Asset distributor | §5.1 film metadata | Missing for programming context | `cms.asset_versions.distributor` | S | — |
| B-04 | Complimentary bookings | §6 Admissions / ATP | Cannot exclude comps from revenue | `booking.bookings.is_complimentary` | S | A-01, A-02 |
| B-05 | Snack stock qty + last restock | Stockout, OP-04/05 (light) | Only `available` 0/1 today | `booking.snacks.stock_qty`, `last_restock_at` | S | — |
| B-06 | Alert threshold settings | §8 “config not constants” | Thresholds hard-coded in API | `cms.settings` or dashboard_thresholds table + admin GET/PUT | M | — |
| B-07 | Alert ack / dismiss events | AT-01, AT-02, §10 Audit | FE dismiss is local-only | `cms.dashboard_alert_events` (alert_key, action, reason, user_id, ts); **reuse admin JWT** | M | A-11 |
| B-08 | PB1 / tax breakdown fields | §6 Net ticket | No VAT/PB1 in schema | Decide: store tax components or document net = post-discount pre-fee | M | A-01 |

---

## C — Medium (no new auth system)

| ID | Title | PRD refs | Why | Suggested CMS change | Effort | Depends |
|---|---|---|---|---|---|---|
| C-01 | Dedicated alerts endpoint | EC-04, §8.2 silent mode | Separate poll / silent logging | `GET /v1/admin/dashboard/alerts?silent=` | M | A-11, B-06 |
| C-02 | Estimated Rp impact on alerts | §8.3 priority score | Ranking needs impact | Compute est. revenue from occupancy × price × seats | M | A-11 |
| C-03 | CSV export endpoints | §10 Export | Tables exportable | Optional `Accept` or `/export` for summary slices | M | — |
| C-04 | Explicit F&B channel label | EC-03 | Honest mix until vending exists | `mix.fnb_channel = "booking_app"` (+ future channels) | S | — |

---

## D — Significant / external (keep in PRD as Not implemented)

| ID | Title | PRD refs | Why | Suggested direction | Effort | Depends |
|---|---|---|---|---|---|---|
| D-01 | Vending telemetry | OP-03, Machine down, EC-03 split | No vending tables/APIs | Hardware + ingest service; or defer OP-03 to P2 | L | — |
| D-02 | Counter POS F&B | EC-03, §5.1 counter | Only booking snacks today | External POS integration or manual entry | L | — |
| D-03 | Full inventory / stockout duration | Stockout alert, OP-04/05 | Need qty over time | Inventory events stream | L | B-05 |
| D-04 | Demographics + PDP | SO-07, §5.3 | No demographic attributes | Legal review + aggregate store | L | — |
| D-05 | Dashboard role matrix | §11 | v1 = CMS admin only | Map GM/Ops/Programming/F&B (+ branch scope) without breaking admin | L | — |
| D-06 | Push / WhatsApp / digest | §8.4 | No notification pipe | Provider + quiet hours | L | C-01, B-07 |
| D-07 | 13-month warehouse / YoY | EC-02 YoY, §10 history | Live DB may not retain/serve analytics depth | Warehouse or retention policy | L | A-05 |
| D-08 | Full Action Tracker | AT-04 | Deliberately deferred in PRD | Only after AT-01/02 adoption | L | B-07 |

---

## Suggested adoption order for CMS owners

1. **A-01, A-02, A-12, A-13, A-14, C-04** — metric honesty + labels (quick win for PRD alignment).  
2. **A-03, A-04, A-06, A-07, A-09** — Command Center / Optimizer completeness.  
3. **A-08, A-10, A-11, B-06, C-01, C-02** — real alert engine.  
4. **B-07** — ack/dismiss for G2 measurement.  
5. **B-01, B-02, B-04, B-05** — master-data quality.  
6. **D-*** — only after product confirms external systems exist.

## Related docs

- PRD (status-aligned): [`../indobox-dashboard-prd-v2.1.md`](../indobox-dashboard-prd-v2.1.md)
- Original PRD (unchanged archive): [`../indobox-dashboard-prd-v2.md`](../indobox-dashboard-prd-v2.md)
- Live API field map: [`DATA-CONTRACT.md`](DATA-CONTRACT.md)
