# Codex Instructions — start-project

> Runtime behavior contract for OpenAI Codex CLI.
> For the full knowledge base, see `AGENTS.md`.

---

## Operating Rules

> **Mandatory per-turn:** Before the first tool call, output an Assumptions table (≤ 5 rows, mark `critical` if correctness/security/compliance/irreversibility is affected) and a Goal block (`**Goal:**` / `**Acceptance tests:**` / `**Verification steps:**`). See `CLAUDE.md` Directives 1 and 4 for the full format.

1. **AGENTS.md Guard**: adding, renaming, or deleting a file in `.agent/context/` requires a matching update to `AGENTS.md` in the same commit. The CI integrity test will catch violations.
2. **Template Neutrality**: keep all `.agent/context/` files generic. Use `start-project`, `node-ts`, `typescript` placeholders — never hardcode product/domain names.
3. **Doc Avoidance Exception**: `.agent/context/**/*.md` and `AGENTS.md` are the primary knowledge source and must be read before architecture or governance decisions.
4. **Pre-commit gate**: `npm run lint && npm run typecheck && npm test` must pass before any task is marked complete.
5. **Dependency Guard**: do not introduce new npm packages without explicit authorization. See `.agent/context/DEPENDENCY_POLICY.md`.
6. **Destructive operations** (DROP, delete, force-push, `rm -rf`) require explicit human confirmation — never execute autonomously.
7. **Silent CLASS_MAP edits are prohibited**: any update to `.agent/context/CLASS_MAP.md` must include a one-line summary in the response turn.
8. **Analysis mode — explicit trigger only** (Rule 8): announce the active mode at the start of every response using `> Mode: <mode> | artifact: <domain>`. Valid modes: `construct`, `lint`, `falsify`. Valid domains: `code`, `doc`, `map`, `machine` (see Rule 9).

   When performing any audit (triggered explicitly by the user writing "falsify", "doc-falsify", "full-falsify", etc.): (1) assume gaps exist; (2) rate every finding 🔴 critical / 🟡 operational / 🟢 observation; (3) declare scope checked.

   Precedence: Rule 9 overrides Rule 8 when the primary artifact is a code file — code defaults to `code-construct` regardless of phrasing.
9. **Code artifact modes — explicit trigger only** (Rule 9): code files default to `*-construct`. **Announce the active mode at the start of every response** (e.g., `> Mode: code-construct`).

   | Level | When | Output |
   | :--- | :--- | :--- |
   | `*-construct` | Default for code tasks | Build or edit. No audit. |
   | `*-lint` | Explicit: write "lint" or "code-lint" | Conformance check: naming, format, mandatory fields. |
   | `*-falsify` | Explicit: write "code-falsify" / "full-falsify" | Adversarial: enumerate breaking inputs, invariants, unreachable states. Emit 🔴/🟡/🟢. |

   Four domains: `code-*` (implementation), `doc-*` (docstrings/comments), `map-*` (CLASS_MAP/ARCHITECTURE), `machine-*` (STATE_MACHINE).

   **Codex has no slash commands** — activate modes by writing the trigger text in the prompt:
   - `"code-falsify this function"` → adversarial code review
   - `"doc-lint the docstrings in this file"` → conformance check on docs
   - `"full-falsify"` → all four domains, adversarial
   - `"lint-all"` → code-lint + doc-lint
10. **Quality by Execution Mode**: before concluding delivery, apply explicit verification. Write "lint-all" for routine changes and "full-falsify" for high-risk changes (release, post-incident, audit).
11. **Minimal Traceable Memory**: record all architectural decisions, compliance audits, or critical changes in `.agent/memory.json`. **First run:** if `memory.json` does not exist, create it as `[]` before acquiring lock. **Locking:** acquire lock `memory.lock` (UUID + timestamp); cap retries at 5 (5 s cumulative); if lock is older than 60 s, treat as orphaned and overwrite. **Atomic write:** `.bak` → `.tmp` → verify lock → swap → validate JSON → delete lock; on error restore `.bak`. **Schema:** every entry requires `id`, `parent_id` (null for first), `timestamp` (ISO8601), `severity` (`"high"`/`"med"`/`"low"`), `scope` (array of paths), `summary` (≤ 120 chars), `source_commit`. Keep operational notes in `.agent/MEMORY.md` for cross-agent handoff.

---

## Key Commands

```bash
npm test                  # vitest run
npm run lint              # ESLint v9, zero warnings
npm run typecheck         # tsc --noEmit
npm run test:coverage     # vitest run --coverage
npm run lint:md           # markdownlint-cli2
```

---

## Knowledge Base Entry Points

- `AGENTS.md` — master index of all context files
- `.agent/context/ARCHITECTURE.md` — C4 diagrams, layer model
- `.agent/context/TEST_STRATEGY.md` — test ratios, coverage floors, mocking policy
- `.agent/context/SECURITY.md` — AI agent security rules
- `.agent/context/DEFINITION_OF_DONE.md` — PR completion checklist
- `.agent/context/AGENT_HANDOFF.md` — cross-agent handoff protocol

---

## See Also

- [CLAUDE.md](../CLAUDE.md) — Claude Code runtime contract (reference for rule parity)
- [GEMINI.md](../GEMINI.md) — Gemini CLI runtime contract
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) — GitHub Copilot runtime contract
- [AGENT_HANDOFF.md](../.agent/context/AGENT_HANDOFF.md) — cross-agent handoff protocol
