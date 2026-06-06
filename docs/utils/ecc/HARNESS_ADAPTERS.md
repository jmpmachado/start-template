# ECC — Harness Adapters Module

> Source: `utils/ECC/.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.opencode/`, `.gemini/`, `.zed/`, `.qwen/`, `.trae/`, `.github/`
> Count: 9 adapters · Architecture: Source in `agents/`, `skills/`, `rules/`; harness-specific at edges

ECC follows a **source-once, adapt-many** architecture. Core content (agents, skills, rules) lives
in harness-agnostic directories. Each adapter directory contains thin translation layers that expose
ECC capabilities in the native format required by that harness.

---

## Adapter Overview

| Harness | Directory | Format | Support Level |
|---|---|---|---|
| Claude Code | `.claude-plugin/` | Native plugin (`plugin.json`) | Full |
| Codex | `.codex-plugin/` + `.codex/` | Plugin (`plugin.json`) + `AGENTS.md` | Full |
| OpenCode | `.opencode/` | TypeScript plugin + `opencode.json` | Full |
| Cursor | `.cursor/` | Rules + hooks + skills directories | Full |
| GitHub Copilot | `.github/` | `copilot-instructions.md` | Compatible |
| Gemini | `.gemini/` | Instruction-based markdown | Compatible |
| Zed | `.zed/` | Settings + context files | Compatible |
| Qwen | `.qwen/` | Qwen-adapted config | Compatible |
| Trae | `.trae/` | Trae-specific config | Compatible |

---

## Claude Code Adapter (`.claude-plugin/`)

**Status: Full support — native plugin format**

Files:
- `plugin.json` — plugin manifest (name, version, entry, permissions)
- `marketplace.json` — Claude Code Marketplace listing metadata
- `README.md` — plugin description for marketplace display

Plugin manifest excerpt:

```jsonc
{
  "name": "ecc-universal",
  "version": "2.0.0-rc.1",
  "description": "Everything Claude Code — 250 skills, 63 agents, 25+ hooks",
  "entry": "../agent.yaml",
  "permissions": ["read", "write", "bash", "mcp"]
}
```

Claude Code also reads:
- `.claude/rules/` — project-scoped rules (override ECC defaults)
- `.claude/ecc-tools.json` — tool capability declarations
- `.mcp.json` — MCP server activation

---

## Codex Adapter (`.codex-plugin/` + `.codex/`)

**Status: Full support**

Files:
- `.codex-plugin/plugin.json` — plugin manifest for Codex marketplace
- `.codex-plugin/config.toml` — TOML configuration for Codex harness
- `.codex/AGENTS.md` — Codex-format agent index (mirrors `agents/` catalog)
- `.codex/skills/` — Codex-adapted skill wrappers

Codex reads `AGENTS.md` as its primary configuration surface. The adapter auto-generates
Codex-compatible frontmatter from ECC's native agent format.

---

## OpenCode Adapter (`.opencode/`)

**Status: Full support — TypeScript plugin**

Files:
- `opencode.json` — OpenCode project configuration
- `package.json` — npm package for TypeScript compilation
- `tsconfig.json` — TypeScript compiler config
- `agents/` — OpenCode-format agent definitions
- `commands/` — OpenCode command files
- `instructions/` — System instruction overrides

OpenCode is the only adapter with a TypeScript compilation step. The plugin is built with
`tsc` and registered in `opencode.json`.

---

## Cursor Adapter (`.cursor/`)

**Status: Full support**

Files:
- `rules/` — Cursor-native rule files (adapted from `rules/`)
- `skills/` — Cursor-adapted skill definitions
- `hooks.json` — Cursor hook registry (subset of ECC hooks)
- `hooks/` — Cursor hook implementations

Cursor applies rules globally via `.cursor/rules/` and resolves skills from `.cursor/skills/`.
Hooks in Cursor run via the `hooks.json` side-car mechanism.

---

## GitHub Copilot Adapter (`.github/`)

**Status: Compatible — instruction-based**

File: `.github/copilot-instructions.md`

Contains a distilled subset of ECC rules and workflow patterns formatted for GitHub Copilot's
system prompt injection. No skill or agent delegation — Copilot doesn't support those primitives.

---

## Gemini Adapter (`.gemini/`)

**Status: Compatible — instruction-based**

Contains Gemini-formatted instruction files. ECC rules and key skill summaries are adapted
to Gemini's prompt format. No native plugin protocol.

---

## Zed Adapter (`.zed/`)

**Status: Compatible — settings-based**

Contains Zed editor settings files that activate ECC context files and rules via Zed's
assistant configuration system.

---

## Qwen and Trae Adapters

**Status: Compatible — config-based**

`.qwen/` and `.trae/` contain vendor-specific configuration adapting ECC rules and
context for those respective harnesses.

---

## Adapter Architecture Diagram

```
agents/   skills/   rules/   hooks/   mcp-configs/
    │         │        │        │           │
    └─────────┴────────┴────────┴───────────┘
                       │
              agent.yaml (source manifest)
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
  .claude-plugin/  .codex-plugin/   .opencode/
  (native plugin)  (plugin+AGENTS)  (TS plugin)
        │              │                  │
  .cursor/        .github/          .gemini/
  (rules+hooks)   (instructions)    (instructions)
        │
  .zed/ .qwen/ .trae/
  (settings/config)
```

---

## Cross-Harness Rule: Source Truth in ECC

**Never edit agent, skill, or rule content inside adapter directories directly.**
All content changes must be made in the source directories (`agents/`, `skills/`, `rules/`),
then propagated to adapters via:

```bash
node scripts/ecc.js sync-adapters
```

This maintains consistency and prevents adapter drift.

---

## Adding a New Harness Adapter

1. Create `.<harness>/` directory at ECC root.
2. Implement the harness-native format (consult harness documentation).
3. Add a sync template in `scripts/lib/harness-sync-<harness>.js`.
4. Add compliance validation in `scripts/lib/harness-adapter-compliance.js`.
5. Run `node scripts/harness-audit.js` to validate.
6. Document the new adapter in this file and [INDEX.md](INDEX.md).

---

## See Also

- [AGENTS.md](ECC_AGENTS.md) — source agent definitions
- [SKILLS.md](SKILLS.md) — source skill definitions
- [RULES.md](RULES.md) — source rule sets
- [SCRIPTS.md](SCRIPTS.md) — `harness-audit.js` and `harness-adapter-compliance.js`
