# Gap Audit Report — Engineering Template

**Audit date:** 2026-05-23  
**Files read:** 67/67 (all mandatory files)  
**Auditor:** Junie (Claude)  
**Scope:** Definitive gap audit of the language-agnostic engineering template.

---

## Methodology

All 67 files listed in the audit mandate were read in full. Gaps already tracked in the backlog (US-1.x through US-4.x) were excluded. Only **new** gaps not covered by any existing backlog item are reported below.

---

## Gaps Found (sorted by severity descending)

| ID | Severity | Category | File + Section | Gap Description | Crack-in-wall? | Fix |
|:---|:---|:---|:---|:---|:---|:---|
| G-001 | High | D | `AGENTS.md` → §4 Governance, `COMPLIANCE_MAPPING.md` entry | AGENTS.md describes `COMPLIANCE_MAPPING.md` as "Regulatory compliance catalog (GDPR/HIPAA/SOC2) mapped to architecture controls" but the actual file contains "Pillars → Metrics → SLOs" and source verification — no GDPR/HIPAA/SOC2 content at all. Agents relying on the index description will expect regulatory content that doesn't exist. | Yes | Update AGENTS.md description to match actual content: "Pillars → Metrics → SLOs map and source audit." |
| G-002 | High | D | `copilot-instructions.md` | Missing two of five required coverage areas per `AGENT_CONTRACT_GUIDE.md` §4: (1) no error/edge-case handling rule, (2) no formal `See Also` section linking related contract files. CLAUDE.md has both; copilot-instructions.md does not. | Yes | Add `## Error Handling` rule (e.g., "On ambiguity or failure, halt and surface uncertainty") and `## See Also` section linking `AGENTS.md`, `CLAUDE.md`, `AGENT_HANDOFF.md`. |
| G-003 | High | A | `ARCHITECTURE_VALIDATION.md` → Phase 4 | Phases 1–3 each have an explicit **exit criterion** (line 5 states "No phase advances without the previous criterion met"), but Phase 4 (Operational Review) has no exit criterion — only an "Objective." This breaks the sequential gate model. | Yes | Add `**Exit criterion:** all items checked or with documented justification; operations runbook verified in staging.` after the Phase 4 Objective line. |
| G-004 | Medium | D | `README.md` step 8 vs `CLAUDE.md` "Adopting" section | README.md has 9 adoption steps (step 8 = "Record adoption in DECISION_LOG.md", step 9 = "Score architecture"). CLAUDE.md has only 7 steps and omits step 8 entirely. Adopters following CLAUDE.md will skip the decision log entry. | Yes | Add step 7.5 to CLAUDE.md Adopting section: "Record adoption decision in `DECISION_LOG.md`." |
| G-005 | Medium | D | `GOVERNANCE.md` §VI Scoring Rubrics | Only 3 of 12 scoring dimensions have rubrics (Security, Rollback, Team Maturity). The remaining 9 (Completeness, Testability, Observability, Ownership, Technical complexity, Critical deps, Change scope, Tech novelty, Failure history, Requirement ambiguity, Deadline pressure) have no rubric, making scoring subjective and inconsistent across evaluators. | Yes | Add rubric tables for all 9 missing dimensions following the same 0–3/4–6/7–8/9–10 format. |
| G-006 | Medium | CI | `security.yml` | Workflow runs on `push` to `main/master/develop` AND `pull_request` to same branches, but unlike `ci.yml` it has no Node version matrix — it hardcodes Node 20. If a security issue is Node-version-specific, it will be missed on Node 22. | No | Add `strategy.matrix.node-version: [20.x, 22.x]` to match `ci.yml`, or (per US-3.16) deduplicate entirely. |
| G-007 | Medium | D | `CODE_REVIEW_GUIDE.md` §3 vs §9 | §3 uses prefix `[blocker]` for merge-blocking comments, but §9 uses `[blocking]` for the same concept. Inconsistent terminology will confuse reviewers. | No | Standardize on one term — replace `[blocking]` in §9 line 185 with `[blocker]`. |
| G-008 | Medium | D | `PULL_REQUEST_TEMPLATE.md` line 84 vs `CODE_REVIEW_GUIDE.md` §8 | PR template says "hard ceiling 400 LoC" but CODE_REVIEW_GUIDE §8 shows 401–800 as "Acceptable if single concern" and only blocks at >800 (XL). The "hard ceiling" claim contradicts the actual size policy. | Yes | Change PR template line 84 to: "target < 200 LoC; see `CODE_REVIEW_GUIDE.md` §8 for size classes." |
| G-009 | Medium | D | `CONTRIBUTING.md` §3 vs `PULL_REQUEST_TEMPLATE.md` | CONTRIBUTING.md §3 provides its own inline PR description template (lines 79–101) that differs from `.github/PULL_REQUEST_TEMPLATE.md`. Two competing templates cause confusion about which to follow. | Yes | Remove the inline template from CONTRIBUTING.md §3 and replace with: "Use the PR template at `.github/PULL_REQUEST_TEMPLATE.md`." |
| G-010 | Medium | R | `risk_engine.py` `load_rfcs()` | `yaml.safe_load()` on untrusted YAML without a file size check allows a YAML bomb (billion laughs via anchors/aliases) to exhaust memory on the CI runner. `safe_load` prevents code execution but not memory exhaustion. | Yes | Add `if os.path.getsize(f) > 256 * 1024: continue` before `yaml.safe_load()`. |
| G-011 | Low | D | `ONBOARDING.md` §6 | Lists `npm run test:unit` as a command, but `package.json` has no `test:unit` script — only `test`, `test:watch`, and `test:coverage`. Engineers will get "missing script" errors. | No | Either add `"test:unit": "vitest run"` to package.json or replace the reference with the actual command `npm test`. |
| G-012 | Low | D | `ONBOARDING.md` §6 | Lists `npm run test:integration` as a command, but `package.json` has no `test:integration` script. (US-3.6 adds the vitest project config but does not mention adding the npm script.) | No | Ensure US-3.6 acceptance criteria include adding `"test:integration"` to `package.json`. |
| G-013 | Low | D | `.env.example` line 31 | Secret generation command uses CommonJS `require('crypto')` but `package.json` has `"type": "module"`, so running `node -e "..."` in the project directory will fail with `ERR_REQUIRE_ESM`. | No | Replace with: `node -e "import('crypto').then(c=>console.log(c.randomBytes(32).toString('hex')))"` or use `--input-type=module`. |
| G-014 | Low | D | `CHANGELOG.md` [Unreleased] entries | CHANGELOG rules comment (line 57) says "Use the imperative mood: 'Add', not 'Added'", but all entries under `### Added` and `### Fixed` use past tense ("added", "corrected", "removed", "upgraded"). The entries follow Keep a Changelog convention (which uses past tense under category headers), creating a contradiction with the local rule. | No | Clarify rule: "Imperative mood applies to commit messages; CHANGELOG entries under KaC headers use past tense per KaC convention." |
| G-015 | Very Low | D | `CONTRIBUTING.md` §6 line 167 | States "Finding a new antipattern? → Add it to `PATTERNS.md`" — but antipatterns should go to `ANTIPATTERNS.md`, not `PATTERNS.md`. `PATTERNS.md` is for validated positive patterns. | No | Change to: "Finding a new antipattern? → Add it to `ANTIPATTERNS.md`." |

---

## Summary Statistics

| Severity | Count |
|:---|:---:|
| Critical | 0 |
| High | 3 |
| Medium | 7 |
| Low | 3 |
| Very Low | 2 |
| **Total** | **15** |

| Category | Count |
|:---|:---:|
| D (Documentation) | 12 |
| A (Architecture) | 1 |
| CI (CI/CD) | 1 |
| R (Reliability) | 1 |

---

## Crack-in-wall Items (compound silently): 6 of 15

- **G-001** — Index/content mismatch (agents get wrong expectations)
- **G-002** — Incomplete agent contract (copilot diverges from standard)
- **G-003** — Missing gate (Phase 4 can be skipped without justification)
- **G-005** — Subjective scoring (9 dimensions without rubric)
- **G-008** — Conflicting size limits (PR template vs review guide)
- **G-010** — YAML bomb (memory exhaustion on CI runner)

---

## Cross-reference with Existing Backlog

| Gap | Related Backlog Item | Status |
|:---|:---|:---|
| G-004 | Partially related to US-5.12 (README step 8 rewrite) | G-004 covers the CLAUDE.md side; US-5.12 covers README.md side |
| G-005 | Related to US-COH-7 (GOVERNANCE.md rubrics) | US-COH-7 is "Could Have" — G-005 re-flags at Medium as crack-in-wall |
| G-008 | Related to US-5.6 (PR size single source of truth) | US-5.6 covers the fix; G-008 documents the specific contradiction |
| G-010 | Related to US-5.4 (risk_engine.py file size limit) | US-5.4 covers the fix; G-010 was not in the exclusion list |
| G-011 | Related to US-3.6 (vitest integration project) | US-3.6 adds config but doesn't add npm script |
| G-013 | Related to US-6.15 (.env.example ESM syntax) | US-6.15 covers the fix |

---

## Backlog Items Created

The following new user stories were added to `BACKLOG.md` Sprint 07 to track gaps not already covered:

- **US-7.1** ← G-001 (AGENTS.md / COMPLIANCE_MAPPING.md description mismatch)
- **US-7.2** ← G-002 (copilot-instructions.md missing error handling + See Also)
- **US-7.3** ← G-003 (ARCHITECTURE_VALIDATION.md Phase 4 missing exit criterion)
- **US-7.4** ← G-004 (CLAUDE.md missing adoption step for DECISION_LOG)
- **US-7.5** ← G-005 (GOVERNANCE.md 9 missing scoring rubrics)
- **US-7.6** ← G-006 (security.yml missing Node version matrix)
- **US-7.7** ← G-007 (CODE_REVIEW_GUIDE.md blocker vs blocking terminology)
- **US-7.8** ← G-008 (PR template vs CODE_REVIEW_GUIDE size conflict)
- **US-7.9** ← G-009 (CONTRIBUTING.md duplicate PR template)
- **US-7.10** ← G-010 (risk_engine.py YAML bomb protection)
- **US-7.11** ← G-011 (ONBOARDING.md test:unit script missing)
- **US-7.12** ← G-012 (ONBOARDING.md test:integration script missing)
- **US-7.13** ← G-014 (CHANGELOG.md imperative mood contradiction)
- **US-7.14** ← G-015 (CONTRIBUTING.md antipattern → wrong file)

> **Note:** G-013 (`.env.example` ESM syntax) is already covered by US-6.15 and was not duplicated.

---

*Generated by Junie — 2026-05-23 10:14 UTC-3*
