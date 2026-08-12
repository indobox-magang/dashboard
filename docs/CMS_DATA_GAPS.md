# CMS data gaps (engineering)

Engineering backlog: data / capabilities the **business dashboard** needs that are **not yet modeled or persisted in indobox-cms**.

Scope: dashboard ↔ CMS only. Product/`[CONFIRM]` PRD research items are out of scope unless they already appear as `(Belum ada di cms)` in the UI.

**Source of truth in UI:** `src/components/NotInCms.tsx` + Settings “Sumber data & celah CMS”.

**Already available in CMS (for contrast):**

`cms.sites` · `cms.screens` · `cms.shows` · `cms.devices` · `cms.assets` · `booking.bookings` · `booking.showtime_seats` · `booking.snacks` · `booking.booking_snacks`

---

## Complexity tiers

| Tier | Name | What it usually means for CMS |
|------|------|-------------------------------|
| **1** | Config / API only | Little or no new schema; admin settings, thresholds, CRUD APIs over config rows |
| **2** | Soft schema | Small new tables/columns on existing domains (booking/cms), same deploy path as normal migrations |
| **3** | New domain tables | New business domain in Postgres (inventory, etc.) + admin UI/API |
| **4** | Integration-heavy | Schema **plus** external systems / hardware / ingestion pipelines |

---

## Tier 1 — Config / API only

| Gap | Where dashboard shows it | Current workaround | Likely CMS work |
|-----|--------------------------|--------------------|-----------------|
| ~~Alert catalogue (enable/disable types)~~ | Settings · Sidebar | → **Resolved** | — |
| ~~Alert thresholds~~ | Settings “Nilai pemicu” | → **Resolved** | — |
| ~~Alert settings module~~ | Settings page | → **Resolved** (API done; UI wire-up optional) | — |

**Notes**

- Signal inputs (devices, snacks, occupancy from shows/bookings) already come from CMS.
- CMS now persists catalogue + thresholds; dashboard Settings can call the new admin API.

---

## Tier 2 — Soft schema

| Gap | Where dashboard shows it | Current workaround | Likely CMS work |
|-----|--------------------------|--------------------|-----------------|
| ~~Alert acknowledgement persistence~~ | Action Needed panel | → **Resolved** | — |
| ~~Private screening sebagai stream revenue~~ | Settings / Command mix | → **Resolved** | — |

**Notes**

- Acknowledgements use stable alert `key` (see CMS Tier 2 doc).
- Private screening: `cms.shows.is_private` + summary mix fields (see Tier 2b doc).

---

## Tier 3 — New domain tables

| Gap | Where dashboard shows it | Current workaround | Likely CMS work |
|-----|--------------------------|--------------------|-----------------|
| ~~Daily F&B inventory / on-hand stock~~ | F&B Detail | → **Resolved** | — |
| ~~Restock log~~ | F&B Detail | → **Resolved** | — |

**Notes**

- Tables: `booking.snack_inventory`, `booking.snack_restocks`.
- Distinct from sales (`booking_snacks`) and catalog flag (`snacks.available`).

---

## Tier 4 — Integration-heavy

| Gap | Where dashboard shows it | Current workaround | Likely CMS work |
|-----|--------------------------|--------------------|-----------------|
| Vending machines | Operations / F&B | **Seed simulasi** di `cms.vending_*` (bukan vendor live) | Nanti: ingestion dari hardware/vendor |
| Vending stockout events | Operations | Seed `vending_events` + slot qty=0 | Live event stream |
| Vending / edge telemetry | Operations | Seed uptime/status/error_code | Heartbeat API dari edge/vendor |

**Notes**

- Highest coupling for **live** data: need a producer (machine API, edge agent, or vendor webhook).
- **Seed-first** path: `scripts/seed-inventory-vending.sql` — see `docs/SEED_INVENTORY_VENDING.md`.

---

## Suggested implementation order (engineering)

1. **Tier 1** — ✅
2. **Tier 2 acknowledgements** — ✅
3. **Tier 2 private screening** — ✅
4. **Tier 3 inventory/restock** — ✅
5. **Tier 4 vending** — seed-first ✅ · live vendor feed masih open

---

## Resolved

| Gap | Tier | When | CMS change |
|-----|------|------|------------|
| Alert catalogue + thresholds + settings module | 1 | 2026-08-12 | `GET/PUT /v1/admin/dashboard/alert-settings` … Doc: `DASHBOARD_ALERT_SETTINGS_TIER1.md` |
| Alert acknowledgement persistence | 2 | 2026-08-12 | `cms.alert_acknowledgements` … Doc: `DASHBOARD_ALERT_ACKNOWLEDGEMENTS_TIER2.md` |
| Private screening revenue stream | 2b | 2026-08-12 | `cms.shows.is_private` … Doc: `DASHBOARD_PRIVATE_SCREENING_TIER2B.md` |
| Inventori stok + restock log | 3 | 2026-08-12 | `booking.snack_inventory` + restocks … Doc: `DASHBOARD_SNACK_INVENTORY_TIER3.md` |
| Vending demo via seed (not live) | 4-seed | 2026-08-12 | `cms.vending_*` + seed script … Doc: `SEED_INVENTORY_VENDING.md` |

> Dashboard Settings + Action Needed wired to CMS alert-settings / alert-acknowledgements APIs (local).

---

## Maintenance

When adding a `(Belum ada di cms)` badge or Settings gap row, update this file in the same PR.

When a gap ships in CMS, move the row to **Resolved** (date + migration/PR/doc link) or delete it and remove the UI badge.
