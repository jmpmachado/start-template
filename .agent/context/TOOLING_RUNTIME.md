# Tooling Runtime vs Project Runtime

> This file clarifies the distinction between the **tooling runtime** (Node.js — used to run
> wizard, lint, and CI scripts) and the **project runtime** (whatever language the child project
> is written in). Node.js is NOT a project dependency unless the child project is a Node.js app.

---

## The Distinction

| Layer | What it is | Required by |
| :--- | :--- | :--- |
| **Tooling runtime** | Node.js ≥ 22 | ESLint, Vitest, markdownlint-cli2, local template verification scripts |
| **Project runtime** | Python / Go / Rust / Java / .NET / etc. | The child project's actual application code |

The template ships Node.js tooling because it is the most portable scripting runtime for cross-platform CI. It does **not** imply that the child project must use Node.js or TypeScript.

---

## What Node.js Is Used For in This Template

- `scripts/check-drift.js` — template drift detection
- `scripts/rotatelog.js` — token log rotation
- `eslint` + `typescript-eslint` — lint of template's own governance scripts
- `vitest` — documentation integrity tests (`tests/unit/documentation.test.ts`)
- `markdownlint-cli2` — markdown lint (`npm run lint:md`)

None of these tools touch the child project's application code.

---

## What Node.js Is NOT Used For

- Running the child project's application
- Building or testing the child project's application
- Any language-specific toolchain (Python, Go, Rust, Java, etc.)

---

## Non-Node Project Adoption Path

If the child project does not use Node.js:

1. Run the canonical adoption wizard: `python3 infra/scripts/wizard.py`
2. Node.js tooling is only needed for:
   - CI documentation integrity test (runs in GitHub Actions — no local Node required)
   - `npm run lint:md` (optional — Markdown lint)
3. Set `TOOLING_NODE=false` in `CONFIGURE.md` (Sprint 23) to make Node opt-in in CI.

---

## CONFIGURE.md Flag (Sprint 23)

When Sprint 23 lands, `CONFIGURE.md` will expose:

```yaml
TOOLING_NODE: true   # set to false for non-Node projects to skip Node CI lane
```

Until then, Node ≥ 22 is required for the full CI matrix.

---

## See Also

- `ADOPTION_GUIDE.md` — per-profile required vs optional files
- `infra/scripts/wizard.py` — adoption wizard
- `infra/scripts/install_check.py` — dependency validator (Sprint 23)
- `.agent/context/LANGUAGE_TOOLCHAINS.md` — per-language build/test toolchain reference
