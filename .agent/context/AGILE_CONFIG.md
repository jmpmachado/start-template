# Agile Configuration — start-project

> **Calibrated configuration for the start-project development cycle.**  
> This file contains the calibration parameters for the `AGILE_GUIDE.md`.

---

## §1 — Configuration Interview

Answer these questions to calibrate your defaults. The answers drive §2–§4.

### 1.1 Agent Window

> How many hours per week does the agent work on this project?

| Agent | Hours/week | Notes |
|---|---|---|
| Gemini | 40h | Primary assistant |
| Claude Code | 20h | Backup assistant |

**Default session length used for sizing:** 4 hours  

### 1.2 Review Cadence

> When does the human do batch review?

- [x] End of every agent session (same day)
- [ ] Next available window (next day or next 5h block)
- [ ] Weekly reset window
- [ ] Other: —

**Maximum unreviewed sessions before mandatory stop:** 2 sessions

### 1.3 Module Count

> How many independent modules does this monorepo have?

**Active modules:** 1  
**Modules under active development this sprint:** 1

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
| start-project | `.` | 2 | Continuous | main | Core project module |

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
| start-project | Continuous | < 1 day | < 10% | < 1 hour |

**Sprint retrospective — actuals log:**

| Sprint | Module | Deploy Freq | Lead Time | CFR | MTTR | Action taken |
|---|---|---|---|---|---|---|
| Sprint 01 | start-project | Continuous | < 1 day | 0% | < 1 hour | Initial setup retrospect |

---

## §5 — Active Sprint

> Updated at the start of each sprint by the agent after human confirms scope.

**Sprint ID:** `QX-01`  
**Sprint dates:** `2026-06-06` → `2026-06-13`  
**Module(s) in scope:** `.` (Core template setup)  
**Sprint goal:** Adopt start-template for a new project and verify test suite.

### Active USs

| ID | Title | Size | Points | Status | Branch |
|---|---|---|---|---|---|
| QX01-01 | Set up initial template configuration | S | 2 | ✅ Done | main |
| QX01-02 | Verify and execute tests successfully | S | 2 | ✅ Done | main |

### Sprint Capacity Check

| Metric | Limit | Current | Status |
|---|---|---|---|
| USs | 5 | 2 | ✅ |
| Points | 20 | 4 | ✅ |
| Modules | 1 | 1 | ✅ |

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
| 2026-06-06 | Initial configuration | Defaults | Calibrated | Adopt template for a fresh start-project |
