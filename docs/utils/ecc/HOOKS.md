# ECC — Hooks Module

> Source: `utils/ECC/hooks/` · Registry: `hooks/hooks.json` · Count: 25+ hooks
> Schema: `utils/ECC/schemas/hooks.schema.json`

Hooks are trigger-based automations that run at well-defined lifecycle events during a Claude Code
(or compatible harness) session. They intercept events like tool calls, file writes, and session
start/stop, then execute Node.js scripts to enforce quality gates, capture governance data, persist
state, and manage context.

---

## Hook Lifecycle Events

| Event | When it fires | Blocking? |
|---|---|---|
| `PreToolUse` | Before a tool (Bash, Edit, Write, etc.) executes | Yes — can abort |
| `PostToolUse` | After a tool completes | No — observational |
| `SessionStart` | When a new session initializes | No |
| `PreCompact` | Before context compaction | No |
| `Stop` | Before the assistant response ends | No |
| `SessionEnd` | After the session closes | No |

---

## Hook Registry (`hooks.json`)

Each hook entry:

```jsonc
{
  "id": "pre:bash:dispatcher",
  "event": "PreToolUse",
  "matcher": { "tool": "Bash" },
  "command": "node scripts/hooks/run-with-flags.js pre-bash-dispatcher",
  "description": "Bash preflight: quality, security, git hook checks",
  "async": false,
  "timeout": 10000
}
```

---

## Hook Catalog

### PreToolUse Hooks

| Hook ID | Trigger | Purpose |
|---|---|---|
| `pre:bash:dispatcher` | Any `Bash` call | Preflight checks — quality gates, security validation, git hooks |
| `pre:write:doc-file-warning` | Write to non-standard doc paths | Warns when writing documentation outside template structure |
| `pre:edit-write:gateguard-fact-force` | First Edit/Write in session | Forces investigation gate before first code change |
| `pre:mcp:health-check` | MCP tool call | Verifies MCP server is reachable before delegating |
| `pre:config:protect` | Write to config files | Guards sensitive config mutations |

### PostToolUse Hooks

| Hook ID | Trigger | Purpose |
|---|---|---|
| `post:quality-gate` | Any Edit/Write | Runs lint/typecheck on modified files |
| `post:governance-capture` | Policy-violating operations | Logs governance events to audit trail |
| `post:ecc-context-monitor` | Any tool | Monitors context window usage, cost, scope creep |
| `post:console-log-warning` | JS/TS Write with `console.log` | Warns about leftover debug logging |
| `post:metrics-capture` | Any tool | Emits per-tool metrics for session cost tracking |

### SessionStart Hooks

| Hook ID | Purpose |
|---|---|
| `session:start` | Load previous session context, detect package manager, restore state |
| `session:env-detect` | Detect Node version, OS, available toolchain |
| `session:rules-load` | Load applicable language rule sets based on detected stack |

### PreCompact Hooks

| Hook ID | Purpose |
|---|---|
| `pre-compact:state-save` | Serialize current session state before compaction wipes it |

### Stop Hooks

| Hook ID | Purpose |
|---|---|
| `stop:format-typecheck` | Batch format (Prettier) + typecheck (tsc) accumulated JS/TS edits |
| `stop:session-persist` | Write session summary and cost to `.ecc/sessions/` |
| `stop:pattern-evaluate` | Evaluate patterns seen this session for extraction to skills |

### SessionEnd Hooks

| Hook ID | Purpose |
|---|---|
| `session:end:cost-report` | Emit session cost, token usage, and tool-call counts |
| `session:end:pattern-log` | Append extracted patterns to local skill library |

---

## Hook Execution Model

All hooks are executed via the `run-with-flags.js` wrapper:

```
hooks.json entry
  → run-with-flags.js      # resolves plugin root, sets env vars
    → specific hook script  # e.g. pre-bash-dispatcher.js
      → scripts/lib/*       # shared utility functions
```

Key guarantees:
- **Exit 0** for non-blocking errors (hooks must not crash the session).
- **Async support** — hooks with `"async": true` are fire-and-forget.
- **Timeout enforcement** — hooks with `timeout` are killed if exceeded.
- **Plugin-root resolution** — hooks locate `scripts/lib/` relative to ECC install root.

---

## Memory Persistence Hooks

`hooks/memory-persistence/` contains specialized hooks for cross-session state:

- `save-context.js` — serializes conversation summary and key decisions.
- `restore-context.js` — reads prior context on `SessionStart`.
- `prune-old-sessions.js` — removes sessions older than 30 days.

---

## Adding a New Hook

1. Write a Node.js script in `scripts/hooks/<name>.js`.
2. Add an entry to `hooks/hooks.json` following the schema in `schemas/hooks.schema.json`.
3. Use `run-with-flags.js` as the command wrapper.
4. Validate the registry: `node scripts/ci/validate-hooks.js`.
5. Add a test in `tests/hooks/`.

---

## See Also

- [SCRIPTS.md](SCRIPTS.md) — `scripts/lib/` shared utilities used by hooks
- [SCHEMAS.md](SCHEMAS.md) — `hooks.schema.json` validation rules
- `utils/ECC/hooks/hooks.json` — full hook registry
- `utils/ECC/schemas/hooks.schema.json` — JSON Schema for hook entries
