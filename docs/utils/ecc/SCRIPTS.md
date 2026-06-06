# ECC — Scripts Module

> Source: `utils/ECC/scripts/` · Count: 152 Node.js utilities · Runtime: Node ≥ 22 · Module system: CommonJS

The `scripts/` directory is the operational backbone of ECC. It contains the CLI entry points,
installation machinery, hook execution wrappers, harness validation tools, and 60 shared utility
modules. All scripts are cross-platform (POSIX + Windows).

---

## Directory Structure

```
scripts/
├── lib/              # 60 shared utility modules
├── hooks/            # Hook implementation scripts
├── ci/               # CI validation scripts
├── codex/            # Codex-specific scripts
├── ecc.js            # Main CLI entry point
├── install-apply.js  # Installation executor
├── install-plan.js   # Installation planner
├── auto-update.js    # Auto-update logic
├── harness-audit.js  # Harness compliance checker
└── (90+ additional utility scripts)
```

---

## Entry Points

| Script | Invocation | Purpose |
|---|---|---|
| `ecc.js` | `ecc <command>` | Main CLI — routes to sub-commands |
| `install-apply.js` | `ecc install` | Apply an installation plan to the target harness |
| `install-plan.js` | `ecc plan` | Dry-run: produce installation plan from manifest |
| `auto-update.js` | `ecc update` | Self-update ECC to the latest version |
| `harness-audit.js` | `ecc audit` | Validate harness configuration compliance |
| `catalog.js` | `ecc catalog` | List all available skills, commands, agents |

---

## Shared Library (`scripts/lib/`)

60 utility modules organized by concern:

### Installation & Manifests

| Module | Purpose |
|---|---|
| `install-manifests.js` | Parse and validate `manifests/install-*.json` |
| `install-lifecycle.js` | Pre/post install hooks and rollback |
| `install-state.js` | Read/write `install-state.json` (idempotency) |
| `package-manager.js` | Detect npm / yarn / pnpm / bun from lockfiles |
| `setup-package-manager.js` | Configure detected package manager in harness |

### Hook Infrastructure

| Module | Purpose |
|---|---|
| `run-with-flags.js` | Wrapper: resolve plugin root, set env, exec hook script |
| `plugin-hook-bootstrap.js` | Bootstrap hooks on first install |
| `hook-runner.js` | Execute a named hook with timeout and exit-code handling |

### Harness & Platform

| Module | Purpose |
|---|---|
| `harness-adapter-compliance.js` | Validate harness adapter against ECC spec |
| `platform-audit.js` | Cross-platform capability detection |
| `detect-stack.js` | Map file extensions and manifests to language rule sets |
| `mcp-config.js` | Read, merge, and write `.mcp.json` configurations |

### Session & Orchestration

| Module | Purpose |
|---|---|
| `session-inspect.js` | Inspect active session state from `.ecc/sessions/` |
| `sessions-cli.js` | CLI interface for session listing and management |
| `loop-status.js` | Query loop operator status |
| `orchestrate-worktrees.js` | Git worktree creation and session assignment |
| `orchestration-status.js` | Report multi-worktree session status |

### Analytics & Diagnostics

| Module | Purpose |
|---|---|
| `cost-estimate.js` | Estimate token cost from session metadata |
| `discussion-audit.js` | Audit GitHub Discussions for ECC-relevant issues |
| `github-discussions.js` | GitHub Discussions API client |
| `doctor.js` | Self-diagnostic: verify install, hooks, MCP, rules |
| `agent-compress.js` | Compress agent definitions for context efficiency |

### CI & Release

| Module | Purpose |
|---|---|
| `release-approval-gate.js` | Block release if quality gates fail |
| `release-video-suite.js` | Generate release demo video suite |
| `catalog.js` | Registry of all skills/commands/agents (used by CI) |

---

## Hook Scripts (`scripts/hooks/`)

Scripts invoked by entries in `hooks/hooks.json` via `run-with-flags.js`:

| Script | Hook ID | Purpose |
|---|---|---|
| `pre-bash-dispatcher.js` | `pre:bash:dispatcher` | Bash preflight validation |
| `post-quality-gate.js` | `post:quality-gate` | Lint/typecheck after edits |
| `governance-capture.js` | `post:governance-capture` | Audit log for policy violations |
| `ecc-context-monitor.js` | `post:ecc-context-monitor` | Context window and cost monitoring |
| `stop-format-typecheck.js` | `stop:format-typecheck` | Batch format/typecheck on Stop |
| `session-persist.js` | `stop:session-persist` | Persist session state on Stop |

---

## CI Scripts (`scripts/ci/`)

| Script | Purpose |
|---|---|
| `validate-hooks.js` | Validate `hooks.json` against `schemas/hooks.schema.json` |
| `validate-manifests.js` | Validate all `manifests/*.json` against schemas |
| `validate-unicode.js` | Detect non-ASCII in hook and script files |
| `agent-catalog-check.js` | Verify all agents in `agents/` are registered in `agent.yaml` |
| `skill-catalog-check.js` | Verify all skills in `skills/` are registered in `agent.yaml` |

---

## Coding Conventions

- **Module system:** CommonJS (`require`/`module.exports`) — no ESM.
- **Error handling:** Log with `[ScriptName]` prefix; exit 0 unless fatal.
- **Plugin root:** Always resolve paths relative to `__dirname` or detected plugin root.
- **No external deps in hooks:** Hook scripts use only Node built-ins and `scripts/lib/`.
- **Cross-platform paths:** Use `path.join()` — never hardcode `/` separators.

---

## Running Scripts

```bash
# From ECC root
node scripts/ecc.js catalog
node scripts/ecc.js audit
node scripts/ecc.js plan --profile minimal

# Run a specific lib utility directly
node scripts/lib/doctor.js

# Validate all CI checks
node scripts/ci/validate-hooks.js
node scripts/ci/validate-manifests.js
```

---

## See Also

- [HOOKS.md](HOOKS.md) — hook entries that invoke scripts
- [SCHEMAS.md](SCHEMAS.md) — schemas used by `validate-*.js` CI scripts
- `utils/ECC/scripts/ecc.js` — main CLI entry point
- `utils/ECC/tests/lib/` — unit tests for shared library modules
