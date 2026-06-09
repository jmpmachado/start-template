# Agile Configuration — [PROJECT_NAME]

> **Calibrated configuration for the [PROJECT_NAME] development cycle.**  
> This file contains the calibration parameters for the `AGILE_GUIDE.md`.

---

## §1 — Configuration Interview

Answer these questions to calibrate your defaults. The answers drive §2–§4.

### 1.1 Agent Window

> How many hours per week does the agent work on this project?

| Agent | Hours/week | Notes |
|---|---|---|
| `[CONFIGURE: agent]` | `[CONFIGURE: Nh]` | `[CONFIGURE: role]` |

**Default session length used for sizing:** `[CONFIGURE: e.g. 4 hours]`  

### 1.2 Review Cadence

> When does the human do batch review?

- [x] End of every agent session (same day)
- [ ] Next available window (next day or next 5h block)
- [ ] Weekly reset window
- [ ] Other: —

**Maximum unreviewed sessions before mandatory stop:** 2 sessions

### 1.3 Module Count

> How many independent modules does this monorepo have?

**Active modules:** `[CONFIGURE: count + names, e.g. 2 (frontend, backend)]`  
**Modules under active development this sprint:** `[CONFIGURE: count]`

**Rule from `AGILE_GUIDE.md`:** A sprint touches at most 1 module simultaneously.  

### 1.4 Release Cadence Philosophy

> Which best describes your release philosophy?

- [x] Continuous by module maturity (Debian model — default)
- [ ] Fixed release train (weekly/biweekly)
- [ ] On-demand (manual trigger only)
- [ ] Other: —

### 1.5 Structural Debt Tolerance

> How do you handle a mid-sprint crack detection?

- [x] Hard stop — fix before continuing (recommended for Tier 2+ modules)
- [ ] Log and schedule in next sprint (acceptable for Tier 0–1 modules)
- [ ] Human decides per case

**Default for this project:** Hard stop — fix before continuing

---

## §2 — Sprint Capacity (Calibrated)

Fill after completing §1. Adjust from defaults based on your agent window and module count.

| Parameter | Conservative Default | Your Value | Justification |
|---|---|---|---|
| Sprint length | 1 week | 1 week | Standard sprint length |
| Max USs per sprint | 5 | 5 | Conservative default for beginners |
| Max story points per sprint | 20 | 20 | Consistent with 5 story points limit |
| Max lines in `BACKLOG.md` | 150 | 150 | Default adequate |
| Max size of `BACKLOG.md` | 30KB | 30KB | Default adequate |
| Max USs in active backlog | 15 | 10 | WIP limits to prevent build-up |
| Max modules touched per sprint | 1 | 1 | Single-module focus |
| Max unreviewed sessions | 2 | 2 | Default adequate |

### Capacity formula (reference only)

```
Max USs = floor(agent_hours_per_week / avg_hours_per_US)
Max points = Max USs × avg_points_per_US

Conservative starting assumption:
  avg_hours_per_US = 4h (one session)
  avg_points_per_US = 3 (mix of XS/S/M)
```

**Your calculation:**
```
Agent hours/week:     40h
Avg hours/US:         ~4h (one session)
Raw max USs:          10 per sprint
Buffered max USs:     5 (conservative beginner calibration)
Max points:           20
```

---

## §3 — Module Registry

One row per module. Update maturity tier at each sprint retrospective.

| Module | Path | Maturity Tier | Release cadence | Branch policy | Notes |
|---|---|---|---|---|---|
| frontend | `src/frontend/` | 1 | Continuous | main | HTML5 + CSS + JS scaffold |
| backend  | `src/backend/`  | 1 | Continuous | main | .NET 8/9 Minimal API scaffold |

**Maturity tier definitions:** See `AGILE_GUIDE.md §4.1`

| Tier | Description |
|---|---|
| 0 — Experimental | No tests, no CI; feature branch always |
| 1 — Developing | Partial tests, no CI gate; feature branch always |
| 2 — Stable | Full tests + CI gate; branch for L/XL only |
| 3 — Operable | DORA targets met; direct commit for M and below |

---

## §4 — DORA Targets (Per Module)

Fill with your targets. Measure actuals at each sprint retrospective.

| Module | Deploy Frequency target | Lead Time target | Change Failure Rate target | MTTR target |
|---|---|---|---|---|
| frontend | Continuous | < 1 day | < 10% | < 1 hour |
| backend  | Continuous | < 1 day | < 10% | < 1 hour |

**Sprint retrospective — actuals log:**

| Sprint | Module | Deploy Freq | Lead Time | CFR | MTTR | Action taken |
|---|---|---|---|---|---|---|
| | | | | | | |

---

## §5 — Active Sprint

> Updated at the start of each sprint by the agent after human confirms scope.

**Sprint ID:** `[TBD]`  
**Sprint dates:** `[TBD]` → `[TBD]`  
**Module(s) in scope:** `[TBD]`  
**Sprint goal:** `[TBD]`

### Active USs

| ID | Title | Size | Points | Status | Branch |
|---|---|---|---|---|---|
| | | | | | |

### Sprint Capacity Check

| Metric | Limit | Current | Status |
|---|---|---|---|
| USs | 5 | 0 | ✅ |
| Points | 20 | 0 | ✅ |
| Modules | 2 | 0 | ✅ |

---

## §6 — Crack & Debt Log

> Agent appends here when `[CRACK DETECTED]` or `[US-DEBT]` is flagged. Human reviews at retrospective.

| Date | Session | Location | Description | Severity | Status |
|---|---|---|---|---|---|
| | | | | | |

---

## §7 — Configuration History

> Record changes to §2 values and the sprint/reason that justified the change.

| Date | Parameter changed | Old value | New value | Reason |
|---|---|---|---|---|
| | | | | |
