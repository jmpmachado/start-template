# ECC — Architecture

> Mode: doc-construct | artifact: map

This document describes ECC's design principles, cross-module dependency graph, data flows,
and key architectural decisions.

---

## Design Principles

| Principle | Implementation |
|---|---|
| **Cross-harness first** | Source truth in `agents/`, `skills/`, `rules/`; harness-specific adapters at edges only |
| **Skill-centric workflows** | Modern work lives in `skills/`; `commands/` is a backward-compat wrapper layer |
| **Hook-driven automation** | All session automation runs through the `hooks.json` event bus — no ad-hoc shell one-liners |
| **Schema-validated configs** | Every structured config file has a JSON Schema; CI fails on invalid payloads |
| **Shared library, thin hooks** | Hook scripts are thin; all logic lives in `scripts/lib/` (testable, reusable) |
| **Zero external deps in hooks** | Hook scripts use only Node built-ins and `scripts/lib/` — no `npm install` at runtime |
| **Session persistence** | State, cost, and governance data survive context compaction via `Stop` hook + SQLite (ecc2) |
| **Type safety at boundaries** | TypeScript in OpenCode plugin, Python type hints in `src/`, JSON schemas throughout |

---

## Module Dependency Graph

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SOURCE CONTENT                                 │
│                                                                        │
│   agents/        skills/         rules/         contexts/             │
│   (63 agents)    (250 skills)    (18 rulesets)  (dev/review/research) │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
                  agent.yaml (export manifest)
                          │
         ┌────────────────┼────────────────────────────────┐
         │                │                                │
  ┌──────▼──────┐  ┌──────▼──────┐               ┌────────▼────────┐
  │  Harness    │  │  commands/  │               │    hooks/       │
  │  Adapters   │  │  (79 cmds)  │               │  hooks.json     │
  │             │  └──────┬──────┘               └────────┬────────┘
  │ .claude-    │         │                               │
  │  plugin/    │  legacy-command-shims/          scripts/hooks/
  │ .codex-     │                                         │
  │  plugin/    │                                 scripts/lib/ (60 modules)
  │ .opencode/  │                                         │
  │ .cursor/    │                                 ┌───────┴────────┐
  │ .gemini/    │                                 │   schemas/     │
  │ .zed/       │                                 │  (10 schemas)  │
  │ .qwen/      │                                 └───────┬────────┘
  │ .trae/      │                                         │
  │ .github/    │                                   CI validate-*.js
  └──────┬──────┘
         │
   Harness Runtime
  (Claude Code, Codex,
   OpenCode, Cursor...)
         │
    ┌────┴────────────────────────────────┐
    │         SESSION                     │
    │                                     │
    │  mcp-configs/ ←→ .mcp.json         │
    │  (15+ MCP servers)                  │
    │                                     │
    │  ecc2/ (Rust daemon — ALPHA)        │
    │  session/ tui/ worktree/ comms/     │
    │                                     │
    │  src/llm/ (Python LLM layer)        │
    │  providers: Claude/OpenAI/Ollama    │
    └─────────────────────────────────────┘
```

---

## Data Flows

### 1. Installation Flow

```
User runs install.sh / install.ps1
  → scripts/install-plan.js
    → reads manifests/install-profiles.json (validated by schema)
    → resolves component list for selected profile
  → scripts/install-apply.js
    → copies agents/, skills/, rules/, hooks/, mcp-configs/ to target harness dir
    → writes .ecc/install-state.json (idempotency record)
    → runs post-install hooks
```

### 2. Session Startup Flow

```
Harness starts session
  → SessionStart hook fires
    → scripts/hooks/session-persist.js loads .ecc/sessions/<id>.json
    → scripts/lib/detect-stack.js scans project files
    → Matching rules from rules/<lang>/ injected into system prompt
    → MCP servers listed in .mcp.json activated
  → Agent/skill context loaded from agent.yaml catalog
  → Session is ready
```

### 3. Tool Call Flow (with PreToolUse hook)

```
LLM emits tool call (e.g. Bash)
  → PreToolUse event fires
    → pre:bash:dispatcher hook (scripts/hooks/pre-bash-dispatcher.js)
      → quality check, git hook check, security scan
      → if check fails: returns block signal (non-zero exit)
  → Tool executes (if not blocked)
  → PostToolUse event fires
    → post:quality-gate hook (runs lint/typecheck on modified files)
    → post:ecc-context-monitor (checks cost, token usage)
```

### 4. Session Stop Flow

```
LLM response ends
  → Stop event fires
    → stop:format-typecheck: batch Prettier + tsc on accumulated edits
    → stop:session-persist: writes session summary to .ecc/sessions/
    → stop:pattern-evaluate: flags patterns seen for possible skill extraction
```

### 5. Multi-Session Flow (ECC 2.0)

```
ecc2 daemon starts
  → listens on ~/.ecc/daemon.sock
  → TUI connects and renders dashboard

User starts session on branch feat/auth
  → worktree/ creates .worktrees/feat-auth (git worktree)
  → session/manager.rs spawns Claude Code process in worktree
  → session/store.rs writes state to SQLite
  → session/output.rs captures stdout/stderr
  → TUI updates dashboard in real-time

User pauses session
  → manager.rs sends SIGSTOP (POSIX) / suspend (Windows)
  → store.rs updates status → "paused"
  → TUI reflects paused state
```

---

## Key Invariants

1. **Adapter directories contain no source content** — they reference or mirror from `agents/`, `skills/`, `rules/`. Editing content inside `.claude/`, `.codex/`, etc. directly will cause adapter drift.

2. **Hook scripts exit 0 for non-fatal errors** — a failing hook must not crash the user's session. Only `pre:` hooks with a deliberate block intent should exit non-zero.

3. **`scripts/lib/` has no runtime external dependencies** — all shared utilities use Node.js built-ins only (`fs`, `path`, `child_process`, `crypto`, `http`). This ensures hooks work without an `npm install`.

4. **All structured config is schema-validated before use** — no config file is read without first passing it through `ajv` against the corresponding schema. This prevents silent misconfiguration.

5. **`agent.yaml` is the single source of truth for the skill/agent/command catalog** — CI scripts verify that every file in `agents/`, `skills/`, and `commands/` is registered here. Unregistered files are treated as errors.

---

## Component Size Reference

| Component | Lines of Code (approx.) |
|---|---|
| `ecc_dashboard.py` | 41,733 |
| `README.zh-CN.md` | 37,648 |
| `the-security-guide.md` | 29,300 |
| `WORKING-CONTEXT.md` | 30,000+ |
| `scripts/lib/` (60 modules) | ~15,000 |
| `ecc2/src/` (Rust) | ~8,000 |
| `src/llm/` (Python) | ~3,000 |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Primary language | JavaScript / Node.js (CommonJS) |
| Secondary language | Python 3.12+ |
| Control plane (alpha) | Rust (Tokio, rusqlite, ratatui) |
| Schema validation | JSON Schema Draft-07 via `ajv` |
| Test runner | Node.js (`tests/run-all.js`) + pytest |
| Harness integration | Markdown (agents, skills, commands, rules) + YAML frontmatter |
| MCP transport | stdio (local) + HTTP (remote) |
| Session persistence | JSONL (ECC 1.x) + SQLite (ECC 2.0) |
| TypeScript plugin | `.opencode/` only (compiled with `tsc`) |

---

## See Also

- [INDEX.md](INDEX.md) — full module map
- [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) — adapter architecture details
- [HOOKS.md](HOOKS.md) — event bus and lifecycle
- [ECC2.md](ECC2.md) — Rust control plane architecture
- `utils/ECC/docs/architecture/` — upstream extended architecture docs
