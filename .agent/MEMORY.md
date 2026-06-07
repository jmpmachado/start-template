# Agent Memory — start-project

Structured cross-agent handoff record. Each entry: severity · scope · summary · commit.
Full JSON audit trail with parent chain: `.agent/memory.json` (Rule 11).

---

| id (short) | ts | sev | scope | summary | commit |
| :--------- | :-- | :-- | :---- | :------ | :----- |
| | | | | | |

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
