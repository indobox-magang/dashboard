# PRD — Indobox Microcinema Business Performance Dashboard

| Field | Value |
|---|---|
| Status | Draft v2.0 (for review) |
| Product | Indobox Business Performance & Decision Dashboard |
| Document owner | *[CONFIRM]* |
| Engineering owner | *[CONFIRM]* |
| Business sponsor | *[CONFIRM]* |
| Last updated | 29 July 2026 |

> **Items marked *[CONFIRM]* or *[ASSUMPTION]* must be resolved before this document is approved for build.** They are called out rather than guessed because each one materially changes scope, cost, or feasibility.

---

## 1. Problem Statement

Indobox operates microcinema screens alongside F&B and vending machine sales. Performance data exists across at least three systems (ticketing, F&B point of sale, vending telemetry) but is reconciled manually, after the fact, in spreadsheets. As a result:

- Underperforming showtimes stay on the schedule for weeks because nobody notices until the monthly close.
- High-demand slots are not expanded quickly enough to capture spillover demand.
- F&B stockouts and vending downtime are discovered by customers before they are discovered by management.
- Decisions about programming, staffing, and promotions are made on intuition and partial data.

The cost is not "we lack reports." The cost is **elapsed time between a problem occurring and someone acting on it**. This product exists to compress that interval.

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

---

## 5. Data Foundation

This section governs feasibility. **No requirement below §5 is buildable if its source row is not "Available."**

### 5.1 Source system inventory

| Data domain | Source system | Availability | Latency | Owner |
|---|---|---|---|---|
| Ticket transactions (film, showtime, studio, seats, price, discount) | Ticketing/POS — *[CONFIRM system name]* | *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* |
| Studio and seat inventory (capacity per studio, seats on sale) | Ticketing master data | *[CONFIRM]* | Static | *[CONFIRM]* |
| Showtime schedule (planned vs. actual, cancellations) | Ticketing | *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* |
| F&B counter transactions (SKU, qty, price, timestamp) | F&B POS — *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* |
| **Link between F&B transaction and ticket transaction** | — | **[CRITICAL — see §5.2]** | — | — |
| Vending machine sales | Vending telemetry / MDB | *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* |
| Vending machine uptime, error codes, planogram stock level | Vending telemetry | *[CONFIRM — may require hardware integration]* | *[CONFIRM]* | *[CONFIRM]* |
| F&B inventory on hand | Inventory system / manual stock count | *[CONFIRM]* | *[CONFIRM]* | *[CONFIRM]* |
| Customer demographics (age, gender, location) | Member app / loyalty / booking form | *[CONFIRM — see §5.3]* | *[CONFIRM]* | *[CONFIRM]* |
| Film metadata (genre, distributor, rating, release date) | Manual or distributor feed | *[CONFIRM]* | Weekly | *[CONFIRM]* |
| Maintenance log | Currently manual *[ASSUMPTION]* | Likely not digitised | — | — |

### 5.2 Critical dependency: ticket ↔ F&B linkage

Two metrics central to the original brief — **attach rate** and **F&B spend per admission** — require knowing whether an F&B purchase belongs to a specific ticket buyer.

- **If linked** (shared transaction ID, member ID, or same-session basket): both metrics are exact, and per-film/per-showtime F&B analysis in §7.2 is possible.
- **If not linked**: both metrics degrade to **branch-day aggregates** (total F&B revenue ÷ total admissions that day). Per-showtime and per-film F&B attribution becomes unavailable, and the Conversion Gap alert (§8) must operate at branch-day granularity only.

**This is the single highest-impact open question in the document.** Resolve before scoping §7.2.

### 5.3 Demographic data

If demographics come from a booking form or loyalty app, coverage will be partial (walk-in and cash buyers excluded). Requirements:

- Any demographic visualisation must display **coverage %** ("based on 34% of admissions") so users do not over-read a biased sample.
- Suppress any demographic breakdown where the cell count is below *n* = 30 *[ASSUMPTION — tune]*.
- Confirm consent basis for processing personal data under Indonesian PDP Law (UU No. 27/2022) before storing any identifiable attribute. Store aggregates, not raw PII, in the analytics layer.

### 5.4 Scale parameters — required inputs

The following determine whether several features are statistically meaningful at all:

- Number of branches: *[CONFIRM]*
- Studios per branch: *[CONFIRM]*
- Seats per studio: *[CONFIRM]*
- Showtimes per studio per day: *[CONFIRM]*
- Months of clean historical data available: *[CONFIRM]*

**Why it matters:** with fewer than roughly 6–8 branches, "benchmark against peer branches" (§7.3) has no meaningful peer group and should be replaced with *comparison against the branch's own trailing 8-week average*. With studios under ~40 seats, occupancy percentages are extremely noisy at the individual-show level and all thresholds must be sample-size gated (§8.2).

---

## 6. Metric Dictionary

Non-negotiable. Every number on every screen resolves to a definition here. Disputes about "your number doesn't match mine" are resolved by this table, not by discussion.

| Metric | Definition | Notes / decisions required |
|---|---|---|
| **Admissions** | Count of tickets scanned/validated at entry. Falls back to tickets sold if scan data unavailable. | *[CONFIRM which]*. Complimentary tickets counted separately, excluded from revenue metrics. |
| **Gross ticket revenue** | Sum of ticket face value before discount. | |
| **Net ticket revenue** | Gross − discounts − VAT/PB1 − booking fees. | **Default display metric is net.** *[CONFIRM PB1 rate by region]* |
| **ATP (Average Ticket Price)** | Net ticket revenue ÷ paid admissions. | Complimentary admissions excluded from denominator. |
| **Seats available** | Seats released for sale for a given showtime. | Distinct from physical capacity; excludes blocked/broken seats. |
| **Occupancy** | Admissions ÷ seats available, per showtime. | Cancelled showtimes excluded entirely, not counted as 0%. |
| **RevPASH** | Net total revenue (ticket + F&B) ÷ (seats available × showtime hours). | Primary efficiency metric. Allows comparison across differently-sized studios. |
| **Revenue per available seat (RPAS)** | Net total revenue ÷ seats available. | Simpler variant for tables where duration is constant. |
| **F&B net revenue** | Counter + vending, net of tax. | Vending and counter must also be viewable separately. |
| **F&B attach rate** | Transactions containing ≥1 F&B item ÷ total ticket transactions. | **Transaction-level, not per-person** — a group of four sharing one popcorn is one attached transaction. Requires §5.2 linkage. |
| **F&B spend per admission** | F&B net revenue ÷ admissions, same branch-day. | Works without §5.2 linkage. Use this as fallback primary metric. |
| **Machine uptime** | Minutes machine reported operational ÷ minutes in trading hours. | Requires telemetry. Trading hours per branch required as master data. |
| **Stockout event** | A SKU reaching zero units in a machine or counter during trading hours. | Duration of stockout matters more than count — track both. |
| **Slow-moving item** | SKU in the bottom quartile of units sold per stocked-day over trailing 28 days. | Excludes SKUs stocked < 14 days. |
| **Business day** | *[CONFIRM]* — trading day likely runs past midnight; a 23:30 showtime must be attributed to the correct day. | Recommend defining the day boundary at 04:00 local. |
| **Week** | Monday–Sunday *[CONFIRM]*. Cinema weeks are often Thursday-anchored to film release cycles. | |

---

## 7. Scope by Module

Requirement IDs are stable references for the backlog. Priority: **P0** = v1 must-have, **P1** = v1 if capacity allows, **P2** = deferred.

### 7.1 Executive Command Center — *P0*

**Decision served:** Where do I direct attention today/this week?

| ID | Requirement | Priority |
|---|---|---|
| EC-01 | KPI cards: Net revenue, Admissions, Occupancy, ATP, F&B spend per admission, RevPASH. Each shows current period value, absolute and % change vs. comparison period, and a sparkline of the trailing 14 periods. | P0 |
| EC-02 | Period selector: Today, Yesterday, Last 7 days, Last 28 days, Custom. Comparison selector: previous period, same period last year *(only if ≥13 months of history exists)*. | P0 |
| EC-03 | Revenue mix: ticket vs. F&B (counter vs. vending split), as share and absolute, trended. | P0 |
| EC-04 | **Action Needed panel**: the top 5 open alerts ranked by the priority score defined in §8.3. Each row shows: what happened, the affected entity, magnitude of impact in rupiah where computable, and the recommended action. Clicking a row opens the relevant drill-down pre-filtered. | P0 |
| EC-05 | Branch filter applying across all modules, persisted per user session. | P0 |
| EC-06 | Mobile layout: KPI cards and Action Needed panel are fully usable on a phone. Charts may degrade to a simplified form. | P0 |
| EC-07 | Every KPI card exposes "as of" timestamp and data-source freshness state (fresh / delayed / stale). | P0 |

**Acceptance criteria:** A GM opening the dashboard cold on a phone can name the single most urgent business issue and its recommended action within 60 seconds, verified with 3 users in usability testing.

### 7.2 Film, Genre & Showtime Optimizer — *P1 (v1.1)*

**Decision served:** What do I add, move, or drop from the schedule?

Deferred from v1 because it is the module most dependent on unresolved data questions (§5.2, §5.3) and least urgent operationally — programming decisions are weekly, not intraday.

| ID | Requirement | Priority |
|---|---|---|
| SO-01 | Occupancy heatmap: day-of-week × time-slot, per branch, colour-encoded by occupancy. Cell click cross-filters the entire page. | P1 |
| SO-02 | Heatmap cells with fewer than *n* showtimes in the selected window are visually marked as low-confidence, not coloured as if reliable. *[ASSUMPTION: n = 3]* | P1 |
| SO-03 | Profitability scatter: occupancy (x) vs. RevPASH (y), bubble size = seats available, one point per film-showtime-slot combination. Quadrant labels with plain-language interpretation. | P1 |
| SO-04 | Film ranking table: admissions, occupancy, ATP, RevPASH, F&B spend per admission, weeks-on-screen, week-over-week decay rate. Sortable, exportable. | P1 |
| SO-05 | Decay curve view: admissions by week-on-screen per film, to support drop decisions. | P1 |
| SO-06 | Genre performance by daypart and branch. Requires reliable genre metadata (§5.1). | P2 |
| SO-07 | Demographic breakdown of the current filter selection, with coverage % and small-cell suppression per §5.3. | P2 |

### 7.3 Cinema & Vending Operations Performance — *P0 (partial)*

**Decision served:** Which branch or machine needs intervention today?

| ID | Requirement | Priority |
|---|---|---|
| OP-01 | Branch leaderboard: revenue, admissions, occupancy, RevPASH, F&B attach (or spend per admission). Sortable, with rank change vs. previous period. | P0 |
| OP-02 | Comparison baseline. **If branch count ≥ 8:** peer-group benchmark. **If branch count < 8:** the branch's own trailing 8-week average, same day-of-week. Decided by §5.4. | P0 |
| OP-03 | Vending/F&B equipment tracker: per-machine uptime %, current error state, open stockouts with duration, last restock timestamp. | P0 *(P2 if telemetry unavailable — see §12 R2)* |
| OP-04 | Stockout impact estimate: for each stockout, estimated lost revenue = (median units/hour for that SKU at that machine) × (stockout duration) × unit price. Displayed as an estimate, clearly labelled. | P1 |
| OP-05 | Product velocity table: fast vs. slow movers per §6 definition, with days-of-cover where inventory data exists. | P1 |
| OP-06 | Maintenance log: manual entry of machine service events, linked to machine ID. | P2 |

### 7.4 Action Tracker — *P2 (deliberately minimal)*

**Decision served:** Did we actually do the thing?

The original draft specified ICE scoring, ownership, deadlines, status workflow, and before/after measurement. That is a task-management product, and task-management products that live inside a dashboard are abandoned within weeks unless someone owns the ritual of updating them.

**Recommendation:** In v1, do not build a tracker. Instead:

| ID | Requirement | Priority |
|---|---|---|
| AT-01 | Alert "Acknowledge" action — one tap, records who and when. This alone gives the time-to-detection metric (G2) with near-zero build cost and near-zero user friction. | P0 |
| AT-02 | Alert dismiss with reason code (fixed / false alarm / not actionable / already known). Dismissal reasons are the primary input for threshold calibration in §8.2. | P0 |
| AT-03 | Share alert to WhatsApp/email as a pre-formatted message including the recommendation. Routes execution to tools the team already uses. | P0 |
| AT-04 | Full tracker: ICE scoring, owner assignment, due dates, status workflow, before/after metric capture. Build only after AT-01/02 data shows alerts are being acted on and the team asks for it. | P2 |

**Rationale for deferral:** the original success criterion ("every alert logged in the Action Tracker") made the product's success dependent on its least-adopted feature. AT-01 through AT-03 deliver the same measurement outcome without that dependency.

---

## 8. Alert Engine

The core of the product. Specified in more depth than the visual modules because it is what makes this a decision tool.

### 8.1 Alert catalogue

| Alert | Trigger condition | Recommended action shown to user | Owner role | Default priority |
|---|---|---|---|---|
| **Demand Overflow** | Occupancy ≥ 80% for the same film × day-of-week × time-slot, on ≥3 occurrences in the trailing 14 days | Add a showtime in this slot, or move to a larger studio. Est. incremental revenue: *X*. | Programming | High |
| **Under-utilised Show** | Occupancy ≤ 25% for the same film × day-of-week × time-slot, on ≥3 occurrences in the trailing 14 days, **and** the showtime is ≥ its 3rd week on screen | Drop the screening, or replace with a higher-performing title in this slot. Est. cost of continuing: *Y*. | Programming | High |
| **Stockout — active** | Any SKU at zero in a machine/counter during trading hours for > 30 minutes | Restock now. Est. lost revenue accruing: *Z*/hour. | F&B | High |
| **Machine down** | Vending machine reports non-operational for > 30 minutes during trading hours | Dispatch technician. Machine ID, error code, last known state. | Operations | High |
| **Conversion Gap** | Branch F&B attach rate (or spend per admission) below the comparison baseline by > 20%, sustained over 7 days | Investigate upsell at counter, promo screen state, queue length at peak. | F&B | Medium |
| **Revenue anomaly** | Branch daily net revenue outside ±2 standard deviations of its trailing 8-week same-day-of-week distribution | Investigate. Auto-attached context: admissions, ATP, showtime count vs. baseline, to indicate whether the driver is volume or price. | GM | Medium |

All thresholds and windows in this table are **configuration values, not code constants**, editable by an admin without a release.

### 8.2 Calibration protocol

Thresholds above are starting hypotheses borrowed from multiplex convention and are **not validated for microcinema economics**. Required process:

1. Run the engine in **silent mode** for the first 4 weeks post-launch — alerts are computed and logged but not surfaced.
2. Review the volume and composition of what would have fired. Target: **no more than 5–8 alerts per user per week**. Above that, users stop reading them.
3. Tune thresholds and minimum-occurrence gates to hit that target before turning notifications on.
4. Thereafter, review dismissal reason codes (AT-02) monthly. Any alert type with > 40% "false alarm" dismissals is retuned or retired.

**Sample-size gating is mandatory.** In a 30-seat studio, a single no-show group swings occupancy by 10+ points. No alert fires on a single observation.

### 8.3 Priority score

Alerts in the Action Needed panel rank by:

```
priority = estimated_rupiah_impact × recency_weight × (1 / times_previously_dismissed)
```

Where impact cannot be computed in rupiah, the alert is assigned to a fixed tier below all quantified alerts. The dismissal divisor prevents a chronically-ignored alert from permanently occupying the top slot.

### 8.4 Delivery

- In-dashboard Action Needed panel (P0).
- Push/WhatsApp notification for High-priority alerts only, respecting quiet hours *[CONFIRM: default 22:00–07:00]* (P1).
- Daily digest email, 07:00 local, per role (P1).

---

## 9. Release Plan

| Phase | Contents | Exit criteria |
|---|---|---|
| **Phase 0 — Data foundation** | Source integrations, warehouse/semantic layer, metric dictionary implemented and reconciled against a manual month-close to within ±1% | Reconciliation signed off by finance |
| **Phase 1 — MVP** | §7.1 Command Center, §7.3 OP-01/02/03, §8 engine in silent mode, AT-01/02/03 | Three users from three roles complete their weekly routine using only the dashboard |
| **Phase 2 — Alerts live** | Calibration complete, notifications on, digest email | Alert volume within target; ≥60% acknowledgement rate |
| **Phase 3 — Optimizer** | §7.2 in full | Programming team runs one full scheduling cycle from it |
| **Phase 4 — Evaluate** | Assess whether AT-04, demographics, and maintenance log are still wanted | Explicit go/no-go |

---

## 10. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Data freshness | Ticketing and F&B: refreshed at least hourly. Vending telemetry and machine state: ≤15 min. Every screen displays its freshness state; stale data must be visibly flagged, never silently shown. |
| Performance | Any dashboard view loads in < 3s on a 4G connection. Cross-filter interactions respond in < 1s. |
| Availability | 99% during trading hours. Degraded mode (cached last-good data with a clear stale banner) is preferable to an error page. |
| Historical depth | Minimum 13 months retained to support year-over-year comparison, once available. |
| Concurrency | *[CONFIRM expected user count]* — assume < 50. |
| Browser/device | Latest 2 versions of Chrome and Safari; iOS and Android mobile web. Native app is out of scope. |
| Localisation | UI in Bahasa Indonesia. Currency IDR, no decimals. Dates DD/MM/YYYY. Timezone WIB *[CONFIRM if branches span time zones]*. |
| Export | CSV export on every table. PDF/image export of the Command Center for reporting. |
| Audit | All alert acknowledgements and dismissals logged with user and timestamp. |

## 11. Access Control

| Role | Scope |
|---|---|
| CEO / GM | All branches, all modules |
| Regional manager *[CONFIRM if this role exists]* | Assigned branches, all modules |
| Operations Manager | Assigned branches; operations and F&B modules; no ATP/margin detail *[CONFIRM]* |
| Programming | All branches, ticketing and film modules; no F&B cost data |
| F&B Manager | Assigned branches, F&B modules only |
| Admin | Configuration of alert thresholds, user management |

**Open question:** should a branch manager see other branches' performance? Transparency drives competition; it also drives gaming and morale problems. Recommend: rank visible, absolute figures of other branches hidden.

---

## 12. Assumptions, Dependencies, Risks

| # | Item | Type | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Ticket ↔ F&B transactions are not linkable | Risk (high likelihood) | Attach rate and per-film F&B analysis unavailable | Fall back to F&B spend per admission at branch-day level; scope §7.2 accordingly |
| R2 | Vending machines lack telemetry APIs | Risk | OP-03 and Stockout/Machine-down alerts become manual-entry or unbuildable | Assess hardware capability in Phase 0; if absent, replace with a manual stock-check log and reprioritise to P2 |
| R3 | Branch count too low for peer benchmarking | Assumption | Benchmark features meaningless | Use self-comparison baseline (OP-02) |
| R4 | Insufficient clean history for baselines | Risk | Anomaly and Conversion Gap alerts cannot compute a baseline | Suppress baseline-dependent alerts until 8 weeks of data accumulate |
| R5 | Master data (seat counts, trading hours, planograms) is inaccurate or unmaintained | Risk (commonly underestimated) | Occupancy and uptime silently wrong | Assign a named owner for master data maintenance before Phase 1 |
| R6 | Alert fatigue leads to abandonment | Risk | Product fails despite working correctly | Silent-mode calibration (§8.2) is a mandatory gate, not optional |
| R7 | Demographic data collection lacks a lawful basis under UU PDP 27/2022 | Risk | Legal exposure | Legal review before any personal-attribute processing; aggregate-only storage |
| R8 | No one owns acting on alerts | Risk | Insights produced, nothing changes | Assign a named owner per alert type before Phase 2 (already in §8.1) |

---

## 13. Success Metrics

### Adoption
- ≥80% of target users active weekly by week 6 post-launch.
- ≥3 sessions/week for daily-cadence roles.

### Product effectiveness
- **Alert acknowledgement rate ≥ 60%** within 24 hours of firing.
- **False-alarm dismissal rate < 25%** per alert type after calibration.
- Median time from event occurrence to acknowledgement: **< 12 hours** (target G2 baseline to be measured in Phase 1).

### Business outcome
- RevPASH improvement vs. pre-launch baseline, measured at 3 and 6 months.
- Occupancy change on slots where a Demand Overflow alert was acted on vs. those where it was not — the cleanest available causal read.
- F&B spend per admission vs. baseline.
- Hours/week spent on manual spreadsheet reporting: target reduction ≥ 70%.

### Usability
- Task-based test: 3 users per role, cold, must identify the top issue and its recommended action in < 5 minutes. Re-run at each phase gate.

---

## 14. Open Questions — Required Before Approval

1. Can F&B transactions be linked to ticket transactions? (§5.2 — blocks §7.2 scope)
2. How many branches, studios, and seats per studio? (§5.4 — determines OP-02 design)
3. Do vending machines expose telemetry? (§12 R2 — determines whether OP-03 exists in v1)
4. How many months of clean historical data exist? (§12 R4 — determines when baseline alerts can fire)
5. What is the source and coverage of demographic data, and what is its consent basis? (§5.3)
6. Who owns each alert type operationally? (§8.1)
7. Build vs. buy: is there an existing BI platform in use (Metabase, Power BI, Looker Studio) that Phase 1 could sit on rather than building custom? This materially changes cost and timeline and should be decided before Phase 0.
