# GEMINI.md

This file provides guidance to Gemini CLI when working with code in this repository.

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

> **Mandatory per-turn:** Before the first tool call, output an Assumptions table (≤ 5 rows, mark `critical` if correctness/security/compliance/irreversibility is affected) and a Goal block (`**Goal:**` / `**Acceptance tests:**` / `**Verification steps:**`). See `CLAUDE.md` Directives 1 and 4 for the full format.

1. **AGENTS.md Guard**: adding, renaming, or deleting a file in `.agent/context/` requires a matching update to `AGENTS.md` in the same commit. The CI test will catch violations.
2. **Target Stack Consistency**: ensure all codebase files, workflows, and configurations align with the chosen C#/.NET 9 backend and HTML5/CSS/JS frontend stack. Non-relevant programming languages (e.g. Python, Go, Rust, Java) are prohibited in active project logic.
3. **Doc Avoidance Exception**: `.agent/context/**/*.md` and `AGENTS.md` are the primary knowledge source and must be read before making architecture or governance decisions.
4. **Pre-commit gate**: `npm run lint && npm run typecheck && npm test` must pass before any task is marked complete.
5. **Dependency Guard**: do not introduce new npm packages without explicit authorization. See `.agent/context/DEPENDENCY_POLICY.md`.
6. **Destructive operations** (DROP, delete, force-push, `rm -rf`) require explicit human confirmation — never execute autonomously.
7. **Silent CLASS_MAP edits are prohibited**: any update to `.agent/context/CLASS_MAP.md` must include a one-line summary in the chat turn.
8. **Analysis mode — explicit trigger only** (Rule 8): announce the active mode at the start of every turn using `> Mode: <mode> | artifact: <domain>`. Valid modes: `construct`, `lint`, `falsify`. Valid domains: `code`, `doc`, `map`, `machine` (see Rule 9).
9. **Code artifact modes — explicit trigger only** (Rule 9): modes are activated per-turn by explicit user instruction only (`*-construct`, `*-lint`, `*-falsify`).
10. **Quality by Execution Mode**: before concluding delivery, apply explicit verification. Use "lint-all" for routine changes and "full-falsify" for audits.
11. **Minimal Traceable Memory**: record all architectural decisions, compliance audits, or critical changes in `.agent/memory.json` per Rule 11.
    * **utils/ Directory Exemption:** JavaScript/TypeScript files cloned or integrated under the `utils/` directory (governed by [UTILS_ADDENDUM.md](docs/UTILS_ADDENDUM.md)) are third-party/runtime utility files, not Node.js tooling, and are exempt from the tooling folder restriction. Furthermore, modifications or existence of files in `/utils/` do not represent architectural decisions or critical changes under Rule 11, and do not trigger a requirement to be recorded in `memory.json` nor do they present memory race conditions or violations of the memory directives.
