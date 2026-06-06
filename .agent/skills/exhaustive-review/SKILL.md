---
name: exhaustive-review
description: "Run exhaustive template validation with high effort: full test suite, RFC schema check, placeholder audit, blockquote structure, agent rule coherence, and risk scoring. Use when asked for a deep review, audit, or high-effort validation of the template."
allowed-tools: [Bash, Read, Grep, Glob]
effort: high
---

Run a full exhaustive audit of the engineering template. Cover every automated check AND manual cross-checks that the test suite cannot enforce.

## Step 1 — Automated gate

```bash
npm run lint && npm run typecheck && npm test
```

Report: total tests, any failures. Stop here if anything fails — fix before continuing.

## Step 2 — RFC risk scoring

```bash
py infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60 --output risk_report.md
```

Read `risk_report.md` and report: each RFC's total score and whether it would block merge (score ≥ 60).

## Step 3 — Snapshot baseline check

```bash
npx vitest run tests/unit/template-exhaustive.test.ts
```

Open `tests/unit/__snapshots__/template-exhaustive.test.ts.snap` and report the current placeholder count. Flag if the count increased since the last known baseline.

## Step 4 — Manual cross-checks (high-effort only)

Perform these checks that no automated test covers:

1. **AGENTS.md completeness** — every file in `.agent/context/` is listed; no stale entries point to deleted files. Read AGENTS.md and cross-reference with `Glob('.agent/context/**/*.md')`.

2. **RFC id sequence** — no gaps or duplicates in `RFC-NNN` ids across `rfcs/`. List all ids in order.

3. **CLAUDE.md / GEMINI.md drift** — the 6 operating rules must be identical in wording (not just present). Diff the "Agent Operating Rules" section between both files if GEMINI.md exists.

4. **Broken external links** — scan `.agent/context/*.md` for `https?://` URLs and flag any that look stale (404-prone patterns: old GitHub branch URLs, versioned docs with hardcoded version numbers).

5. **Placeholder hotspots** — for each file where the snapshot test recorded unfilled placeholders, list the exact lines so a human can decide: intentional template slot, or forgotten fill.

6. **CI workflow consistency** — confirm `ci.yml`, `docs-integrity.yml`, `security.yml`, `risk-check.yml`, `pr-lint.yml` all exist and their Node matrix versions match.

## Step 5 — Summary report

Output a structured report:

```
## Exhaustive Review — <ISO date>

### Automated (tests)
- X/Y tests passed
- Lint: PASS/FAIL
- Typecheck: PASS/FAIL

### RFC Risk
- RFC-NNN: score X — PASS/BLOCK

### Manual Checks
- AGENTS.md: X files registered, Y orphans, Z stale entries
- RFC ids: [list]
- CLAUDE.md/GEMINI.md drift: NONE / [diff summary]
- Placeholder hotspots: [file: line]
- CI workflows: [present/missing per file]

### Verdict
CLEAN / NEEDS ATTENTION — [one line]
```
