# Agile Guide — AI-Augmented Human+Agent Teams

> **Doctrine:** *"Hope is not a reliability strategy."*  
> The agent is a Sincere Technical Supervisor, Hostile to Debt. Before declaring any design "good", it must actively look for the structural danger that is not being said. A crack in the wall is not a style issue — it brings down the dam.
>
> **Scope:** This guide governs projects operated by one human engineer + one semi-autonomous AI agent. It is calibrated for monorepo projects with independent modules, continuous-by-maturity release cadence, and constrained agent windows (see `AGILE_CONFIG.md`).
>
> **Methodology basis:** Scrum cadence + DORA measurement + Shape Up appetite technique (pre-sprint only). Full evidence base: `.agent/context/AI_AUGMENTED_AGILE_RESEARCH.md`.

---

## Part I — Configuration-First

**Before using this guide, fill `AGILE_CONFIG.md`.** Every parameter marked `[CONFIGURE]` in this document refers to a value defined there. Running without configuration is running blind.

The configuration interview is in `AGILE_CONFIG.md` §1. It takes 10–15 minutes. It produces the calibrated defaults for your project's sprint size, backlog limits, branch policy, and session protocol.

---

## Part II — Sprint Structure

### 2.1 Sprint Length

**Default:** 1 week (5 working days).  
**Configurable range:** 3 days (hotfix/hardening) to 2 weeks (stable feature work).  
**Rule:** Sprint length is fixed per module maturity tier (see `AGILE_CONFIG.md §3`). Do not extend a sprint — close it, carry over, and open the next one.

### 2.2 Sprint Capacity — Hard Limits

These are the most important numbers in the guide. They prevent the primary failure mode: backlogs that grow toward the 50KB agent context ceiling.

| Parameter | Conservative Default | Configurable Range |
|---|---|---|
| Max USs per sprint | **5** | 3–8 |
| Max story points per sprint | **20** | 10–35 |
| Max lines in `BACKLOG.md` | **150 lines** | 100–200 |
| Max size of `BACKLOG.md` | **30KB** | 20–40KB |
| Max USs in active backlog (not history) | **15** | 10–25 |

**Rotation rule:** When `BACKLOG.md` reaches the configured line or size limit, completed sprints are archived to `BACKLOG_HISTORY.md` before the next sprint opens. This is not optional.

### 2.3 Story Sizing

Do not use numeric story points for estimation. Use relative T-shirt sizing:

| Size | Effort | Points (internal) | Rule |
|---|---|---|---|
| XS | < 1 agent session | 1 | Single file change, no cross-module impact |
| S | 1 agent session | 2 | Contained to one module, clear acceptance criteria |
| M | 2–3 agent sessions | 5 | Cross-module read (no write), requires review |
| L | 4–5 agent sessions | 8 | Cross-module write, branch required |
| XL | > 5 sessions | 13 | Must be decomposed before entering sprint |

**Rule:** XL items are never accepted into a sprint. They must be decomposed into S/M/L first. If decomposition produces > 3 child USs, the feature needs an RFC before any US is written.

### 2.4 Appetite Gate (Shape Up technique, pre-sprint only)

Before any US enters sprint planning, the human answers:

1. **What is the maximum effort I am willing to spend on this?** (XS/S/M/L)
2. **What is the minimum viable outcome that justifies that cost?**
3. **What do we explicitly NOT build in this cycle?**

If the answers are unclear, the US goes back to the backlog as `[NEEDS APPETITE]`. The agent does not refine a US without an appetite defined by the human.

---

## Part III — User Story Rules

### 3.1 US Format

```
ID: [MODULE]-[SEQ]
Title: As a [role], I want [feature], so that [outcome].
Appetite: XS | S | M | L
Acceptance criteria:
  - [ ] criterion 1
  - [ ] criterion 2
Dependencies: [list or NONE]
Branch required: YES | NO
```

### 3.2 Who Writes USs

- **Human writes:** strategic USs, features validated with user, architectural changes
- **Agent writes:** only when explicitly authorized by human in the same session; always requests approval before registering; never registers spontaneously
- **Agent signals but does not write:** when it detects a need mid-execution, it flags as `[US-CANDIDATE: description]` in the session output and waits

### 3.3 US Rejection Criteria

The agent must reject (not refine, not execute) any US that presents:

- No acceptance criteria defined
- Appetite missing or marked XL without decomposition
- Dependency on a module with an open structural defect (see §5 Debt Checkpoint)
- Scope that crosses > 2 modules without an RFC
- Branch required but no branch exists and module is below maturity threshold

Rejection is not a failure. It is the crack-in-the-wall detector working correctly.

---

## Part IV — Monorepo & Branch Policy

### 4.1 Module Maturity Tiers

Each module is classified independently. Classification is recorded in `AGILE_CONFIG.md §3`.

| Tier | Maturity | Release cadence | Branch policy |
|---|---|---|---|
| 0 — Experimental | No tests, no CI | None (local only) | Feature branch always |
| 1 — Developing | Partial tests, no CI gate | On explicit decision | Feature branch always |
| 2 — Stable | Full tests, CI gate | Continuous (on green) | Feature branch for L/XL; direct for XS/S |
| 3 — Operable | DORA targets met | Continuous + automated | Direct for M and below; branch for L/XL |

### 4.2 Feature Branch Decision Rule

A feature becomes a branch (or subrepo) when **any** of the following is true:

- Size is L or XL
- It has standalone app potential (can be deployed independently)
- It touches > 1 module with write operations
- It is being built by the agent in a session where human review is deferred (batch review mode)

**Subrepo rule:** Code lives in subrepo until:
1. Tests pass at Tier 2 or above
2. At least one batch review completed by human
3. No open structural defects in the module

Only then does a PR to monorepo main open.

### 4.3 Merge Conflict Prevention

- One branch per US (never bundle multiple USs in one branch)
- Branch naming: `[module]/[US-ID]-[short-slug]`
- Agent rebases before any PR — never merges main into feature branch
- If rebase produces > 5 conflict files: branch is too old, close it, cherry-pick what is valid, discard the rest

---

## Part V — Debt Checkpoint (The Dam Inspection)

This is the most critical section. It is non-negotiable.

### 5.1 The Rule

**The agent does not advance to the next US without passing the Debt Checkpoint of the current US.**

"Advance" means: opening a new file for editing, creating a new branch, writing new acceptance criteria, or starting a new agent session on a different task.

### 5.2 Checkpoint Criteria

Before marking any US as Done, the agent must explicitly answer all five questions:

1. **Foundation:** Does this change rest on a solid base, or did I build on top of something I know is fragile?
2. **Hidden coupling:** Did I introduce a dependency that is not documented in `ARCHITECTURE.md` or the module's context files?
3. **Test coverage:** Do the tests actually cover the failure modes, or do they only cover the happy path?
4. **Regressão surface:** Which existing behaviors could this change silently break? Were they tested?
5. **Debt introduced:** Did I produce any code that I would be embarrassed to defend in a code review six months from now?

If the answer to question 1, 2, or 4 is "yes, there is a problem" — the US is not Done. It is `[BLOCKED: structural]`. A new US is opened to fix the structural issue before the original US resumes.

### 5.3 Crack Detection Signals

The agent must proactively flag (not wait to be asked) when it detects:

- A function that grew beyond 50 lines during this session
- A module that now has > 3 callers it did not have before
- A test that was disabled or skipped to make CI green
- A `TODO` or `FIXME` left in code that was just written
- A dependency added without entry in `DEPENDENCY_POLICY.md`
- A config value hardcoded instead of parameterized
- An error path that returns a success code

Flagging format: `[CRACK DETECTED: <location> — <description> — severity: low|medium|high]`

High-severity cracks block the sprint. Medium-severity cracks are logged as `[US-DEBT]` and must be scheduled in the next sprint before new features. Low-severity cracks are logged and reviewed in the retrospective.

### 5.4 Sprint-Close Code Artifact Gate

After all USs in a sprint are marked Done and before closing the sprint:

1. **`code-lint`** — run on every module touched in the sprint. Use `/code-lint` slash command or instruct `"code-lint"`. One finding per line: `[LINT] <file>:<line> — <issue> (🔴/🟡/🟢)`.
2. **`doc-lint`** — run on any new or modified public API surface (exported functions, public classes). Use `/doc-lint` or instruct `"doc-lint"`.
3. **`code-falsify` / `doc-falsify` / `map-falsify` / `machine-falsify`** — require explicit human request. Not part of the automatic gate.

The gate result is recorded in the sprint retrospective. A 🔴 finding from `code-lint` or `doc-lint` blocks the sprint from closing — open a `[US-DEBT]` to resolve it before starting the next sprint.

**Approximate gate cost:** ~1.5–2.5k tokens per module (lint only). See `CLAUDE_TOKEN_OPTIMIZATION.md` § "Code Artifact Modes" for full cost reference.

---

## Part VI — Session Protocol

### 6.1 Session Open

1. Load `AGENT_HANDOFF.md` — verify last session state
2. Load `AGILE_CONFIG.md` — verify active sprint and limits
3. Check `BACKLOG.md` size — if at limit, rotate before starting
4. Confirm active US with human before touching any file

### 6.2 Session Close (mandatory, every session)

Regardless of whether tokens are exhausted or work is complete:

1. **Debt Checkpoint** on the last US touched (§5.2)
2. **Batch review signal** — list every file changed this session for human review
3. **Update `BACKLOG.md`** — mark US status (Done / In Progress / Blocked)
4. **Write `AGENT_HANDOFF.md`** — next session entry point
5. **Append token log** — per `CLAUDE_TOKEN_OPTIMIZATION.md` and global CLAUDE.md rule
6. **Flag any `[US-CANDIDATE]` or `[CRACK DETECTED]`** items before closing

This protocol executes even if the session ends abruptly due to token limit. Partial close is better than no close.

### 6.3 Batch Review Protocol

The human reviews at end of session or in the next available window (5-hour or weekly reset). Review checklist:

- [ ] Every changed file is intentional (no accidental edits)
- [ ] No `console.log`, debug prints, or temporary code committed
- [ ] No skipped or disabled tests
- [ ] No hardcoded values that should be config
- [ ] Debt Checkpoint answers visible in session output or PR description
- [ ] At least one test added or modified per US

---

## Part VII — DORA Measurement

Track these four metrics per module, not per project. Record in `AGILE_CONFIG.md §4` at the end of each sprint.

| Metric | What it measures | Healthy signal |
|---|---|---|
| Deployment Frequency | How often module goes to production | Weekly or better for Tier 2+; on-demand for Tier 3 |
| Lead Time for Changes | Commit → production | < 1 day for XS/S; < 3 days for M/L |
| Change Failure Rate | % of deploys causing incident or rollback | < 10% |
| MTTR | Time to restore after failure | < 1 hour for Tier 3; < 4 hours for Tier 2 |

**DORA signal → sprint action mapping:**

| Signal | Action |
|---|---|
| Lead time increasing 2 sprints in a row | Sprint capacity cut by 20%; one sprint dedicated to pipeline/test improvement |
| Change failure rate > 15% | Feature freeze on that module until root cause resolved |
| MTTR > threshold 2 sprints in a row | Runbook review + chaos test scheduled before next feature sprint |
| Deployment frequency dropping | Module maturity tier re-evaluated; possible regression to lower tier |

---

## Part VIII — Sprint Ceremonies (Minimal, AI-Augmented)

### 8.1 Sprint Planning (human-led, agent assists)

**Duration:** 30–60 minutes (synchronous human decision)  
**Sequence:**
1. Human reviews `BACKLOG.md` — selects candidate USs
2. Human applies appetite gate to each candidate (§2.4)
3. Agent sizes candidates and flags rejection criteria (§3.3)
4. Human confirms final sprint scope — agent cannot add to this list
5. Agent writes accepted USs to `BACKLOG.md` in sprint format

**Hard stop:** If planning produces > configured max USs or > configured max points, human must cut — agent flags but human decides what to cut.

### 8.2 Retrospective (end of sprint, human-led)

**Duration:** 20–30 minutes  
**Required inputs:** DORA metrics for the sprint, all `[CRACK DETECTED]` flags from sessions, Debt Checkpoint answers for each closed US  
**Required outputs:**
- One actionable process change for next sprint (not aspirational — specific)
- All open `[US-DEBT]` scheduled or explicitly deferred with reason
- Module maturity tier re-evaluated if DORA signals warrant it

**Agent's retrospective role:** produce a summary of all flags, cracks, and debt items from the sprint. Human interprets and decides. Agent does not propose process changes — it provides data.

### 8.3 No Daily Standup

One human + one agent does not need a standup. The `AGENT_HANDOFF.md` is the async standup record. If a second human joins the project, standup is reinstated.

---

## Part IX — Anti-Patterns (Prohibited)

These are banned behaviors. The agent must refuse to execute them and flag if asked:

| Anti-pattern | Why it is banned |
|---|---|
| Skipping Debt Checkpoint to meet a deadline | Deadline pressure is the #1 cause of structural outages. Hope is not a strategy. |
| Marking US Done without all acceptance criteria met | Partial done is not done. It is hidden debt. |
| Adding a US to an active sprint without human approval | Sprint scope is frozen after planning. |
| Extending a sprint instead of closing and carrying over | Sprint extension hides velocity problems. |
| Writing a test that only covers the happy path | A test that cannot fail is not a test. |
| Accepting a PR with a disabled test | One disabled test is permission to disable the next. |
| Proceeding past a high-severity crack | The dam does not care about your deadline. |
| Generating documentation before the code it documents is stable | Premature docs create false confidence and maintenance debt. |

---

## See Also

- `AGILE_CONFIG.md` — project-specific calibration (fill before using this guide)
- `AI_AUGMENTED_AGILE_RESEARCH.md` — empirical evidence base for all decisions in this guide
- `DEFINITION_OF_DONE.md` — US-level completion criteria
- `AGENT_HANDOFF.md` — session open/close protocol
- `BACKLOG.md` — active sprint and backlog
- `DEPENDENCY_POLICY.md` — dependency addition rules referenced in §5.3
