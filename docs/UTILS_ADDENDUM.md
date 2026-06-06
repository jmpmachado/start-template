# Utilities & External Libraries — Opt-In Addendum

> **This file is NOT part of the base template.** It documents third-party tools that have been
> cloned into `utils/` for deep integration in a specific adoption of this template. Review and
> delete any sections that do not apply to your project before Sprint 1.

---

## How to use this addendum

1. If you adopt an external toolkit into `utils/`, add a section below following the format used here.
2. Register this file itself in `AGENTS.md` only if its contents are relevant to active agents. The
   base template does not register it by default — it is intentionally outside the CI guard scope.
3. Links to `docs/utils/<tool>/` are **not** validated by `tests/unit/documentation.test.ts`. If you
   want CI coverage, extend the test to walk `docs/utils/`.

---

## [TOOL_NAME] — `utils/[TOOL_DIR]/`

> Replace this section with your actual tool. Remove this block if no external tools are integrated.

**What it is:** [One-line description of the toolkit and its purpose.]

**Why it is here:** [Reason for deep integration rather than a standard package dependency.]

**Version:** `[VERSION]`

**Documentation index:** `docs/utils/[tool]/INDEX.md`

| Module | File | Purpose | Load tier |
|--------|------|---------|-----------|
| [Module] | `docs/utils/[tool]/[FILE].md` | [Description] | Core / Profile / Optional |

**Adoption notes:**
- [Any project-specific configuration or activation steps.]
- [Known conflicts or caveats with the base template.]

---

## Maintenance

- Keep version fields current when the tool is updated.
- Run a manual link check against `docs/utils/` before each release: the CI guard does not cover this path.
- If the tool is removed, delete its section here and remove any related files under `docs/utils/` and `utils/`.
