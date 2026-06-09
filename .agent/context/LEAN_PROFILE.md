# Lean Profile — Small-Team Governance Reductions

> **Applies to:** teams ≤ 3 engineers (including the human operating the AI agent).  
> **Scope:** AGILE_GUIDE.md §I–§VIII lean variants, BACKLOG.md limits, and stop-signal thresholds.  
> **Note:** All reductions are opt-in. Full-profile defaults remain valid and may be restored at any time by updating `AGILE_CONFIG.md §0`.

---

## §0 — Lean Mode Activation

Lean mode is activated in `AGILE_CONFIG.md §0` by the adoption wizard (`python infra/scripts/wizard.py`) when `teamSize ≤ 2`, or manually by setting:

```
lean_mode: true
team_size: <N>   # integer, ≤ 3
```

When `lean_mode: true`, the reduced limits in this file take precedence over AGILE_GUIDE.md defaults.

---

## §I — Configuration-First (unchanged)

`AGILE_CONFIG.md` must still be filled before the first sprint. No reduction applies to this prerequisite. The wizard interview is shorter in lean mode (DORA section pre-filled with deferred defaults).

---

## §II — Sprint Structure (lean variants)

### II.1 Sprint Length

Lean default: **1 week** (unchanged). Allowed range: 3 days–2 weeks (same as standard).

### II.2 Sprint Capacity — Lean Limits

| Parameter | Standard Default | Lean Default (≤ 3 people) |
|---|---|---|
| Max USs per sprint | 5 | **3** |
| Max story points per sprint | 20 | **8** |
| Max lines in `BACKLOG.md` | 150 | **100** |
| Max size of `BACKLOG.md` | 30 KB | **20 KB** |
| Max USs in active backlog | 15 | **10** |

Rotation rule unchanged: archive completed sprints to `BACKLOG_HISTORY.md` when limits are reached.

### II.3 Story Sizing

No change to T-shirt sizing table. XL items are still prohibited in sprint.

### II.4 Appetite Gate

Unchanged. All three appetite questions are still required per US.

---

## §III — User Story Rules (lean variants)

### III.1 US Format

Unchanged. All fields (ID, Title, Appetite, Acceptance criteria, Dependencies, Branch required) remain mandatory.

### III.2 Who Writes USs

Unchanged. Human writes strategic USs; agent writes only when explicitly authorized.

### III.3 US Rejection Criteria

Unchanged. All five rejection criteria remain enforced.

---

## §IV — Monorepo & Branch Policy (lean variants)

### IV.1 Module Maturity Tiers

No change to tier definitions.

### IV.2 Feature Branch Decision Rule

Lean simplification: for solo or 2-person teams, **batch review mode is replaced by per-PR review**. Each PR is reviewed immediately on completion rather than batched at end of session.

> Standard: review batched weekly or at session end.  
> Lean: review per PR, no batch accumulation.

### IV.3 Merge Conflict Prevention

Unchanged. One branch per US; agent rebases before any PR.

---

## §V — Debt Checkpoint (lean variants)

### V.1–V.3

Unchanged. The Debt Checkpoint is non-negotiable regardless of team size. All five questions must be answered before marking any US Done.

### V.4 Sprint-Close Code Artifact Gate

Lean simplification: **`code-lint` frequency reduced from every sprint to every 2 sprints** for teams ≤ 2.  
`doc-lint` follows the same cadence.  
`code-falsify` / `doc-falsify`: require explicit human request (unchanged).

> Standard: `code-lint` + `doc-lint` every sprint.  
> Lean: `code-lint` + `doc-lint` every 2 sprints. Exception: always run on any sprint that touches a Tier 2+ module.

---

## §VI — Session Protocol (lean variants)

### VI.1 Session Open

Unchanged. Load `AGENT_HANDOFF.md` and `AGILE_CONFIG.md`; check `BACKLOG.md` size.

### VI.2 Session Close

Unchanged. All six steps are mandatory.

### VI.3 Batch Review Protocol

Lean replacement: **per-PR review** instead of batch.  
Checklist items are identical; timing changes from "end of session or weekly" to "before next PR is opened."

---

## §VII — DORA Measurement (lean variants)

| Standard | Lean (≤ 3 people) |
|---|---|
| Track all 4 DORA metrics from Sprint 1 | **DORA tracking deferred until Tier 2** |
| Record in `AGILE_CONFIG.md §4` every sprint | Record in `AGILE_CONFIG.md §4` when first module reaches Tier 2 |

**Deferred DORA defaults applied in `AGILE_CONFIG.md §0` by wizard:**
- Deployment Frequency: N/A (Tier 0–1)
- Lead Time: N/A (Tier 0–1)
- Change Failure Rate: N/A (Tier 0–1)
- MTTR: N/A (Tier 0–1)

DORA tracking becomes mandatory when any module is promoted to Tier 2.

---

## §VIII — Sprint Ceremonies (lean variants)

| Ceremony | Standard | Lean (≤ 3 people) |
|---|---|---|
| Sprint Planning | 30–60 min, human-led | **15–30 min** — same sequence, compressed |
| Retrospective | 20–30 min, required every sprint | **Optional for solo; required every 2 sprints for 2–3 person teams** |
| Daily Standup | Not required (unchanged) | Not required (unchanged) |

**Lean retrospective minimum (when held):** one sentence on what to change + open debt items scheduled or deferred with reason. No formal structure required for teams ≤ 2.

---

## Stop Signals — Lean Overrides

| Signal | Standard Threshold | Lean Threshold |
|---|---|---|
| BACKLOG.md rotation | 150 lines / 30 KB | 100 lines / 20 KB |
| Sprint capacity hard stop | 5 USs / 20 pts | 3 USs / 8 pts |
| Debt checkpoint frequency | Every US (unchanged) | Every US (unchanged — not negotiable) |
| DORA alert | Every sprint | Deferred until Tier 2 |
| Retrospective cadence | Every sprint | Every 2 sprints (2–3 people); optional solo |
| Code-lint gate | Every sprint | Every 2 sprints (except Tier 2+ modules) |
| Batch review | Weekly / session end | Per PR |

---

## Restoring Full-Profile Defaults

Set `lean_mode: false` in `AGILE_CONFIG.md §0` and rerun the wizard, or manually restore the standard limits from AGILE_GUIDE.md. Recommended when team grows beyond 3 engineers or when first module reaches Tier 2.

---

## Placeholders

This file uses no `[PROJECT_NAME]`, `[STACK]`, or `[LANGUAGE]` placeholders — lean governance rules are stack-agnostic. Replace numerical defaults (8 pts, 3 USs, etc.) in `AGILE_CONFIG.md §0` if your team context requires different calibration.
