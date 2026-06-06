# ECC (Everything Claude Code) — Documentation Index

> Version: `2.0.0-rc.1` · Source: `utils/ECC/` · Status: Active

ECC is a cross-harness, production-ready AI engineering toolkit: 250+ skills, 63 agents,
79 commands, 25+ hooks, 18 language rule sets, and 9 harness adapters — all in one composable
library that works with Claude Code, Codex, Cursor, OpenCode, Gemini, and more.

---

## Module Map

| Module | File | Description |
|---|---|---|
| Agents | [AGENTS.md](ECC_AGENTS.md) | 63 specialized subagents delegated by domain |
| Skills | [SKILLS.md](SKILLS.md) | 250 reusable workflow and domain skills |
| Commands | [COMMANDS.md](COMMANDS.md) | 79 legacy slash commands (backward compat) |
| Hooks | [HOOKS.md](HOOKS.md) | 25+ trigger-based session automations |
| Rules | [RULES.md](RULES.md) | 18 language-specific coding rule sets |
| MCP Servers | [MCP.md](MCP.md) | 15+ Model Context Protocol integrations |
| Scripts | [SCRIPTS.md](SCRIPTS.md) | 152 Node.js CLI utilities (`scripts/`) |
| Harness Adapters | [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) | 9 cross-harness adapter configurations |
| ECC 2.0 (Rust) | [ECC2.md](ECC2.md) | Rust control plane — session daemon, TUI, worktrees |
| Python LLM Layer | [LLM_LAYER.md](LLM_LAYER.md) | Provider-agnostic LLM abstraction (`src/`) |
| JSON Schemas | [SCHEMAS.md](SCHEMAS.md) | Validation schemas for hooks, manifests, configs |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) | Cross-module dependency map and design principles |

---

## Repository Layout

```
utils/ECC/
├── agents/              # 63 subagent definitions (Markdown + YAML frontmatter)
├── skills/              # 250 domain skills (skills/<name>/SKILL.md)
├── commands/            # 79 legacy slash commands
├── hooks/               # hooks.json registry + memory-persistence/
├── rules/               # 18 language rule sets (common/, python/, rust/, ...)
├── mcp-configs/         # mcp-servers.json — 15+ MCP server definitions
├── scripts/             # 152 Node.js utilities
│   └── lib/             # 60 shared utility modules
├── schemas/             # JSON schemas (hooks, manifests, configs, state-store)
├── src/                 # Python LLM abstraction layer
│   └── llm/             # core/, providers/, prompt/, tools/, cli/
├── ecc2/                # Rust control plane (ALPHA)
│   └── src/             # session/, tui/, daemon/, observability/, comms/
├── contexts/            # dev.md, review.md, research.md
├── docs/                # 1,337 extended documentation files
├── tests/               # 138 test files (Node.js + Python)
├── manifests/           # install-components/modules/profiles.json
├── .claude-plugin/      # Claude Code native plugin
├── .codex-plugin/       # Codex plugin
├── .cursor/             # Cursor IDE adapter
├── .opencode/           # OpenCode TypeScript plugin
├── .gemini/             # Gemini adapter
├── .zed/                # Zed editor adapter
├── .qwen/               # Qwen adapter
├── .trae/               # Trae adapter
├── agent.yaml           # Gitagent/harness export manifest
├── package.json         # npm package (`ecc-universal`)
├── install.sh           # POSIX installer
└── install.ps1          # PowerShell installer
```

---

## Quick Statistics

| Category | Count |
|---|---|
| Agents | 63 |
| Skills | 250 |
| Commands (legacy) | 79 |
| Hooks | 25+ |
| Language Rule Sets | 18 |
| MCP Servers | 15+ |
| Scripts (total) | 152 |
| Scripts (lib) | 60 |
| Harness Adapters | 9 |
| Test Files | 138 |
| Python LLM Providers | 4 |
| Rust Modules (ecc2) | 8 |

---

## Installation

```bash
# POSIX
bash <(curl -fsSL https://raw.githubusercontent.com/affaan-m/ECC/main/install.sh)

# PowerShell
irm https://raw.githubusercontent.com/affaan-m/ECC/main/install.ps1 | iex

# npm
npx ecc-universal install
```

---

## See Also

- [ARCHITECTURE.md](ARCHITECTURE.md) — design principles and cross-module dependency graph
- [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) — per-harness integration guides
- `utils/ECC/README.md` — upstream project README (1,764 lines)
- `utils/ECC/RULES.md` — upstream project operating rules
- `utils/ECC/SOUL.md` — project philosophy and values
