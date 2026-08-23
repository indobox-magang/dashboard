# Indobox Business Dashboard

**Branch:** `dev/kye`  
**Stack:** Next.js 15 · React 19 · Tailwind 4  
**Port (dev):** `http://localhost:3001`  
**Backend:** [indobox-cms](https://github.com/indoboxdigitalbuana/indobox-cms) Go API (`/v1/admin/*`)

Dashboard operasional bisnis Indobox Cinema: Command Center, Operasional, F&B, Optimizer, Settings — membaca data live dari CMS (bukan mock lokal untuk item yang sudah di-resolve).

---

## 1. Ringkasan status

Pekerjaan di branch ini:

1. Wire-up UI ke API CMS yang sudah ada (summary + list admin).
2. Wire-up gap baru: **alert settings**, **acknowledgements**, **inventori/restock**, **vending seed**, **private screening revenue mix**.
3. Docs gap engineering: [`docs/CMS_DATA_GAPS.md`](docs/CMS_DATA_GAPS.md).

**Belum:** koneksi vendor/hardware vending live; auto-decrement stok saat booking pay (CMS).

---

## 2. Cara menjalankan (lokal)

Prasyarat: CMS API sudah jalan (default `http://localhost:8080`).

```bash
cd dashboard
cp .env.local.example .env.local
# sesuaikan NEXT_PUBLIC_API_URL jika API bukan :8080

npm install
npm run dev    # http://localhost:3001
```

Login UI memakai akun CMS admin, contoh seed: `admin@indobox.cloud` / `admin123`.

Untuk data inventori + vending demo, seed di CMS (lihat `indobox-cms/docs/SEED_INVENTORY_VENDING.md` / script `seed-inventory-vending.sql`).

---

## 3. Sudah dikerjakan (frontend)

| Area | Status | Catatan |
|------|--------|---------|
| Halaman `/`, `/login`, `/command`, `/operations`, `/fnb`, `/optimizer`, `/settings`, `/cms` | ✅ | App shell + auth CMS JWT |
| Dashboard summary dari CMS | ✅ | Hook `useDashboardSummary` |
| List/snapshot CMS (sites, devices, dll.) | ✅ | Client list API / `cms` helpers |
| **Settings** — alert catalogue + thresholds | ✅ | Load/save `GET/PUT .../dashboard/alert-settings` |
| **Action Needed** — dismiss alert | ✅ | `POST .../dashboard/alert-acknowledgements` (pakai `alert.key`) |
| **Command Center** — mix pendapatan 3 slice | ✅ | Tiket publik / private screening / snack |
| **F&B** — stok on-hand + restock | ✅ | `.../inventory/snacks` (+ restock list) |
| **Operasional** — panel vending | ✅ | `.../vending/machines` (data seed, bukan live) |
| Gap list Settings + badge `(Belum ada di cms)` | ✅ | Item resolved dikurangi; backlog di `docs/CMS_DATA_GAPS.md` |

### Tier gap (mirror CMS)

| Tier | Arti | Frontend |
|------|------|----------|
| **1** Alert settings | Config API | ✅ wired |
| **2** Alert ack | Soft schema | ✅ wired |
| **2b** Private screening revenue | `is_private` + summary fields | ✅ wired di Command mix |
| **3** Snack inventory + restock | Domain tables | ✅ wired di F&B |
| **4** Vending | Integration-heavy | ✅ **seed-first only** (bukan vendor live) |

---

## 4. Belum dikerjakan / next

| Item | Catatan |
|------|---------|
| Live vending vendor / edge ingestion | Pengganti seed `cms.vending_*` |
| Auto-decrement stok saat booking pay | Kerjaan CMS; UI F&B sudah baca inventori |
| Form admin CMS untuk `is_private` / restock | API siap; form di CMS web opsional |
| Backend CMS terkait di mesin lokal | Banyak file API/migration dashboard di `indobox-cms` branch `dev/kye` mungkin belum di-push — dashboard ini mengasumsikan API tersebut tersedia |

Detail engineering backlog: [`docs/CMS_DATA_GAPS.md`](docs/CMS_DATA_GAPS.md).

---

## 5. Halaman & file penting

```
src/app/(app)/command/page.tsx      Command Center
src/app/(app)/operations/page.tsx   Operasional (+ vending)
src/app/(app)/fnb/page.tsx          F&B (+ inventori)
src/app/(app)/optimizer/page.tsx    Optimizer
src/app/(app)/settings/page.tsx     Settings / alert / gap list
src/app/(app)/cms/page.tsx          CMS snapshot
src/lib/api.ts                      Admin API client
src/lib/types.ts                    Shared types
src/hooks/useDashboardSummary.tsx   Summary + filters
src/components/Alerts.tsx           Action Needed
docs/CMS_DATA_GAPS.md               Gap backlog (source of truth engineering)
```

---

## 6. Indeks dokumen

| Dokumen | Isi |
|---------|-----|
| [`docs/CMS_DATA_GAPS.md`](docs/CMS_DATA_GAPS.md) | Tier backlog + resolved |
| `indobox-cms/docs/DASHBOARD_ALERT_SETTINGS_TIER1.md` | Tier 1 (CMS) |
| `indobox-cms/docs/DASHBOARD_ALERT_ACKNOWLEDGEMENTS_TIER2.md` | Tier 2 ack |
| `indobox-cms/docs/DASHBOARD_PRIVATE_SCREENING_TIER2B.md` | Tier 2b |
| `indobox-cms/docs/DASHBOARD_SNACK_INVENTORY_TIER3.md` | Tier 3 |
| `indobox-cms/docs/SEED_INVENTORY_VENDING.md` | Tier 4 seed-first |

---

## 7. One-liner

Frontend dashboard di-wire ke CMS untuk summary, alert settings/ack, inventori, dan vending seed; yang masih open terutama **live vending** dan decrement stok otomatis di sisi CMS.
