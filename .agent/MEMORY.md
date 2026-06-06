# Agent Memory — design-first-template (B2 pure)

Structured cross-agent handoff record. Each entry: severity · scope · summary · commit.
Full JSON audit trail with parent chain: `.agent/memory.json` (Rule 11).

---

| id (short) | ts         | sev  | scope                     | summary                                                                            | commit  |
| :--------- | :--------- | :--- | :------------------------ | :--------------------------------------------------------------------------------- | :------ |
| 6f9d0d7e   | 2026-05-26 | high | wizard.py, test_wizard.py | wizard standalone — drop cookiecutter dep, apply_substitutions 112→0 placeholders  | 6d0cf59 |
| f102a178   | 2026-05-26 | high | .agent/                   | Agent Guidelines (Directives 1-4, Rules 8/9/11) registered as canonical contract   | b5c140c |
| 6fa2e8e3   | 2026-05-26 | med  | project                   | Strategic direction: Infrastructure (not Product). Wizard serves adoption.         | b5c140c |
| c8bb377b   | 2026-05-26 | med  | wizard.py, test_wizard.py | Phase 4 CI gate: npm ci + vitest snapshot update + npm test (44 py tests)          | d5da324 |
| a3e1f290   | 2026-05-26 | med  | wizard.py, test_wizard.py | apply_profile() in main(): profile selection Phase 1, file removal Phase 3; 53 py  | bf73eec |
| b7d2c441   | 2026-05-27 | high | wizard.py, BACKLOG.md     | US-WIZ-01..11 resolved — all 13 falsify findings fixed; 74 py + 44 JS green        | 846e81e |
| e1a2b3c4-01 | 2026-05-29 | high | package.json, workflows   | DL-018: revert engines.node >=22; CI matrix 24→22 all workflows                    | 0f57291 |
| e1a2b3c4-02 | 2026-05-29 | high | tooling/vitest.config.ts  | US-VITEST-01: vitest 1.6→4.1.7; defineProject API; 0 vulns after npm ci            | c2ee9bb |
| e1a2b3c4-03 | 2026-05-29 | med  | src/*/index.ts            | QX-1..4: @module TSDoc; doc consolidation; HANDOFF moved; docstring coverage        | 32dd15a |
| e1a2b3c4-04 | 2026-05-29 | med  | check-drift.js, BACKLOG   | QX-5..6: drift fixes; BACKLOG compact 186→68L; DL-019; JSDoc checks 7–9            | 5c791c7 |
| e1a2b3c4-05 | 2026-05-29 | high | package.json, workflows   | DL-020: Node 24 Active LTS; NODE_EOL+=22; NODE_MAINTENANCE=[]; pretest added       | 8ba0789 |
| e1a2b3c4-06 | 2026-05-29 | med  | PROJECT_PLAYBOOK, USER_GUIDE | QX-8: PLAYBOOK 1886→80L; USER_GUIDE 1023→108L EN-only; error_budget docstrings  | 8ba0789 |

---

## Active invariants

- Wizard is the adoption tool — not a product. Iterate only to reduce `git clone → wizard → CI green` friction.
- `apply_substitutions()` is idempotent — safe to re-run.
- CI gate skips gracefully if Node not on PATH.
- `.agent/memory.json` is the authoritative audit trail (Rule 11, atomic write).
- All changes to this file must have a matching entry in `memory.json`.

---

## Prior index

> No archived analysis documents. Historical sprint context: `.agent/context/BACKLOG_HISTORY.md`.
