---
name: run-project-template
description: "Run, build, test, lint, typecheck, or smoke-test the engineering template project. Use when asked to run, start, verify, validate, or smoke-test this repo."
allowed-tools: [Bash]
---

This is a CLI/library project — no GUI, no server. The interactive surface is the `smoke.mjs` driver, which exercises every runnable CLI in sequence and reports pass/fail with timing.

## Prerequisites

- Node ≥ 20: `node --version`
- Python (Windows): `py --version` — the `python` alias may be missing; `py` is the Windows Launcher
- pyyaml: `py -m pip install pyyaml`

## Build / Install

```bash
npm install
```

No compile step — TypeScript is typecheck-only (`tsc --noEmit`), not emitted.

## Run (agent path) — smoke driver

```bash
node .claude/skills/run-project-template/smoke.mjs
```

Runs all 5 steps in sequence: lint → typecheck → tests → risk-engine → rotatelog.
Output: table with ✅/❌, ms per step, final `N/5 passed`. Exit code 0 = all pass.

Flags:

| Flag | Steps run |
|---|---|
| _(none)_ | all 5 |
| `--tests-only` | lint + typecheck + tests |
| `--risk-only` | risk-engine only |

Single steps without the driver:

```bash
npm run lint
npm run typecheck
npm test
npx vitest run tests/unit/template-exhaustive.test.ts   # exhaustive suite only
py infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60 --output risk_report.md
node scripts/rotatelog.js
```

## Run (human path)

Same commands — no server, no window. Everything is terminal output.

## Gotchas

- `python` is not in PATH on this Windows machine — use `py` (Python Launcher). The smoke driver auto-detects `py` → `python3` → `python` in that order.
- `.claude/` directory must be excluded from ESLint (`ignores` in `eslint.config.js`) — the smoke driver uses Node globals (`process`, `console`) that ESLint flags in strict mode.
- Vitest snapshot file (`tests/unit/__snapshots__/template-exhaustive.test.ts.snap`) must exist before CI runs or the placeholder snapshot test fails. It's committed. If you delete it, run `npx vitest run --update-snapshots` once to regenerate.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `python not found` | Use `py` on Windows |
| `ModuleNotFoundError: No module named 'yaml'` | `py -m pip install pyyaml` |
| `✖ X problems` from ESLint on `.claude/` files | Ensure `.claude/` is in `ignores` in `eslint.config.js` |
| Snapshot mismatch on placeholder test | Run `npx vitest run --update-snapshots` after intentional template changes |
