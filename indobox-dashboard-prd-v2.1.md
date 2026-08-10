# PRD — Indobox Microcinema Business Performance Dashboard

| Field | Value |
|---|---|
| Status | Draft v2.1 (CMS-aligned status) |
| Based on | [`indobox-dashboard-prd-v2.md`](indobox-dashboard-prd-v2.md) (**unchanged archive**) |
| Product | Indobox Business Performance & Decision Dashboard |
| Document owner | *[CONFIRM]* |
| Engineering owner | *[CONFIRM]* |
| Business sponsor | *[CONFIRM]* |
| Last updated | 10 August 2026 |

> **CMS alignment model:** This document remains the **target product spec**.  
> Columns **Status vs CMS** and **Backlog** describe readiness of **indobox-cms** today.  
> Items marked **Not implemented** or **Partial** are **not removed** — they are proposed to CMS owners via [`docs/CMS-ALIGNMENT-BACKLOG.md`](docs/CMS-ALIGNMENT-BACKLOG.md).  
> Live field mapping: [`docs/DATA-CONTRACT.md`](docs/DATA-CONTRACT.md).

### Status vocabulary

| Status | Meaning |
|---|---|
| **Implemented** | Present in CMS and consumed by the dashboard now |
| **Partial** | Proxy/near-data exists; PRD definition not fully met |
| **Not implemented** | Still required by this PRD; see Backlog ID |

---

## 1. Problem Statement

Indobox operates microcinema screens alongside F&B and vending machine sales. Performance data exists across at least three systems (ticketing, F&B point of sale, vending telemetry) but is reconciled manually, after the fact, in spreadsheets. As a result:

- Underperforming showtimes stay on the schedule for weeks because nobody notices until the monthly close.
- High-demand slots are not expanded quickly enough to capture spillover demand.
- F&B stockouts and vending downtime are discovered by customers before they are discovered by management.
- Decisions about programming, staffing, and promotions are made on intuition and partial data.

The cost is not "we lack reports." The cost is **elapsed time between a problem occurring and someone acting on it**. This product exists to compress that interval.

**Current CMS slice (interim):** booking-app tickets + in-app snacks + show schedule + edge **player** health are available via unified CMS. Counter POS and vending remain target scope (Not implemented) — see §5.1 and backlog **D-01** / **D-02**.

## 2. Product Principle

> The dashboard is not a reporting surface with alerts bolted on. It is an **alert engine** with reporting surfaces behind it for drill-down.

Practical consequence: if a screen does not either (a) raise a signal that something needs attention, or (b) help diagnose a signal already raised, it does not belong in v1. Every chart must answer "so what do I do?"

## 3. Goals and Non-Goals

### 3.1 Business goals

| # | Goal | Measured by |
|---|---|---|
| G1 | Increase revenue per available seat-hour | RevPASH, tracked monthly vs. pre-launch baseline |
| G2 | Reduce time-to-detection of operational problems | Median hours between event occurrence and alert acknowledgement |
| G3 | Increase F&B attach rate | F&B attach rate by branch, vs. pre-launch baseline |
| G4 | Eliminate manual reporting labour | Hours/week spent producing ad-hoc spreadsheets |

### 3.2 Product goals

- A user can answer "what is my biggest problem right now, and what should I do about it?" within five minutes of opening the dashboard.
- Every alert carries an explicit, pre-written recommended action — not just a number in red.
- No role needs to request a manual data pull to do their weekly planning.

### 3.3 Non-goals (v1)

Stated explicitly so scope creep is visible when it happens:

- **Not** a financial reporting or accounting system. It does not replace the P&L, does not handle COGS allocation, and its revenue figures are indicative, not audited.
- **Not** a scheduling system. It recommends showtime changes; it does not write back to the ticketing system.
- **Not** a full task/project management tool. See §7.4 for the deliberately minimal scope of action tracking.
- **Not** a customer-facing or marketing-automation product.
- **Not** real-time streaming. See §10 for latency targets.

---

## 4. Users and Decision Cadence

| Role | Cadence | Primary decision | Entry point |
|---|---|---|---|
| CEO / GM | Daily (5 min), Weekly (30 min) | Which branch or business line needs my attention this week? | Executive Command Center |
| Programming | Daily, Weekly | Which film/showtime do I add, move, or drop? | Showtime Optimizer |
| Operations Manager | Daily | Which branch has an efficiency, downtime, or staffing problem today? | Operations Performance |
| F&B Manager | Daily, Weekly | What do I restock, push, bundle, or discontinue? | Operations Performance (F&B view) |

**Device assumption:** CEO/GM and Operations Manager consume primarily on **mobile**; Programming and F&B Manager primarily on **desktop**. Mobile is a first-class requirement for the Command Center and the alert feed, not a later port.

**Access today (CMS):** dashboard login uses CMS **admin** JWT only. Full role matrix remains in §11 (**Not implemented** → backlog **D-05**).

---

## 5. Data Foundation

This section governs feasibility. Requirements below §5 that depend on a **Not implemented** source stay in the PRD and are gated on the linked backlog items.

### 5.1 Source system inventory

| Data domain | Target source | CMS today | Status vs CMS | Backlog |
|---|---|---|---|---|
| Ticket transactions (film, showtime, studio, seats, price, discount) | Ticketing / booking | `booking.bookings`, `booking.showtime_seats` via booking app | **Implemented** (app channel) | — |
| Studio and seat inventory (capacity / seats on sale) | Master data | `cms.screens.rows/cols` (physical only) | **Partial** | **B-02** |
| Showtime schedule (planned vs actual, cancellations) | CMS scheduling | `cms.shows` (`status`, `starts_at`, `ends_at`, `price`, `feature_asset_id`) | **Implemented** | **A-14** (ends_at quality) |
| F&B counter transactions | F&B POS | — | **Not implemented** | **D-02** |
| F&B in-app snack lines *(interim channel)* | Booking app | `booking.booking_snacks`, `booking.snacks` | **Implemented** | **C-04** (label) |
| **Link between F&B and ticket transaction** | Shared basket | `booking_snacks.booking_id → bookings.id` | **Implemented** (in-app only) | — |
| Vending machine sales | Vending telemetry / MDB | — | **Not implemented** | **D-01** |
| Vending uptime, errors, planogram | Vending telemetry | — | **Not implemented** | **D-01** |
| Edge player heartbeat / playback *(interim ops)* | Indobox OS / CMS devices | `cms.devices` (`last_heartbeat_at`, `playback_*`) | **Implemented** (not a substitute for vending) | — |
| F&B inventory on hand | Inventory system | `booking.snacks.available` (0/1 only) | **Partial** | **B-05**, **D-03** |
| Customer demographics | Loyalty / form | — | **Not implemented** | **D-04** |
| Film metadata (genre, distributor, rating, release date) | CMS media library | `cms.asset_versions` (genre, rating, release_date; no distributor) | **Partial** | **B-03** |
| Maintenance log | Manual | — | **Not implemented** | **D-08** / ops process |

### 5.2 Critical dependency: ticket ↔ F&B linkage

**Resolved for booking-app channel:** snack lines are attached to the same `booking.bookings` row → transaction-level attach rate is computable (**Implemented**).

**Still open for full PRD F&B:** counter POS and vending are **Not implemented** (**D-02**, **D-01**). Until those exist, attach rate and F&B mix are **booking-app scoped** only.

### 5.3 Demographic data

Target requirements unchanged:

- Any demographic visualisation must display **coverage %**.
- Suppress cells below *n* = 30 *[ASSUMPTION — tune]*.
- Confirm consent under UU PDP 27/2022 before processing identifiable attributes.

| Status vs CMS | Backlog |
|---|---|
| **Not implemented** | **D-04** |

### 5.4 Scale parameters — required inputs

| Input | Status vs CMS | Notes |
|---|---|---|
| Number of branches | **Partial** | Runtime from `cms.sites`; production count *[CONFIRM]* |
| Studios per branch | **Partial** | `cms.screens` per site |
| Seats per studio | **Partial** | `rows * cols` until **B-02** |
| Showtimes per studio per day | **Partial** | Derivable from `cms.shows` |
| Months of clean historical data | **Not implemented** / ops | Gates YoY & baselines → **A-05**, **A-10**, **D-07** |

**Default for OP-02 while branch count &lt; 8:** self trailing 8-week baseline (**A-10**), not peer group.

---

## 6. Metric Dictionary

Non-negotiable target definitions. **Current CMS implementation** is what the dashboard shows today (see Data Contract).

| Metric | Target definition (PRD) | Current CMS implementation | Status vs CMS | Backlog |
|---|---|---|---|---|
| **Admissions** | Scanned/validated; fallback sold; comps separate | Count of `showtime_seats` `sold` on `paid\|used` bookings | **Partial** | **A-02**, **B-04** |
| **Gross ticket revenue** | Face value before discount | `SUM(bookings.total)` | **Implemented** | — |
| **Net ticket revenue** | Gross − discount − PB1 − booking fees | Approximated as face `total` in KPI “ticket”; no PB1 | **Partial** | **A-01**, **B-08** |
| **ATP** | Net ticket ÷ paid admissions | `ticket_revenue / admissions` | **Partial** | **A-01**, **B-04** |
| **Seats available** | Seats on sale (excl. blocked) | `rows * cols` | **Partial** | **B-02** |
| **Occupancy** | Admissions ÷ seats available; cancel excluded | Uses physical capacity; cancels excluded | **Partial** | **B-02** |
| **RevPASH** | (ticket + F&B) ÷ (seats × hours) | Uses net proxy + `ends_at` or 3.5h | **Partial** | **A-01**, **A-14** |
| **RPAS** | Net ÷ seats | Not exposed in summary UI/API | **Not implemented** | **A-09** (related) |
| **F&B net revenue** | Counter + vending, net tax | In-app `booking_snacks` only | **Partial** | **C-04**, **D-01**, **D-02** |
| **F&B attach rate** | Txns with ≥1 F&B ÷ ticket txns | Bookings with ≥1 snack line ÷ ticket txns | **Implemented** (app channel) | — |
| **F&B spend / admission** | F&B ÷ admissions | Snack revenue ÷ admissions | **Implemented** (app channel) | — |
| **Machine uptime** | Vending operational minutes ÷ trading hours | — | **Not implemented** | **D-01**, **B-01** |
| **Player online %** *(interim)* | Heartbeat freshness | `last_heartbeat_at` ≤ 120s | **Implemented** | — |
| **Stockout event** | SKU zero + duration in trading hours | `snacks.available = 0` (no duration) | **Partial** | **B-05**, **D-03**, **B-01** |
| **Slow-moving item** | Bottom quartile velocity 28d | Not computed | **Not implemented** | **D-03** |
| **Business day** | Recommend 04:00 local boundary | Calendar day from `paid_at` WIB | **Partial** | **A-13** |
| **Week** | Mon–Sun *[CONFIRM]* vs cinema Thu week | Not locked in API | **Partial** | product CONFIRM |

---

## 7. Scope by Module

Requirement IDs are stable. Priority: **P0** = v1 must-have, **P1** = v1 if capacity, **P2** = deferred.

### 7.1 Executive Command Center — *P0*

**Decision served:** Where do I direct attention today/this week?

| ID | Requirement | Priority | Status vs CMS | Backlog |
|---|---|---|---|---|
| EC-01 | KPI cards: Net revenue, Admissions, Occupancy, ATP, F&B/admission, RevPASH + deltas + sparkline (14 periods) | P0 | **Partial** — KPIs+deltas live; sparkline missing; net formula Partial | **A-01**, **A-03** |
| EC-02 | Period: Today, Yesterday, 7d, 28d, Custom; compare previous / YoY | P0 | **Partial** — `1d/7d/28d` only | **A-04**, **A-05** |
| EC-03 | Revenue mix ticket vs F&B (counter vs vending split) | P0 | **Partial** — ticket vs in-app snack only | **C-04**, **D-01**, **D-02** |
| EC-04 | Action Needed top 5 + Rp impact + drill-down | P0 | **Partial** — heuristic alerts, no ranking engine | **A-11**, **C-01**, **C-02** |
| EC-05 | Branch filter across modules | P0 | **Implemented** (`site_id`) | — |
| EC-06 | Mobile-usable KPI + Action Needed | P0 | **Partial** (FE) | FE QA |
| EC-07 | As-of + freshness state | P0 | **Partial** — `as_of` only | **A-12** |

**Acceptance criteria:** unchanged from v2.

### 7.2 Film, Genre & Showtime Optimizer — *P1 (v1.1)*

**Decision served:** What do I add, move, or drop from the schedule?

§5.2 linkage for **in-app snacks** is resolved; demografi (§5.3) still blocks SO-07.

| ID | Requirement | Priority | Status vs CMS | Backlog |
|---|---|---|---|---|
| SO-01 | Occupancy heatmap dow × slot | P1 | **Partial** — heatmap exists | **A-07** |
| SO-02 | Low-confidence cells (*n* showtimes) | P1 | **Not implemented** | **A-07** |
| SO-03 | Occupancy × RevPASH scatter | P1 | **Not implemented** | FE + summary fields |
| SO-04 | Film ranking (adm, occ, ATP, RevPASH, F&B/adm, weeks-on-screen, WoW) | P1 | **Partial** — basic film list | **A-08**, **A-09** |
| SO-05 | Decay curve by weeks-on-screen | P1 | **Not implemented** | **A-08** |
| SO-06 | Genre by daypart/branch | P2 | **Partial** — genre matrix exists | **B-03** |
| SO-07 | Demographics breakdown | P2 | **Not implemented** | **D-04** |

### 7.3 Cinema, Player & Vending Operations — *P0 (partial)*

**Decision served:** Which branch, player, or machine needs intervention today?

| ID | Requirement | Priority | Status vs CMS | Backlog |
|---|---|---|---|---|
| OP-01 | Branch leaderboard (rev, adm, occ, RevPASH, attach) | P0 | **Partial** | **A-06** |
| OP-02 | Baseline peer (≥8) or self 8-week | P0 | **Not implemented** | **A-10** |
| OP-03 | Vending/F&B equipment tracker | P0 *(P2 if no telemetry)* | **Not implemented** | **D-01** |
| OP-03b | Edge **player** health tracker *(interim)* | P0 interim | **Implemented** | — |
| OP-04 | Stockout impact estimate | P1 | **Not implemented** | **D-03**, **B-05** |
| OP-05 | Product velocity table | P1 | **Not implemented** | **D-03** |
| OP-06 | Maintenance log | P2 | **Not implemented** | process / **D-08** |

### 7.4 Action Tracker — *P2 (deliberately minimal)*

| ID | Requirement | Priority | Status vs CMS | Backlog |
|---|---|---|---|---|
| AT-01 | Alert Acknowledge (who/when) | P0 | **Not implemented** (UI dismiss is local-only) | **B-07** |
| AT-02 | Dismiss with reason code | P0 | **Not implemented** | **B-07** |
| AT-03 | Share alert to WhatsApp/email | P0 | **Not implemented** | **D-06** |
| AT-04 | Full tracker (ICE, owners, due dates, …) | P2 | **Not implemented** | **D-08** |

---

## 8. Alert Engine

### 8.1 Alert catalogue

| Alert | Trigger (target) | Recommended action | Owner | Priority | Status vs CMS | Backlog |
|---|---|---|---|---|---|---|
| **Demand Overflow** | Occ ≥ 80% same film×dow×slot, ≥3× in 14d | Add/move showtime; est. incremental Rp | Programming | High | **Not implemented** (engine) | **A-11**, **C-02** |
| **Under-utilised Show** | Occ ≤ 25% same pattern, ≥3×, ≥3rd week on screen | Drop/replace; est. cost | Programming | High | **Not implemented** | **A-11**, **A-08** |
| **Stockout — active** | SKU zero &gt; 30 min in trading hours | Restock; est. lost Rp/hour | F&B | High | **Partial** — `available=0` flag only | **B-05**, **D-03**, **B-01** |
| **Machine down** | Vending non-operational &gt; 30 min | Dispatch tech | Operations | High | **Not implemented** | **D-01** |
| **Player offline / playback error** *(interim)* | No heartbeat ≤120s or playback error | Check network / restart player | Operations | High | **Implemented** (heuristic) | **A-11** (formalize) |
| **Conversion Gap** | Attach or F&B/adm &lt; baseline −20% for 7d | Investigate upsell/promo | F&B | Medium | **Not implemented** | **A-10**, **A-11** |
| **Revenue anomaly** | Daily net outside ±2σ of 8w same-DOW | Investigate drivers | GM | Medium | **Not implemented** | **A-10**, **A-11** |

Thresholds remain **configuration values** → **B-06**.

### 8.2 Calibration protocol

Unchanged from v2 (silent mode 4 weeks, ≤5–8 alerts/user/week, sample-size gating). Requires **A-11** + **B-07** for meaningful calibration.

### 8.3 Priority score

Unchanged formula. Needs **C-02** + **B-07** for full behaviour.

### 8.4 Delivery

| Channel | Priority | Status vs CMS | Backlog |
|---|---|---|---|
| In-dashboard Action Needed | P0 | **Partial** | **A-11**, **C-01** |
| Push/WhatsApp (High, quiet hours) | P1 | **Not implemented** | **D-06** |
| Daily digest email | P1 | **Not implemented** | **D-06** |

---

## 9. Release Plan

| Phase | Contents | Exit criteria | CMS dependency note |
|---|---|---|---|
| **Phase 0 — Data foundation** | Metric dictionary reconciled; CMS contract signed | Finance ±1% sign-off | **A-01**, **A-02**, Data Contract |
| **Phase 1 — MVP** | §7.1, OP-01/02/03b, alert engine silent, AT-01/02 path | Three roles weekly routine on dashboard | Player interim OK; vending OP-03 may slip to P2 (**D-01**) |
| **Phase 2 — Alerts live** | Calibration + notifications | Volume target; ≥60% ack | **B-07**, **D-06** |
| **Phase 3 — Optimizer** | §7.2 | Programming cycle from dashboard | **A-07–A-09** |
| **Phase 4 — Evaluate** | AT-04, demographics, maintenance | Go/no-go | **D-04**, **D-08** |

---

## 10. Non-Functional Requirements

| Area | Requirement | Status vs CMS | Backlog |
|---|---|---|---|
| Data freshness | Ticketing/F&B hourly; vending ≤15m; show freshness | **Partial** — live query, no stale flag; no vending | **A-12**, **D-01** |
| Performance | View &lt; 3s on 4G; filter &lt; 1s | FE/API ops | — |
| Availability | 99% trading hours; degraded cache OK | Ops | — |
| Historical depth | ≥13 months for YoY | **Not implemented** | **D-07** |
| Concurrency | &lt; 50 users *[CONFIRM]* | — | — |
| Browser/device | Latest 2 Chrome/Safari; mobile web | FE | — |
| Localisation | ID UI, IDR, DD/MM/YYYY, WIB | FE; sites have timezone field | — |
| Export | CSV on tables; PDF/image Command Center | **Not implemented** | **C-03** |
| Audit | Ack/dismiss logged | **Not implemented** | **B-07** |

## 11. Access Control

| Role | Scope | Status vs CMS | Backlog |
|---|---|---|---|
| CEO / GM | All branches, all modules | **Not implemented** (role) | **D-05** |
| Regional manager *[CONFIRM]* | Assigned branches | **Not implemented** | **D-05** |
| Operations Manager | Assigned branches; ops/F&B | **Not implemented** | **D-05** |
| Programming | Ticketing/film modules | **Not implemented** | **D-05** |
| F&B Manager | F&B modules | **Not implemented** | **D-05** |
| Admin | Thresholds, users | **Partial** — CMS admin can login dashboard | **B-06**, **D-05** |

**Interim:** any CMS admin can use the full dashboard.

**Open question (unchanged):** should a branch manager see other branches’ absolute figures?

---

## 12. Assumptions, Dependencies, Risks

| # | Item | Type | Impact | Mitigation / CMS status |
|---|---|---|---|---|
| R1 | Ticket ↔ F&B not linkable | Risk | Attach / per-film F&B weak | **Mitigated for app channel** (Implemented). Counter/vending still open → **D-02**, **D-01** |
| R2 | Vending lack telemetry | Risk | OP-03 / Machine down blocked | Confirmed absent today → keep in PRD; backlog **D-01**; interim **OP-03b** players |
| R3 | Branch count too low for peer bench | Assumption | Peer OP-02 weak | Default self-baseline **A-10** |
| R4 | Insufficient history for baselines | Risk | Anomaly / Conversion Gap delayed | Suppress until data exists → **A-10**, **D-07** |
| R5 | Master data inaccurate | Risk | Occ/uptime wrong | **B-01**, **B-02**, named owner |
| R6 | Alert fatigue | Risk | Abandonment | §8.2 gate; needs **A-11** |
| R7 | Demographics vs PDP | Risk | Legal | **D-04** before any build |
| R8 | No owner for acting on alerts | Risk | No outcomes | Assign owners before Phase 2 |

---

## 13. Success Metrics

Unchanged from v2 (adoption, ack rate, false-alarm rate, RevPASH, F&B/admission, reporting hours, usability tests).  
G2 ack metrics require **B-07**.

---

## 14. Open Questions — Required Before Approval

| # | Question | Status |
|---|---|---|
| 1 | Can F&B be linked to tickets? | **Answered for booking app: yes.** Counter/vending still open → **D-02** / **D-01** |
| 2 | Branches / studios / seats scale? | **Partial** — readable from CMS; production CONFIRM still needed |
| 3 | Do vending machines expose telemetry? | **No in CMS today** → **D-01**; decide P0 vs P2 |
| 4 | Months of clean history? | Still *[CONFIRM]* → gates **A-05** / **A-10** |
| 5 | Demographics source + consent? | Still open → **D-04** |
| 6 | Who owns each alert type? | Still *[CONFIRM]* (org) |
| 7 | Build vs buy BI platform? | Still *[CONFIRM]* (program) |

---

## 15. Documents for CMS owners

| Doc | Purpose |
|---|---|
| [`docs/CMS-ALIGNMENT-BACKLOG.md`](docs/CMS-ALIGNMENT-BACKLOG.md) | Proposed CMS work (A→D) to fulfil this PRD |
| [`docs/DATA-CONTRACT.md`](docs/DATA-CONTRACT.md) | What the dashboard already consumes |
| [`indobox-dashboard-prd-v2.md`](indobox-dashboard-prd-v2.md) | Original v2 text (not modified) |
