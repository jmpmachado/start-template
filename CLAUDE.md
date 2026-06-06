# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Session Start Protocol

**Load context in this order — do not load AGENTS.md unless registering a new file:**

| When | Load |
|------|------|
| Every session (always) | `.agent/context/lean/INDEX.md` — minimal context set (token-efficient entry point) |
| Before any edit to `.agent/context/` | `AGENTS.md` — full index + CI guard |
| Before planning or executing a sprint | `.agent/context/BACKLOG.md` — open items only |
| Before any multi-agent sprint | `.agent/context/PATTERNS_AGENT.md` + `.agent/context/ANTIPATTERNS_AGENT.md` |

> **Why:** loading `AGENTS.md` (196 lines) every session instead of `lean/INDEX.md`
> costs 3× context on every turn. Load the full index only when you need to register a file.

---

## Purpose

This is a **language-agnostic engineering template** — a reusable baseline for new projects adopted by AI agents (Claude Code, Codex, Copilot, Gemini CLI) and human engineers. The repo contains no application code yet; `src/` holds only DDD scaffold stubs (`application/`, `domain/`, `infrastructure/`, `interface/`) with empty `index.ts` placeholders — no business logic. The value is the governance, documentation, and automation framework itself.

---

## Commands

```bash
# Node tooling lives in tooling/ — install from there, or use root shim
cd tooling && npm install   # install dev deps (Node ≥ 22 required)
npm test                    # run all tests (vitest run) — works from root or tooling/
npm run test:watch
npm run test:coverage
npm run lint                # ESLint v9 flat config, zero warnings allowed
npm run typecheck           # tsc --noEmit
```

Run a single test file:

```bash
npx vitest run tests/unit/documentation.test.ts
```

RFC risk analysis (requires Python 3.12 + pyyaml):

```bash
python infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 50 --output risk_report.md
```

---

## Architecture

### Knowledge Base (`AGENTS.md` + `.agent/context/`)

`AGENTS.md` is the **master index** and the single source of truth for the knowledge base. Every file added to `.agent/context/` **must be registered in `AGENTS.md` in the same commit** — the `tests/unit/documentation.test.ts` integrity test enforces bidirectional consistency and will fail CI otherwise.

The context files (70+ registered in `AGENTS.md`) are organized into six domains:

| Domain | Key files |
|---|---|
| Guidelines | `BEST_PRACTICES.md`, `PATTERNS.md`, `ANTIPATTERNS.md` |
| Architecture | `ARCHITECTURE.md`, `CLASS_MAP.md`, `STATE_MACHINE.md`, `API_CONTRACT.md` |
| Quality | `TEST_STRATEGY.md`, `E2E_TESTING.md`, `LOAD_TESTING_FRAMEWORK.md` |
| Governance | `SECURITY.md`, `THREAT_MODEL.md`, `SUPPLY_CHAIN.md`, `GOVERNANCE.md` |
| Operations | `RUNBOOK.md`, `INCIDENT_RUNBOOK.md`, `DISASTER_RECOVERY.md`, `CI_CD.md` |
| Project Mgmt | `BACKLOG.md`, `DECISION_LOG.md`, `DEPENDENCY_POLICY.md`, `TECH_RADAR.md` |

Before proposing structural changes to any area, read its corresponding context file.

### RFCs (`rfcs/`)

New RFCs go in `rfcs/` as YAML (use `rfcs/TEMPLATE.yaml`). The `risk-check` CI workflow scores every RFC on push and **blocks merge if risk score ≥ 60**. The score is calculated by `infra/scripts/risk_engine.py`.

### CI Workflow

Eleven workflows are active: `ci.yml` (lint + typecheck + test, Node 22/24 matrix), `security.yml` (npm audit Node + pip-audit Python — lint/typecheck/test owned by ci.yml), `risk-check.yml` (RFC YAML risk gate, blocks on score ≥ 60), `docs-integrity.yml` (AGENTS.md bidirectional guard, triggers on `.agent/context/**`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`), `pr-lint.yml` (placeholder + Node.js EOL check on PRs — warning only, does not block merge), `template-drift.yml` (weekly cron + push: Node EOL, CONFIGURE placeholders, test integrity, npm audit, backlog open items, stale sprint — opens GitHub issue on high findings), `lint-all.yml` (ESLint + typecheck + markdownlint unified gate), `ci-go.yml` (Go language matrix), `ci-matrix.yml` (multi-language matrix), `ci-python.yml` (Python CI), `ci-rust.yml` (Rust CI).

### Tests

All tests live under `tests/`. The `documentation.test.ts` guard test is the most critical — it is the integrity mechanism for the entire knowledge base. Do not weaken or skip it.

---

## Agent Operating Rules

### Directive 1 — Think Before Coding

**MANDATORY — output this block verbatim before the first tool call of every engineering turn:**

```markdown
**Assumptions**
| # | Assumption | Critical? |
|---|---|---|
| 1 | ... | — / critical |

**Interpretations** *(omit if only 1)*
| Interpretation | Likelihood | Recommended action |
|---|---|---|
```

Rules: ≤ 5 assumptions; mark `critical` if it affects correctness, security, compliance (GDPR, SOC2, SLA), or irreversibility. List all plausible interpretations; omit table only when exactly 1 exists. Do not invoke any tool until this block is written.

_Emergency Bypass:_ Instructions containing "Hotfix" or "Emergency" bypass the requirement to wait for human approval on critical assumptions.

### Directive 2 — Simplicity First

Implement the smallest logical change that satisfies acceptance criteria and tests. Avoid speculative abstractions. When static analysis is unavailable, manually count decision nodes (ifs, loops, switches, ternaries, null-coalescing, boolean guards) scoped to the function or block being changed — demonstrate a reduction of ≥ 1 point from that baseline. Sum closures/lambdas into the enclosing function.

### Directive 3 — Surgical Changes

Limit edits strictly to the requested scope. Do not perform unrelated styling, refactoring, or formatting. If human approval is required for a **destructive or irreversible action**, output `[PAUSED - WAITING FOR APPROVAL]`, state the justification, and immediately stop invoking tools. Rule 9 ambiguity resolution does not require a pause — resolve deterministically and proceed.

### Directive 4 — Goal-Driven Execution

**MANDATORY — output this block immediately after the Directive 1 block, before the first tool call:**

```markdown
**Goal:** <single sentence>
**Acceptance tests:** <bullet list of verifiable criteria>
**Verification steps:** <commands or checks that prove the goal is met>
```

---

1. **AGENTS.md Guard**: adding, renaming, or deleting a file in `.agent/context/` requires a matching update to `AGENTS.md` in the same commit. The CI test will catch violations.
2. **Template Neutrality**: keep all `.agent/context/` files generic. Use `start-project`, `node-ts`, `typescript` placeholders — never hardcode product/domain names inside template files.
3. **Doc Avoidance Exception**: the global "never load `*.md`" heuristic does NOT apply here. `.agent/context/**/*.md` and `AGENTS.md` are the primary knowledge source and must be read before making architecture or governance decisions.
4. **Pre-commit gate**: `npm run lint && npm run typecheck && npm test` must pass before any task is marked complete.
5. **Dependency Guard**: do not introduce new npm packages without explicit authorization. See `.agent/context/DEPENDENCY_POLICY.md`.
6. **Destructive operations** (DROP, delete, force-push, `rm -rf`) require explicit human confirmation and output of `[PAUSED - WAITING FOR APPROVAL]` — never execute autonomously.
7. **Silent CLASS_MAP edits are prohibited**: any update to `.agent/context/CLASS_MAP.md` must include a one-line summary in the chat turn (silent edits bypass the guard audit trail).
8. **Analysis mode — explicit trigger only**: announce the active mode at the start of **every turn** using `> Mode: <mode> | artifact: <domain>` — this is mandatory regardless of which mode is active. Valid modes: `construct`, `lint`, `falsify`. Valid domains: `code`, `doc`, `map`, `machine` (see Rule 9). Construction and audit are cognitively opposite — never conflate them.

   When performing any audit (triggered explicitly): (1) assume gaps and failures exist by default; (2) rate every finding 🔴 critical / 🟡 operational / 🟢 observation; (3) state `Scope: <files or sections checked>`.

9. **Code artifact modes — explicit trigger only**: modes are activated per-turn by explicit user instruction only.

   - `*-construct` — build or edit. No audit. Default for all tasks.
   - `*-lint` — surface conformance check: naming, format, mandatory field coverage, obvious omissions. Does not attempt to break semantics. Run before merge.
   - `*-falsify` — adversarial: enumerate breaking inputs, unprotected invariants, unreachable states, contract violations. Emit 🔴/🟡/🟢 findings. **Explicit trigger only.**

   Four domains: `code-*` (`.py`, `.ts`, `.js`, `.go`, `.rs`, etc.), `doc-*` (prose, comments, `.md`, RFC `.yaml`), `map-*` (CLASS_MAP, ARCHITECTURE), `machine-*` (STATE_MACHINE FSMs).

   **Ambiguity resolution** (in order, no pause):
   1. Extension: `.py/.ts/.js/.go/.rs` → `code`; `.md` → `doc`; `.yaml` in `rfcs/` or `.agent/context/` → `doc`; `.yaml` in `infra/` or workflow → `code`.
   2. Location: `infra/scripts/` → `code`; `.agent/context/` → `doc`.
   3. Default: `doc`.

   **Precedence:** Directive 3 pause applies only to destructive/irreversible tool calls, not to mode selection. Rule 9 mode selection is always resolved without pause. A sprint-closing gate in `DEFINITION_OF_DONE.md` runs `code-lint` by default; `code-falsify` requires explicit human request. Slash commands in `.claude/commands/` — use `/code-falsify`, `/map-lint`, `/full-falsify`, `/lint-all`, etc.

10. **Quality by Execution Mode**: before concluding delivery, apply explicit verification. Use `/lint-all` for routine changes and `/full-falsify` for high-risk changes (release, post-incident, or audit).
11. **Minimal Traceable Memory**: record all architectural decisions, compliance audits, or critical changes in `.agent/memory.json`. **First run:** if `memory.json` does not exist, create it as `[]` before acquiring lock. **Locking:** acquire lock `memory.lock` (UUID + timestamp); cap retries at 5 (5 s cumulative); if lock is older than 60 s, treat as orphaned and overwrite. **Atomic write:** `.bak` → `.tmp` → verify lock → swap → validate JSON → delete lock; on error restore `.bak`. **Schema:** every entry requires `id`, `parent_id` (null for first), `timestamp` (ISO8601), `severity` (`"high"`/`"med"`/`"low"`), `scope` (array of paths), `summary` (≤ 120 chars), `source_commit`. Keep operational notes in `.agent/MEMORY.md` for cross-agent handoff.

---

## Adopting This Template in a New Project

1. Copy repo root into new project.
2. Replace all `start-project` placeholders.
3. Copy `.env.example` → `.env` and fill values (skip if adopting as tooling-only — no runtime env vars required by the template itself).
4. Create first RFC in `rfcs/` from `rfcs/TEMPLATE.yaml`.
5. `cd tooling && npm install && npm test` — verify the documentation integrity test passes.
6. Score architecture with `.agent/context/ARCHITECTURE_SCORING_PLAYBOOK.md`; record pillar scores in `MATURITY_REPORT.md` Executive Summary before Sprint 1.
7. Record adoption decision in `DECISION_LOG.md`.
8. Register every new `.agent/context/` file in `AGENTS.md` on creation.

---

## See Also

- `AGENTS.md` — vendor-neutral knowledge base index
- `.agent/context/AGENT_HANDOFF.md` — cross-agent handoff protocol; produce a handoff document before switching agents or resetting context
- `.agent/context/AGENT_PROMPT_ADEQUACY.md` — rationale for CLAUDE.md vs AGENTS.md separation
- `.agent/context/CLAUDE_TOKEN_OPTIMIZATION.md` — token efficiency guide for this template
