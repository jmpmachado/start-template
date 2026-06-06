# Changelog — start-project

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Changes staged for the next release. Move to a versioned section on release.
> Cut a release when this section exceeds 10 entries.

### Added (Could Have — US-COH-6, US-COH-11)

- `rfcs/RFC-042.yaml` — complete RFC example (async job queuing engine) corresponding to `.agent/context/DESIGN_DOC_EXAMPLE.md`; governance/complexity/probability scored; inline formula reference (US-COH-6)
- `.agent/context/GLOSSARY.md` — JWA, JWE, JWS definitions added in alphabetical order before JWT in the Security section (US-COH-11)

### Changed (Could Have — US-COH-10, US-COH-12, US-COH-13, US-COH-14)

- `.agent/context/COMPLIANCE_MAPPING.md` — "Required LGTM" replaced with "Required explicit approval" (US-COH-10)
- `.agent/context/DISASTER_RECOVERY.md §2` — WAL lag caveat added after RTO/RPO definitions: streaming replica RPO assumes lag < target; validate under peak load (US-COH-13)
- `.agent/context/SUPPLY_CHAIN.md §5` — Renovate update cadence now specifies "(UTC schedule window)" (US-COH-14)
- `.agent/context/NOTEBOOK_GUIDE.md` — `.pre-commit-config.yaml` starter block for nbstripout already present (US-COH-12 pre-done)

### Added (Could Have — US-COH-3, US-COH-5, US-COH-8)

- `infra/Dockerfile.template` — multi-stage Dockerfile template for Node.js, Python, and Go; two stages (`builder` + `runtime`); all values as `node-ts`/`[PORT]`/`[ENTRYPOINT]` placeholders; header states "THIS IS A TEMPLATE — not a runnable Dockerfile" (US-COH-3)
- `infra/scripts/.python-version` — canonical Python version pin (`3.12`); referenced in `risk-check.yml` comment and `LANGUAGE_TOOLCHAINS.md` (US-COH-5)

### Changed (Could Have — US-COH-3, US-COH-5, US-COH-8)

- `eslint.config.js` — k6 scripts removed from global `ignores`; added `infra/scripts/k6/**/*.js` override with full k6 globals (`__ENV`, `__ITER`, `__VU`, `open`, `http`, `check`, `sleep`, `group`, `fail`, `Rate`, `Counter`, `Gauge`, `Trend`); k6 files are now linted with correct globals (US-COH-8)
- `.github/workflows/risk-check.yml` — comment added on `python-version` field referencing `infra/scripts/.python-version` as canonical pin (US-COH-5)
- `.agent/context/LANGUAGE_TOOLCHAINS.md` — Python section: note added that `.python-version` is the canonical version pin (US-COH-5)
- `.agent/context/RUNTIME_MODELS.md` — Python runtime notes section added (consistent with Kotlin/Zig/CUDA pattern already present) (US-COH-5)

### Added (Sprint 16 — Open Debt Closure)

- `scripts/validate-template.ps1` — local integrity validation script: AGENTS.md bidirectional consistency check, placeholder advisory, `npm test` gate; colored PASS/FAIL output; exit 0 only when all pass
- `ONBOARDING.md §6` — Integration Test Bootstrap section with `docker compose -f infra/docker-compose.yml up -d`, DATABASE_URL/REDIS_URL env vars, and `npm run test:integration` run instructions
- `E2E_TESTING.md` — `## Python` section (pytest-playwright, pyproject.toml config, test_auth.py example, CI snippet); `## Java` section (JUnit 5 + playwright-java, Maven+Gradle dep, CI snippet); `## .NET` section (Microsoft.Playwright.NUnit, NUnit spec, `pwsh playwright.ps1 install chromium` CI step)
- `GOVERNANCE.md §VI` — complete scoring rubrics for 11 fields previously without rubric: Completeness, Testability, Observability, Ownership (governance layer); Technical Complexity, Critical Dependencies, Change Scope, Tech Novelty (complexity layer); Failure History, Requirement Ambiguity, Deadline Pressure (probability layer)
- `DISASTER_RECOVERY.md §13` — printed copy location placeholder, last-printed date field, quarterly review cadence instruction

### Changed (Sprint 16 — Open Debt Closure)

- `CLAUDE.md`, `.github/copilot-instructions.md`, `.agent/context/AGENT_HANDOFF.md` — concrete `npm run lint && npm run typecheck && npm test` command replaced with `[PRE_COMMIT_GATE]` placeholder; note "replace with your stack's lint/typecheck/test commands" for language-agnostic adoption
- `.agent/context/API_CONTRACT.md §4` — token TTL values replaced with "See `SECURITY.md §3` for canonical TTL policy" (single source of truth)
- `.agent/context/COMPLIANCE_TESTING.md §3.1` — test layer table filled with concrete tools: Vitest/pytest/cargo test/JUnit 5/dotnet test (unit), Supertest+Testcontainers/WebApplicationFactory (integration), Playwright all stacks (E2E), OWASP ZAP/cargo-fuzz/Hypothesis (security)
- `.agent/context/UI_DESIGN_GUIDE.md` — renamed from `MATERIAL_DESIGN_GUIDE.md` via `git mv`; AGENTS.md entry updated with new path and improved description
- `infra/scripts/risk_engine.py` — `--output` and `--rfcs-path` path traversal guards: both arguments validated against `Path.cwd().resolve()`; `sys.exit(2)` on escape attempt

### Added (Sprint 15 — Remaining Debt Payoff)

- `INCIDENT_RUNBOOK.md` — Discord/Teams alternative for incident channel (`#incident-YYYY-MM-DD-slug`, equivalent Discord/Teams channel); `OWNERS` reference for security contact; PagerDuty acknowledgment as first step in §5 Resolve
- `.github/copilot-instructions.md` — `## Error Handling` and `## See Also` sections per `AGENT_CONTRACT_GUIDE.md §4`
- `security.yml` — Node.js version matrix (`20.x`, `22.x`) aligned with `ci.yml`
- `CONTRIBUTING.md §6` — RFC naming convention (`RFC-NNN.yaml` or `RFC-NNN-slug.yaml`) documented; numeric prefix mandatory, slug optional

### Changed (Sprint 15 — Remaining Debt Payoff)

- `CODE_REVIEW_GUIDE.md` — `[blocking]` → `[blocker]` (terminology consistency across all review comment types)
- `CI_CD.md §6` and `ONBOARDING.md §5` — commit type list replaced with reference to `CONTRIBUTING.md §2` (single source of truth)
- `DEPENDENCY_POLICY.md §1` and `SUPPLY_CHAIN.md §1` — freshness thresholds aligned: review trigger = last release > 12 months; removal candidate = no release > 24 months
- `.env.example` — `RATE_LIMIT_AUTH_MAX=5` added (auth endpoints, see `THREAT_MODEL.md §3.1`); secret generation command updated to ESM-compatible syntax; publishing guard note added
- `LOAD_TESTING_FRAMEWORK.md` — `BASE_URL` environment variable example added; all `TARGET_URL` references replaced with `BASE_URL` (aligned with `E2E_TESTING.md` convention)

### Added (Sprint 11 — SDL, Traffic Shedding & Operational Tenets)

- `SECURITY.md` — Microsoft SDL phase mapping to sprint ceremonies; banned functions/APIs table
- `OBSERVABILITY.md` — Engineering System Health section with 5 KPIs (build break rate, test reliability, PR cycle time P90, MTTM, pipeline P95)
- `GOVERNANCE.md` — Operational Tenets section (§VII): tenet template, 7 baseline tenets T-01–T-07, review cadence, exception process
- `LOAD_TESTING_FRAMEWORK.md` — Traffic Shedding and Graceful Degradation Levels section (L0–L6, dual-signal triggers, shed order)
- `RUNTIME_MODELS.md` — Distributed Consistency Models section (CAP, consistency spectrum, saga/outbox/TCC patterns, conflict resolution, selection checklist)

### Added (Sprint 10 — Scale, Privacy & Experimentation)

- `.agent/context/EXPERIMENTATION.md` — A/B testing lifecycle, MDE formula, guardrail metrics, holdout group policy, anti-patterns
- `.agent/context/DATA_PRIVACY.md` — PII classification (Class 1–5), retention schedule, right-to-erasure, k-anonymity, differential privacy, privacy review gate
- `.agent/context/CAPACITY_PLANNING.md` — baseline traffic model, growth models, resource estimation formula, pre-peak stress-test checklist (T-30 to T+1)
- `OBSERVABILITY.md` — Engineering Efficiency Metrics section (5 KPIs) and Toil Budget Policy (≤20% target, mandatory RFC trigger)
- `LOAD_TESTING_FRAMEWORK.md` — Continuous Chaos FIT model section (blast radius graduation, FIT experiment YAML template, pipeline integration)
- `DEFINITION_OF_DONE.md` — Accessibility gate §5 (axe-core, WCAG 2.1 AA, keyboard navigation, color contrast ≥4.5:1)
- `SUPPLY_CHAIN.md` — Immutable Infrastructure Policy §10 (5 principles, enforcement gate table, exceptions process)
- `CI_CD.md` — Deployment Patterns §7b (canary, blue-green, rolling — guard conditions, rollback times, selection guide)

### Added (Sprint 09 — Customer Outcome First + Feature Delivery Contracts)

- `DESIGN_DOC_GUIDE.md` — Working Backwards section (PR-FAQ format: press release + 5 customer FAQs + 5 internal FAQs)
- `.agent/context/PRODUCTION_READINESS_REVIEW.md` — 6-section PRR checklist before any service goes to production
- `.agent/context/FEATURE_FLAGS.md` — flag taxonomy (release/ops/experiment/permission), dark launch pattern, kill switch design, flag lifecycle, anti-patterns
- `API_CONTRACT.md` — Versioning and Deprecation Policy (additive-only, 6-month deprecation notice, Sunset header RFC 8594)
- `INCIDENT_RUNBOOK.md` — Correction of Errors (COE) section distinguishing systemic failures from standard postmortem
- `DEFINITION_OF_DONE.md` — Production Readiness gate for PRs adding or modifying public endpoints

### Added (Sprints 00–08 baseline)

- `CLAUDE.md` — Claude Code runtime contract (verbosity, guard rules, commands, architecture overview)
- `.github/copilot-instructions.md` — GitHub Copilot runtime contract mirroring `CLAUDE.md`
- `.agent/context/AGENT_HANDOFF.md` — Cross-agent and cross-session context transfer protocol
- `ONBOARDING.md` reading order updated to include `CLAUDE.md`, `copilot-instructions.md`, and `AGENT_HANDOFF.md`
- `OWNERS` entries for `ci.yml` and `risk-check.yml` workflows
- `DECISION_LOG.md` entries DL-001 and DL-002 — template adoption and CLAUDE.md/AGENTS.md separation rationale
- `BACKLOG.md` — Sprint 01–03 with mission-critical gap user stories
- `@vitest/coverage-v8` added to `devDependencies` (required for `npm run test:coverage`)

### Fixed (Sprints 00–08 baseline)

- `ci.yml` — `npm run lint` step was missing; now runs lint → typecheck → test in order
- `risk-check.yml` — upgraded `actions/checkout` from `@v4` to `@v5` (version consistency with other workflows)
- `CLAUDE.md` — corrected false claim that `ci.yml` did not exist
- `.github/PULL_REQUEST_TEMPLATE.md` — removed false claim about automated PR-lint workflow
- `.agent/context/LOAD_TESTING_FRAMEWORK.md` — removed platform-specific IP management instructions (violated template neutrality); replaced with generic target URL guidance
- `DEFINITION_OF_DONE.md` — added AGENT_HANDOFF gate for multi-agent work sessions
- `README.md` — added step 8 (record adoption in DECISION_LOG.md)

---

## [x.y.z] — YYYY-MM-DD

### Added

- [Example: `POST /auth/refresh` endpoint for JWT token renewal]

### Fixed

- [Example: ownership check missing on `DELETE /resources/:id` (CWE-284)]

### Security

- [Example: upgraded `[library]` from 1.2.3 to 1.2.4 — CVE-XXXX-XXXXX]

---

<!-- CHANGELOG RULES

1. Every PR that changes observable behavior must include a CHANGELOG entry.
2. Security fixes always go under "Security" even if they are also "Fixed".
3. CHANGELOG entries use past tense under their KaC section headers ("Added", "Fixed" — this is Keep a Changelog convention). Commit messages use imperative mood — that is a separate rule.
4. Reference issue or PR numbers where helpful: "Fix IDOR in resource deletion (#42)".
5. Do not document internal refactors unless they affect the public API or behavior.
6. "Unreleased" is always present at the top — cut a release when it exceeds 10 entries.

RELEASE PROCESS

1. Rename [Unreleased] to [x.y.z] — YYYY-MM-DD
2. Add a new empty [Unreleased] section at the top
3. Tag the commit: git tag -a vx.y.z -m "Release x.y.z"
4. Push the tag: git push origin vx.y.z

VERSION BUMP RULES (Semantic Versioning)

- MAJOR (x.0.0): breaking change to public API or behavior
- MINOR (x.y.0): new feature, backwards compatible
- PATCH (x.y.z): bug fix or security patch, backwards compatible

-->
