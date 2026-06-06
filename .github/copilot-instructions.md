# Copilot Instructions — start-project

> Runtime behavior contract for GitHub Copilot (Chat, Workspace, CLI).
> For the full knowledge base, see `AGENTS.md`.

## Operating Rules

> **Mandatory per-turn:** Before the first tool call, output an Assumptions table (≤ 5 rows, mark `critical` if correctness/security/compliance/irreversibility is affected) and a Goal block (`**Goal:**` / `**Acceptance tests:**` / `**Verification steps:**`). See `CLAUDE.md` Directives 1 and 4 for the full format.

1. **AGENTS.md Guard**: adding, renaming, or deleting any file in `.agent/context/` requires a matching update to `AGENTS.md` in the same commit. The CI documentation integrity test will fail otherwise.
2. **Template Neutrality**: never hardcode product or domain names in `.agent/context/` files. Use `start-project`, `node-ts`, `typescript` placeholders.
3. **Pre-commit gate**: `npm run lint && npm run typecheck && npm test` must pass before any task is marked complete.
4. **Destructive operations** (DROP, delete, force-push, rm -rf) require explicit human confirmation — never execute autonomously.
5. **Doc Avoidance Exception**: `.agent/context/**/*.md` and `AGENTS.md` are primary knowledge sources and must be consulted before architecture or governance decisions.
6. **Dependency Guard**: do not introduce new npm packages without explicit authorization. See `.agent/context/DEPENDENCY_POLICY.md`.
7. **Analysis mode — explicit trigger only** (Rule 8): announce the active mode at the start of every response (e.g., `> Mode: doc-falsify | artifact: doc`). When performing any audit (triggered explicitly by the user writing "falsify", "doc-falsify", "full-falsify", etc.): assume gaps exist, rate every finding by severity (🔴 critical / 🟡 operational / 🟢 observation), and declare the scope checked.
8. **Code artifact modes — explicit trigger only** (Rule 9): code files default to construct mode. Announce mode at start of every response (e.g., `> Mode: code-construct`). Modes per domain:
   - `code-*` — implementation files (`*.ts`, `*.js`, `*.py`, etc.)
   - `doc-*` — docstrings, comments, inline documentation
   - `map-*` — `CLASS_MAP.md`, `ARCHITECTURE.md`
   - `machine-*` — `STATE_MACHINE.md`
   - Levels: `*-construct` (build, default for code), `*-lint` (conformance check), `*-falsify` (adversarial — explicit trigger only)
   - Precedence: Rule 9 overrides Rule 8 when the primary artifact is a code file — code defaults to `code-construct` regardless of request phrasing.
   - Text triggers (no slash commands in Copilot): write "code-falsify", "doc-falsify", "map-lint", "full-falsify" etc. in the prompt to activate the corresponding mode.
9. **Silent CLASS_MAP edits are prohibited**: any update to `.agent/context/CLASS_MAP.md` must include a one-line summary in the chat turn.

## Key Commands

```bash
npm test                  # vitest run
npm run lint              # ESLint v9, zero warnings
npm run typecheck         # tsc --noEmit
npm run test:coverage     # vitest run --coverage
```

## Knowledge Base Entry Points

- `AGENTS.md` — master index of all context files
- `.agent/context/ARCHITECTURE.md` — C4 diagrams, layer model
- `.agent/context/TEST_STRATEGY.md` — test ratios, coverage floors, mocking policy
- `.agent/context/SECURITY.md` — AI agent security rules
- `.agent/context/DEFINITION_OF_DONE.md` — PR completion checklist
- `.agent/context/AGENT_HANDOFF.md` — cross-agent handoff protocol; produce handoff document before switching agents or ending a session
- `rfcs/` — versioned design decisions (YAML)

## Error Handling

- On tool or command failure: return the error code and a one-line fix suggestion. Do not retry more than twice.
- TypeScript errors: run `npm run typecheck` to surface all type errors before declaring a task complete.
- Test failures: run `npm test` locally; do not open a PR while tests are red.
- Pre-commit hook failure: fix the reported issue, re-stage, and commit again. Never use `--no-verify` without explicit tech-lead approval documented in the PR description.

## See Also

- [CLAUDE.md](../CLAUDE.md) — Claude Code runtime contract and agent operating rules
- [GEMINI.md](../GEMINI.md) — Gemini CLI runtime contract
- [AGENT_CONTRACT_GUIDE.md](../.agent/context/AGENT_CONTRACT_GUIDE.md) — how to write and evaluate agent contracts
- [AGENT_CONTRACT_REVIEW.md](../.agent/context/AGENT_CONTRACT_REVIEW.md) — review checklist for agent contract PRs
- [AGENT_HANDOFF.md](../.agent/context/AGENT_HANDOFF.md) — cross-agent handoff protocol
