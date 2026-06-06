# ECC 2.0 — Rust Control Plane

> Source: `utils/ECC/ecc2/` · Language: Rust · Status: **ALPHA (not GA)**
> Stack: Tokio async · rusqlite · ratatui · git2 · crossterm

ECC 2.0 is a Rust-native multi-session operator surface — a background daemon plus TUI dashboard
that manages concurrent Claude Code sessions across git worktrees. It replaces the ad-hoc shell
scripts used for session orchestration in ECC 1.x with a type-safe, persistent control plane.

> **Alpha note:** The codebase is buildable and functional for development use but is not yet
> recommended for production workflows. Breaking changes may occur before GA.

---

## Architecture

```
ecc2/
└── src/
    ├── main.rs          # CLI entry point and command dispatch
    ├── session/         # Session lifecycle management
    │   ├── daemon.rs    # Background daemon process
    │   ├── manager.rs   # Session orchestration (start/stop/resume)
    │   ├── store.rs     # SQLite-backed session state store
    │   ├── output.rs    # Session output capture and streaming
    │   └── runtime.rs   # Runtime execution context
    ├── tui/             # Terminal UI (ratatui)
    │   ├── app.rs       # Application state machine
    │   ├── dashboard.rs # Multi-session dashboard layout
    │   └── widgets.rs   # Reusable TUI widget components
    ├── worktree/        # Git worktree management (git2)
    ├── comms/           # IPC — inter-process communication
    ├── config/          # Configuration loading and validation
    ├── observability/   # Metrics, structured logging
    └── notifications.rs # System notifications
```

---

## Module Reference

### `session/` — Session Lifecycle

The core subsystem. Manages the full lifecycle of Claude Code sessions.

| File | Responsibility |
|---|---|
| `daemon.rs` | Spawns and monitors session processes in the background |
| `manager.rs` | Orchestrates start, stop, pause, resume, and handoff |
| `store.rs` | Persists session state to SQLite (`~/.ecc/sessions.db`) |
| `output.rs` | Captures stdout/stderr from sessions, supports streaming |
| `runtime.rs` | Execution context: env vars, cwd, tool permissions |

**Session state machine:**

```
Created → Running → Paused ↔ Running → Stopped
                                    ↓
                               Completed
```

**SQLite schema (simplified):**

```sql
CREATE TABLE sessions (
  id        TEXT PRIMARY KEY,
  worktree  TEXT,
  status    TEXT,         -- created|running|paused|stopped|completed
  cost_usd  REAL,
  tokens    INTEGER,
  created_at TEXT,
  updated_at TEXT
);
```

---

### `tui/` — Terminal Dashboard

A `ratatui`-powered TUI for monitoring and controlling concurrent sessions.

| File | Responsibility |
|---|---|
| `app.rs` | Application state (selected session, input mode, focus) |
| `dashboard.rs` | Layout: session list panel + detail panel + status bar |
| `widgets.rs` | `SessionListWidget`, `CostWidget`, `TokenWidget`, `LogWidget` |

**Dashboard layout:**

```
┌─────────────────────────────────────────────────────┐
│ ECC 2.0 Dashboard                        v2.0.0-rc.1 │
├──────────────┬──────────────────────────────────────┤
│ Sessions     │ Session Detail                        │
│ ─────────    │ ───────────────                       │
│ ● feat/auth  │ Worktree: .worktrees/feat-auth        │
│ ○ fix/perf   │ Status:   Running                     │
│ ○ docs/api   │ Cost:     $0.042                      │
│              │ Tokens:   12,450                      │
│              │ Output:   [last 20 lines...]           │
├──────────────┴──────────────────────────────────────┤
│ [q]Quit [s]Stop [p]Pause [r]Resume [n]New  [$]Cost  │
└─────────────────────────────────────────────────────┘
```

---

### `worktree/` — Git Worktree Management

Wraps `git2` to create, list, and remove git worktrees, then binds each worktree to a session.

Key operations:
- `create_worktree(branch)` → creates `.worktrees/<branch>` and returns path.
- `list_worktrees()` → returns all active worktrees with their session binding.
- `remove_worktree(path)` → removes after confirming session is stopped.

---

### `comms/` — IPC

Inter-process communication between the daemon and CLI commands / TUI:

- Unix socket (POSIX) or named pipe (Windows) at `~/.ecc/daemon.sock`.
- JSON-framed messages: `{"type": "start", "session_id": "..."}`.
- The TUI connects to the daemon socket and receives live state updates.

---

### `observability/` — Metrics & Logging

- Structured JSON logging via `tracing` + `tracing-subscriber`.
- Per-session metrics: token counts, cost in USD, tool-call histogram.
- Metrics exported to `~/.ecc/metrics/` as JSONL files (one per session).

---

### `config/` — Configuration

Reads `~/.ecc/config.toml`:

```toml
[daemon]
socket_path = "~/.ecc/daemon.sock"
log_level = "info"

[sessions]
max_concurrent = 8
default_model = "claude-sonnet-4-6"
auto_pause_on_cost_usd = 5.0

[worktrees]
base_path = ".worktrees"
auto_cleanup = true
```

---

## CLI Commands

Build and run from `utils/ECC/ecc2/`:

```bash
cargo build --release

# Start a new session on a worktree branch
cargo run -- start --branch feat/auth

# Open the TUI dashboard
cargo run -- dashboard

# List all sessions
cargo run -- sessions

# Stop a session
cargo run -- stop <session-id>

# Start the background daemon
cargo run -- daemon start

# Cost report for all sessions today
cargo run -- cost --since today
```

---

## Dependencies (`Cargo.toml`)

| Crate | Purpose |
|---|---|
| `tokio` | Async runtime |
| `rusqlite` | SQLite session store |
| `ratatui` | TUI framework |
| `crossterm` | Cross-platform terminal backend |
| `git2` | Git worktree operations |
| `tracing` | Structured logging |
| `tracing-subscriber` | Log formatting and filtering |
| `serde` + `serde_json` | Serialization |
| `clap` | CLI argument parsing |
| `anyhow` | Error handling |
| `uuid` | Session ID generation |

---

## Relationship to ECC 1.x Scripts

| ECC 1.x (Node.js scripts) | ECC 2.0 (Rust) |
|---|---|
| `orchestrate-worktrees.js` | `worktree/` module |
| `session-inspect.js` | `session/store.rs` + `sessions-cli.rs` |
| `loop-status.js` | `session/manager.rs` |
| `cost-estimate.js` | `observability/` metrics |
| Manual shell hooks | `daemon.rs` lifecycle events |

---

## See Also

- [SCRIPTS.md](SCRIPTS.md) — Node.js session utilities (ECC 1.x equivalents)
- [ARCHITECTURE.md](ARCHITECTURE.md) — ecc2 in the overall dependency graph
- `utils/ECC/ecc2/README.md` — upstream Rust README
- `utils/ECC/ecc2/Cargo.toml` — full dependency list
