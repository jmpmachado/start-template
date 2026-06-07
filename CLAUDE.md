# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Session Start Protocol

**Load context in this order:**

| When | Load |
|------|------|
| Every session (always) | `.agent/context/AGENT_GUIDELINES.md` — Core operating guidelines |
| Before any edit to `.agent/context/` | `AGENTS.md` — Master index & CI guard |
| Before planning or executing a sprint | `.agent/context/BACKLOG.md` — Open backlog items |

---

## Purpose

This is a **simplified engineering template** adopted for a .NET 9 Minimal API backend and HTML/CSS/JS frontend project. The value is the governance, documentation, and automation framework itself.

---

## Commands

```bash
# Node tooling lives in tooling/ — install from there, or use root shim
cd tooling && npm install   # install dev deps (Node ≥ 24 required)
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

---

## Architecture

### Knowledge Base (`AGENTS.md` + `.agent/context/`)

`AGENTS.md` is the **master index** and single source of truth for the knowledge base. Every file added to `.agent/context/` **must be registered in `AGENTS.md` in the same commit** — the `tests/unit/documentation.test.ts` integrity test enforces bidirectional consistency and will fail CI otherwise.

The context files registered in `AGENTS.md` are organized into:

| Domain | Key files |
|---|---|
| Guidelines | `AGENT_GUIDELINES.md`, `BEST_PRACTICES.md`, `PATTERNS.md`, `ANTIPATTERNS.md`, `AGENT_HANDOFF.md` |
| Architecture | `ARCHITECTURE.md`, `CLASS_MAP.md`, `STATE_MACHINE.md`, `DATA_MODEL.md` |
| Quality | `TEST_STRATEGY.md`, `TOOLING_RUNTIME.md` |
| Governance | `SECURITY.md`, `THREAT_MODEL.md` |
| Operations | `RUNBOOK.md`, `CI_CD.md` |
| Project Mgmt | `BACKLOG.md`, `DECISION_LOG.md`, `DEPENDENCY_POLICY.md`, `LEAN_PROFILE.md`, `AGILE_CONFIG.md` |

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

### Directive 2 — Simplicity First

Implement the smallest logical change that satisfies acceptance criteria and tests. Avoid speculative abstractions. When static analysis is unavailable, manually count decision nodes (ifs, loops, switches, ternaries, null-coalescing, boolean guards) scoped to the function or block being changed — demonstrate a reduction of ≥ 1 point from that baseline. Sum closures/lambdas into the enclosing function.

### Directive 3 — Surgical Changes

Limit edits strictly to the requested scope. Do not perform unrelated styling, refactoring, or formatting. If human approval is required for a **destructive or irreversible action**, output `[PAUSED - WAITING FOR APPROVAL]`, state the justification, and immediately stop invoking tools.

### Directive 4 — Goal-Driven Execution

**MANDATORY — output this block immediately after the Directive 1 block, before the first tool call:**

```markdown
**Goal:** <single sentence>
**Acceptance tests:** <bullet list of verifiable criteria>
**Verification steps:** <commands or checks that prove the goal is met>
```

---

1. **AGENTS.md Guard**: adding, renaming, or deleting a file in `.agent/context/` requires a matching update to `AGENTS.md` in the same commit. The CI test will catch violations.
2. **Target Stack Consistency**: ensure all codebase files, workflows, and configurations align with the chosen C#/.NET 9 backend and HTML5/CSS/JS frontend stack. Non-relevant programming languages (e.g. Python, Go, Rust, Java) are prohibited in active project logic.
3. **Doc Avoidance Exception**: `.agent/context/**/*.md` and `AGENTS.md` are the primary knowledge source and must be read before making architecture or governance decisions.
4. **Pre-commit gate**: `npm run lint && npm run typecheck && npm test` must pass before any task is marked complete.
5. **Dependency Guard**: do not introduce new npm packages without explicit authorization. See `.agent/context/DEPENDENCY_POLICY.md`.
6. **Destructive operations** (DROP, delete, force-push, `rm -rf`) require explicit human confirmation and output of `[PAUSED - WAITING FOR APPROVAL]` — never execute autonomously.
7. **Silent CLASS_MAP edits are prohibited**: any update to `.agent/context/CLASS_MAP.md` must include a one-line summary in the chat turn.
8. **Analysis mode — explicit trigger only**: announce the active mode at the start of **every turn** using `> Mode: <mode> | artifact: <domain>`. Valid modes: `construct`, `lint`, `falsify`. Valid domains: `code`, `doc`, `map`, `machine`.
9. **Code artifact modes — explicit trigger only**: modes are activated per-turn by explicit user instruction only (`*-construct`, `*-lint`, `*-falsify`).
10. **Quality by Execution Mode**: before concluding delivery, apply explicit verification. Use `/lint-all` for routine changes and `/full-falsify` for audits.
11. **Minimal Traceable Memory**: record all architectural decisions, compliance audits, or critical changes in `.agent/memory.json`. Every entry requires `id`, `parent_id` (null for first), `timestamp` (ISO8601), `severity` (`"high"`/`"med"`/`"low"`), `scope` (array of paths), `summary` (≤ 120 chars), `source_commit`. Keep operational notes in `.agent/MEMORY.md`.
    * **utils/ Directory Exemption:** JavaScript/TypeScript files cloned or integrated under the `utils/` directory (governed by [UTILS_ADDENDUM.md](docs/UTILS_ADDENDUM.md)) are third-party/runtime utility files, not Node.js tooling, and are exempt from the tooling folder restriction. Furthermore, modifications or existence of files in `/utils/` do not represent architectural decisions or critical changes under Rule 11, and do not trigger a requirement to be recorded in `memory.json` nor do they present memory race conditions or violations of the memory directives.
