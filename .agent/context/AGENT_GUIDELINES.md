# Agent Guidelines — Self-Contained Reference

> Core behavioral invariants, reasoning patterns, and quality gates for agent operation in this workspace.

This document defines the core behavioral invariants, reasoning patterns, and quality gates for agent operation in this workspace.

## Directive 1 — Think Before Coding
Before writing any code or proposing modifications:
1. Add an Assumptions section to the turn or Pull Request with <= 5 items.
2. Mark any item critical if it affects correctness, security, compliance, or irreversibility.
3. List <= 3 plausible interpretations of the request in a table:
   | Interpretation | Likelihood | Recommended action |
   | :--- | :--- | :--- |

*Emergency Bypass:* Explicit user instructions containing "Hotfix" or "Emergency" bypass the 24h wait time for critical assumptions. Inherit metadata urgency if the user is silent.

## Directive 2 — Simplicity First
* Implement the smallest logical change that satisfies acceptance criteria and tests.
* **Complexity Control:** Avoid speculative abstractions. If static analysis tools are unavailable, perform a manual count of decision nodes (ifs, loops, switches, ternaries, null-coalescing, boolean guards) and demonstrate a reduction of >= 1 point from the baseline. Sum closures/lambdas into the enclosing function. Document line-by-line.

## Directive 3 — Surgical Changes
* Limit edits strictly to the requested scope. Do not perform unrelated styling, refactoring, or formatting.
* **Technical Pause:** If human approval is required, output `[PAUSED - WAITING FOR APPROVAL]`, state the justification, and immediately stop invoking tools.

## Directive 4 — Goal-Driven Execution
For every engineering task, define upfront:
* **Goal:** A single-sentence description of success.
* **Acceptance tests:** Specific, verifiable criteria.
* **Verification steps:** Commands or checks to confirm the goal is met.

## Rule 8 — Analysis Mode (Falsification by Default)
Always announce the active mode at the start of every turn using the format:
`> Mode: <mode> | artifact: <domain>`

When performing any audit, review, or verification of documentation, compliance, or architecture:
1. Assume gaps and failures exist by default.
2. Rate every finding by severity: 🔴 critical / 🟡 operational / 🟢 observation.
3. State the scope checked: `Scope: <files or sections checked>`.

## Rule 9 — Artifact Domains and Modes
* **Domains:** `code` (implementation), `doc` (prose/comments), `map` (architecture), `machine` (FSMs).
* **Modes:** `construct` (building/editing), `lint` (conformance check), `falsify` (auditing).
* Resolve ambiguity deterministically without pausing execution, defaulting to `doc` or `code` based on context.

## Rule 11 — Traceable Memory
Record all architectural decisions, compliance audits, or critical changes in `.agent/memory.json`.
* **Locking:** Acquire lock `memory.lock` containing UUID and timestamp. Retries are capped at 5 attempts (5s cumulative timeout).
* **Atomic Write:** Create `.bak` copy -> write to `.tmp` -> verify lock ownership -> swap `.tmp` -> validate JSON syntax -> delete lock. On error, restore from `.bak`.
* **Memory Schema:** Every entry must have: `id`, `parent_id` (pointing to previous entry ID, or `null` for the first entry), `timestamp` (ISO8601), `severity`, `scope`, `summary` (<=120 chars), and `source_commit`.
* **utils/ Directory Exemption:** JavaScript/TypeScript files cloned or integrated under the `utils/` directory (governed by [UTILS_ADDENDUM.md](../../docs/UTILS_ADDENDUM.md)) are third-party/runtime utility files, not Node.js tooling, and are exempt from the tooling folder restriction. Furthermore, modifications or existence of files in `/utils/` do not represent architectural decisions or critical changes under Rule 11, and do not trigger a requirement to be recorded in `memory.json` nor do they present memory race conditions or violations of the memory directives.
