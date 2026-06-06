# Agent Memory — start-project

Structured cross-agent handoff record. Each entry: severity · scope · summary · commit.
Full JSON audit trail with parent chain: `.agent/memory.json` (Rule 11).

---

| id (short) | ts | sev | scope | summary | commit |
| :--------- | :-- | :-- | :---- | :------ | :----- |
| | | | | | |
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
