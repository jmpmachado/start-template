# CONFIGURE.md — Project Configuration Flags

> Fill this file when adopting the template. Flags control which tooling layers are active.

## TOOLING_NODE

Controls whether Node.js tooling (lint, typecheck, test, wizard) is required.

| Value | Meaning |
| :--- | :--- |
| `TOOLING_NODE=true` | Node ≥ 24 required. Run `npm install && npm test` as pre-commit gate. |
| `TOOLING_NODE=false` | Node tooling skipped. Wizard runs `pytest tests/unit/` as CI gate. CI skips Node lint/typecheck/test matrix. |

**Default:** `true` (assumed when this file is absent or flag is unset).

```env
TOOLING_NODE=true
```

## How install_check.py uses this flag

`infra/scripts/install_check.py` reads this file at runtime:

- If `TOOLING_NODE=true` (or file absent): checks Node ≥ 24 and reports install command per OS.
- If `TOOLING_NODE=false`: skips Node check entirely.

## CI_PROFILE

Controls which CI lanes are active.

| Value | Active lanes |
| :--- | :--- |
| `CI_PROFILE=full` | All 11 workflows (default) |
| `CI_PROFILE=core` | Copy only `ci.yml` + `docs-integrity.yml` for a minimal gate |

Active workflows when `CI_PROFILE=full`:

| Workflow | Purpose |
| :--- | :--- |
| `ci.yml` | Lint + typecheck + test (Node 24) |
| `ci-matrix.yml` | Routes to .NET CI based on PROJECT_STACK |
| `ci-dotnet.yml` | .NET lane (restore + build + test) |
| `docs-integrity.yml` | AGENTS.md bidirectional guard + markdown lint |
| `lint-all.yml` | lint + typecheck + lint:md on push/PR |
| `security.yml` | npm audit + NuGet audit |
| `risk-check.yml` | RFC YAML risk scoring (blocks merge if score ≥ 60) |
| `pr-lint.yml` | Placeholder detection + Node EOL check (warning only) |
| `template-drift.yml` | Weekly health scan — Node EOL, placeholders, backlog |

**Default:** `full`.

```env
CI_PROFILE=full
```

Child projects that want minimal CI: copy only `ci.yml` and `docs-integrity.yml`.

## PROJECT_STACK

Controls which per-language CI workflow is activated by `ci-matrix.yml`.

| Value | CI workflow triggered | Description |
| :--- | :--- | :--- |
| `PROJECT_STACK=dotnet` | `ci-dotnet.yml` (default) | Builds and tests the C#/.NET backend project |
| `PROJECT_STACK=none` | No per-language CI | Runs only the Node.js tooling/governance CI |

**Default:** `dotnet` (assumed when absent or unset).

```env
PROJECT_STACK=dotnet
```

## Other flags (add as needed)

| Flag | Default | Description |
| :--- | :--- | :--- |
| `TOOLING_NODE` | `true` | Node.js tooling required (see above) |
| `CI_PROFILE` | `full` | CI lanes active (see above) |
| `PROJECT_STACK` | `dotnet` | Per-language CI lane (see above) |
