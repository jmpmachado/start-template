# Decision Log — start-project

> Lightweight ADR log for day-to-day decisions that do not warrant a full RFC.
> Use a full RFC (`rfcs/`) when the decision involves cross-team impact, significant
> architectural change, or requires formal review. Use this log for everything else.
>
> **Rule:** If a decision took more than 30 minutes to reach, it belongs here.
> Append — never edit past entries. Mark superseded decisions explicitly.

---

## Format

```markdown
### DL-NNN — [Short decision title]

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by DL-NNN | Reverted
**Participants:** @handle1, @handle2
**Context:** One paragraph. What situation forced this decision? What constraints applied?
**Decision:** One sentence. What was decided?
**Rationale:** Why this option over alternatives? What trade-offs were accepted?
**Consequences:** What changes as a result? What becomes harder or easier?
**Review date:** YYYY-MM-DD (optional — set when the decision has a known expiry)
```

---

## Log

### DL-001 — Adopted Engineering Template v1.0 as AI-assisted project baseline

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado (engineer), Claude Code (claude-sonnet-4-6), Codex, Copilot, Antigravit
**Context:** Projects operated by multiple AI agents (Claude Code, Codex, Copilot, Antigravit) + one human engineer require a shared governance baseline. Without it, each agent session reinvents conventions, misses security checks, and leaves no audit trail. A mission-critical evaluation of the template identified 8 gaps; 5 were resolved in Sprint 00.
**Decision:** Adopt this engineering template as the mandatory baseline for all new projects in this workspace. `CLAUDE.md`, `AGENTS.md`, and `AGENT_HANDOFF.md` are the three entry points for any AI agent starting a session.
**Rationale:** The guard rule (AGENTS.md ↔ disk bidirectional check in CI) is the single most valuable mechanism — it prevents silent knowledge-base drift. The RFC risk engine provides automated quality gates. Trade-off: higher onboarding overhead (~30 min to understand the full context map vs. starting from scratch).
**Consequences:** Every new `.agent/context/` file requires an AGENTS.md entry in the same commit. All PRs follow the Definition of Done in `DEFINITION_OF_DONE.md`. Agent sessions must produce a handoff document per `AGENT_HANDOFF.md` when switching agents or resetting context.

---

### DL-002 — Split runtime contracts: CLAUDE.md per-vendor, AGENTS.md vendor-neutral

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Analysis in `AGENT_PROMPT_ADEQUACY.md` found that mixing vendor-specific runtime rules (token budgets, tool-use syntax, retry policy) with the knowledge-base index violates the template's language-agnostic neutrality and breaks the guard test's single responsibility.
**Decision:** `AGENTS.md` remains the vendor-neutral KB index. Each agent gets its own runtime contract file: `CLAUDE.md` (root), `.github/copilot-instructions.md`, and `GEMINI.md` (when Gemini CLI is adopted). These files live outside `.agent/context/` and do not trigger the guard test.
**Rationale:** Separation of concerns: index vs. behavior contract. Allows each agent to have different verbosity, retry, and tool-use policies without polluting the shared knowledge base.
**Consequences:** `GEMINI.md` must be created before any Gemini CLI session is started on a project. Agent-specific files are excluded from the AGENTS.md guard by design — document this in each agent file.

---

### DL-003 — Working Backwards as mandatory product development entry point

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Design docs historically started from a technical solution, making it difficult to evaluate customer impact. Sprint 09 introduced a Working Backwards section to `DESIGN_DOC_GUIDE.md` (PR-FAQ format: press release + customer FAQs + internal FAQs) as a pre-condition for the technical sections.
**Decision:** Working Backwards (PR-FAQ) is mandatory before writing any technical RFC section. The press release is the first artifact — not the architecture diagram.
**Rationale:** Forces problem-first thinking. Reviewers can evaluate customer value before assessing technical correctness. Trade-off: +30–60 min per RFC for the PR-FAQ section.
**Consequences:** `rfcs/TEMPLATE.yaml` and `DESIGN_DOC_GUIDE.md` updated. Agents must prompt authors to complete the PR-FAQ before any technical sections in design doc reviews.

---

### DL-004 — Production Readiness Review (PRR) gate before any public endpoint goes live

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Services were going to production without explicitly verifying SLOs, runbooks, alerts, and rollback procedures. Sprint 09 introduced `PRODUCTION_READINESS_REVIEW.md` and a DoD gate requiring PRR for any PR that adds or modifies a public endpoint.
**Decision:** Any PR adding or modifying a public endpoint, external integration, or background job must pass the PRR checklist before merge approval.
**Rationale:** PRR catches the most expensive class of production incidents — "works in staging, broken in production" — before they reach users. Trade-off: extra review step (~1 hour per launch).
**Consequences:** `DEFINITION_OF_DONE.md §3` updated with the PRR gate. `ARCHITECTURE_VALIDATION.md Phase 4` references `CAPACITY_PLANNING.md §5`.

---

### DL-005 — Feature flag taxonomy: 4-type model (release / ops / experiment / permission)

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Teams used feature flags inconsistently — some as permanent ops toggles, some as temporary release gates, some as A/B experiment assignments. This created permanent flags accumulating as technical debt.
**Decision:** All feature flags must be classified into one of four types at creation: release (temporary, retire after full rollout), ops (permanent kill switch), experiment (tied to a DECISION_LOG experiment entry, retire after conclusion), permission (permanent per-user entitlement).
**Rationale:** Type determines lifecycle. Release and experiment flags without a retirement date are a DoD violation. Ops and permission flags are permanent by design and exempt from retirement pressure.
**Consequences:** `FEATURE_FLAGS.md` documents the taxonomy, lifecycle rules, and anti-patterns. Flag type must appear in the flag name or metadata.

---

### DL-006 — API versioning: additive-only within version, 6-month deprecation notice

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Breaking API changes were made without a defined sunset process, causing client breakage. Sprint 09 added a versioning and deprecation policy to `API_CONTRACT.md`.
**Decision:** Within a major version, only additive changes (new fields, new endpoints) are permitted. Any breaking change requires a new major version. Deprecated endpoints must carry a `Sunset` header (RFC 8594) with ≥ 6 months notice before removal.
**Rationale:** Additive-only changes allow clients to remain on the current version without code changes. The 6-month window gives client teams enough time to migrate.
**Consequences:** `API_CONTRACT.md §Versioning` updated. Migration guide required before sunset date. CI lint rule to verify `Sunset` header on deprecated endpoints is a future enforcement gap.

---

### DL-007 — Correction of Errors (COE) for systemic failures; standard postmortem for isolated incidents

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** All incidents used the same postmortem format regardless of severity. Systemic failures (P0, recurrence within 90 days, data loss) require deeper root-cause work (5-why chain, mechanism fix) than isolated incidents.
**Decision:** Incidents that are P0, recur within 90 days, or involve data loss trigger a COE process in addition to the standard postmortem. The COE requires a 5-why root-cause chain and a mechanism fix — not a process fix.
**Rationale:** Process fixes address symptoms; mechanism fixes address root causes. COE bar-raiser sign-off ensures the fix is at the right level of abstraction.
**Consequences:** `INCIDENT_RUNBOOK.md §COE` added. Service owners are accountable for both the postmortem (isolated) and the COE (systemic) — not a centralized SRE team.

---

### DL-008 — Immutable infrastructure: build once, promote through environments without mutation

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Production servers were occasionally patched in-place, causing configuration drift and making rollback unreliable. Sprint 10 added the Immutable Infrastructure Policy to `SUPPLY_CHAIN.md §10`.
**Decision:** Every production artifact is a versioned, immutable image built in CI, signed, and promoted through staging → canary → production without rebuilding or patching. No SSH to production instances for configuration changes.
**Rationale:** Eliminates configuration drift. Makes rollback a one-command image swap. Enforces that the artifact passing staging tests is exactly the artifact in production.
**Consequences:** `SUPPLY_CHAIN.md §10` documents 5 core principles and enforcement gates. Sole exception: declared SEV-1 mitigation, followed within 24h by a PR codifying the fix.

---

### DL-009 — Accessibility gate (WCAG 2.1 AA) mandatory for all UI changes

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** UI features were shipped without any accessibility verification. Sprint 10 added an accessibility gate to `DEFINITION_OF_DONE.md §5`.
**Decision:** All UI changes must pass axe-core automated scanning (zero critical violations), keyboard navigation test, and WCAG 2.1 AA color contrast check (≥ 4.5:1) before merge approval.
**Rationale:** Accessible UI is a legal requirement in most jurisdictions and a quality signal for all users, not just those with disabilities. Automated scanning catches ≈ 30–40% of issues at zero extra cost once wired into CI.
**Consequences:** `DEFINITION_OF_DONE.md §5` added. axe-core added to `TECH_RADAR.md` as ADOPT. Non-UI PRs must mark the gate N/A explicitly.

---

### DL-010 — 7 baseline operational tenets for all service teams

**Date:** 2026-05-23
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code
**Context:** Trade-off decisions during incidents and feature development were made inconsistently because teams lacked non-negotiable guiding principles. Sprint 11 added `GOVERNANCE.md §VII Operational Tenets`.
**Decision:** All service teams adopt the 7 baseline tenets (T-01–T-07) as non-negotiable defaults. Teams may add service-specific tenets; they may not remove or weaken baseline tenets without a DECISION_LOG entry and tech-lead approval.
**Rationale:** Tenets resolve common trade-offs (deploy safety, alert quality, on-call self-sufficiency, data deletion policy) without requiring escalation to management. Specific, testable, owned tenets prevent drift into aspirational values.
**Consequences:** `GOVERNANCE.md §VII` documents tenets T-01–T-07, tenet template, review cadence (monthly/quarterly/post-incident), and exception process via ADR.

---

<!-- Append new entries below this line. Do not edit entries above.
     IDs are sequential and unique — never reuse a DL-NNN number. -->

### DL-012 — `moduleResolution: NodeNext` retained in tooling/tsconfig.json (US-COH-9 / US-COH-17)

**Date:** 2026-05-25
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** US-COH-9 proposed changing `moduleResolution` from `Bundler` to `NodeNext`. US-COH-17 requested a risk assessment before acting. Investigation revealed that `NodeNext` was already applied (not `Bundler`) — the template's `tooling/tsconfig.json` had been set to `module: NodeNext, moduleResolution: NodeNext` in a prior sprint. TypeScript 5.9.3 with `NodeNext` resolution is confirmed compatible with the Vitest test suite (17/17 pass). No extensionless relative imports were found in `tests/` or `scripts/` that would break under `NodeNext`. The one relative import found (`scripts/init-agile.js` importing `'./lib/agile-config.js'`) already uses the `.js` extension — correct for `NodeNext`.
**Decision:** Retain `moduleResolution: NodeNext`. Close US-COH-9 as Won't Change (already implemented). Close US-COH-17 as Done.
**Rationale:** NodeNext is the correct resolution for Node.js ESM projects. The breaking-change risk (extensionless imports) does not apply here — no such imports exist. Keeping `Bundler` would have been the incorrect choice for a Node.js-targeted tooling layer.
**Consequences:** US-COH-9 closed. Template child projects that inherit this tsconfig must use `.js` extensions on relative imports — document in `USER_GUIDE.md` if a child project encounters issues.

### DL-013 — B2 pure (Python standalone wizard) selected as canonical branch; B1 hybrid dropped

**Date:** 2026-05-27
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** Two experimental branches (`feat/cookiecutter-b1-hybrid` and `feat/cookiecutter-b2-pure`) were developed in parallel to evaluate adoption wizard strategies. B1 used a hybrid Node.js + cookiecutter approach (`init-agile.js`); B2 used a standalone Python wizard (`wizard.py`) with no cookiecutter dependency. Both reached functional parity but B2 accumulated a more complete test suite (84 Python tests, zero external runtime dependency at adoption time) and had all falsify findings resolved through a full CI-Hygiene sprint (CI-01..CI-05 + M2). B1 had 6 open hotfixes (HF-01..HF-06) and a higher dependency surface.
**Decision:** Adopt `feat/cookiecutter-b2-pure` as the canonical branch. B1 (`feat/cookiecutter-b1-hybrid`) is dropped — no merge to master, branch to be archived.
**Rationale:** (1) Python wizard requires only `python3 + pyyaml` — already required for `risk_engine.py`; no new toolchain. (2) B2 had zero open 🔴 findings at decision point; B1 had HF-01..HF-06 unresolved. (3) Standalone mode eliminates the cookiecutter engine as a runtime dependency — child projects are not forced to install it. (4) 84 unit tests on wizard.py provide falsification coverage for all edge cases identified in full-falsify audit 2026-05-27. Trade-off: B1's Node.js wizard (`init-agile.js`) had richer interactive UX (inline capacity calculator, sprint phase gates) — deferred to a future US if needed.
**Consequences:** B1 branch frozen. `master` will receive B2 changes via PR from `feat/cookiecutter-b2-pure`. `profiles.yaml` (founder/team/public) is the canonical profile taxonomy. `cookiecutter.json` remains as optional seed only.

---

### DL-011 — Move Node.js tooling layer to `tooling/` subdirectory

**Date:** 2026-05-25
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** The template claims to be language-agnostic, but `package.json`, `eslint.config.js`, `vitest.config.ts`, and `tsconfig.json` lived at the repository root — making Node.js a visible first-class concern even for non-Node child projects. Sprint 23 US-V2-28 proposed relocating these to a `tooling/` subdirectory to reflect the template's actual model: Node.js is a _tooling runtime_ (CI, lint, wizard scripts), not a project dependency. A test branch (`feat/us-v2-28-tooling-dir`) was used to validate before merging.
**Decision:** Relocate `package.json`, `eslint.config.js`, `vitest.config.ts`, and `tsconfig.json` to `tooling/`. Keep a root shim `package.json` that delegates all scripts via `npm --prefix tooling`. Update all CI workflows to use `working-directory: tooling`.
**Rationale:** (1) Language-agnostic claim becomes credible — a Python or Go child project no longer sees Node artifacts at root. (2) Root shim preserves the `npm test` / `npm run lint` UX from root — zero friction for existing users. (3) All six CI workflows updated atomically in the same PR; gate passed (lint ✅ typecheck ✅ 17/17 ✅) before merge. Alternatives considered: (a) leave at root — rejected, contradicts the language-agnostic claim; (b) delete Node tooling entirely — rejected, CI guard test (`documentation.test.ts`) requires Node/Vitest.
**Consequences:** `cd tooling && npm install` is now the canonical install path. `npm test` still works from root via the shim. Child projects that copied root config files must move them to `tooling/` on their next template upgrade (see `USER_GUIDE.md §11.5`). CI cache paths updated to `tooling/package-lock.json`. `TOOLING_RUNTIME.md` remains the authoritative rationale for Node-as-tooling vs application-runtime distinction.

### DL-014 — Accept esbuild moderate advisory (GHSA-67mh-4wv8-2f99) in vitest devDependency

**Date:** 2026-05-28
**Status:** Accepted — risk accepted. ⚠️ Annotation 2026-05-29: vitest@4.1.7 (US-VITEST-01) did NOT resolve this advisory — esbuild ≤0.24.2 chain persists in vitest@4.x. Commit `c2ee9bb` claim of "0 vulns" was incorrect; `npm audit` still reports 5 moderate. See DL-019.
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** `npm audit` reports 5 moderate severity findings, all tracing to a single root: `esbuild ≤ 0.24.2` (`GHSA-67mh-4wv8-2f99` — dev server allows cross-origin requests). The chain is `esbuild → vite → vite-node → vitest → @vitest/coverage-v8`. Fix requires `npm audit fix --force` which installs vitest@4.x — a breaking major-version upgrade. All 5 findings are in `devDependencies`; esbuild's dev server is not started during `vitest run` (test runner mode) and is not exposed in CI or production builds.
**Decision:** Accept the moderate risk and defer the vitest@4.x upgrade. Block if any finding reaches high or critical. `security.yml` already enforces `--audit-level=high`, which does not trigger on this advisory.
**Rationale:** (1) Attack vector requires a running esbuild dev server — not applicable in CI `vitest run` usage. (2) vitest@4.x is a breaking change that requires validation against the full test suite (44 JS + 121 py indirect). (3) Risk is dev-only with no production or CI exposure. (4) Deferred upgrade is the standard practice for breaking-change dependency bumps (see `DEPENDENCY_POLICY.md §3`).
**Consequences:** `npm audit --audit-level=moderate` will continue to exit 1 in local runs. `security.yml` CI gate (`--audit-level=high`) is not affected. Revisit when vitest@4.x LTS stabilises or if advisory is upgraded to high/critical.

---

### DL-015 — Upgrade minimum Node.js to 24 (Active LTS); drop Node 22 from CI matrix; close US-DH-03

**Date:** 2026-05-28
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** Node.js 22 entered Maintenance LTS on 2026-10-28 (12 months after release). The template's `engines.node` was `>=22.0.0` and `ci.yml` tested on `[22.x, 24.x]`. The drift check (check 1) emitted a 🔵 low finding on every scan. US-DH-04 proposed upgrading to Node 24 Active LTS. Separately, US-DH-03 proposed adding a path filter to `pr-lint.yml` `node-version-check` job — investigation revealed that GitHub Actions does not support per-job path filters without an external action (`dorny/paths-filter`); the 30s overhead does not justify the dependency, so US-DH-03 is closed as Won't Do.
**Decision:** Set `engines.node` to `>=24.0.0` in `tooling/package.json`; update `ci.yml` matrix to `[24.x]`; document US-DH-03 as Won't Do in `pr-lint.yml` comment and BACKLOG.
**Rationale:** (1) Node 24 is Active LTS until 2028-04-30 — template should track the active support window. (2) Removing Node 22 from the matrix reduces CI minutes by 50% per run with no loss of coverage. (3) `@types/node@22` (installed in US-CI-04) remains compatible with Node 24 — no type breakage. (4) US-DH-03 path-filter approach requires `dorny/paths-filter` — new external action dependency for a 30s saving on warning-only job is not justified.
**Consequences:** Projects adopting this template must run Node ≥ 24. The `pr-lint.yml` EOL check will no longer flag Node 22 (it is removed from `engines.node`). `check-drift.js` will emit 0 Node-related findings. US-DH-03 closed as Won't Do.

---

### DL-016 — `src/` is intentionally empty in the template

**Date:** 2026-05-28
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** `src/` contains only `.gitkeep`. Multiple context docs (ONBOARDING.md, ARCHITECTURE.md, CONTRIBUTING.md) describe a 4-layer architecture (`domain/`, `application/`, `infrastructure/`, `interface/`). No previous DL recorded the decision to keep `src/` empty. Agents attempting to implement tasks have tried to populate `src/` without authorisation.
**Decision:** `src/` remains empty (`.gitkeep` only) in the template. The 4-layer architecture described in docs is the target structure for child projects, not for the template itself. Agents must not populate `src/` without explicit human authorisation.
**Rationale:** The template's value is the governance/tooling framework, not application code. Child projects copy the template and fill `src/` according to their domain. Pre-populating `src/` would pollute every adoption with placeholder code that must be deleted.
**Consequences:** `tsc --noEmit` compiles zero source files from `src/` — this is expected. Coverage thresholds in `vitest.config.ts` will report 0% until a child project adds real code.

---

### DL-018 — Revert engines.node to >=22; supersedes DL-015

**Date:** 2026-05-29
**Status:** Accepted — Supersedes DL-015
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** DL-015 upgraded `engines.node` to `>=24.0.0` and CI to `[24.x]`. The local runtime in use is Node 22.22.3 (LTS). Running `npm ci` emitted an `EBADENGINE` warning on every install. A falsify audit (2026-05-29) identified the engine declaration as inconsistent with the actual runtime and all ONBOARDING/CI documentation that referred to Node 22. The template's own CI would fail `npm install` on most developer machines still on Node 22.
**Decision:** Set `engines.node` to `>=22.0.0` in `package.json` and `tooling/package.json`; update all workflow `node-version` references from `24` to `22`. The `check-drift.js` Node-EOL check will emit a 🔵 low finding — this is expected and acceptable.
**Rationale:** Node 22 is Maintenance LTS until 2027-04-30 — still supported and receiving security patches. Requiring Node 24 before team machines are upgraded creates friction for zero safety gain. The low finding from `check-drift` is the correct signal: plan upgrade to 24 within 12 months, but do not block development today.
**Consequences:** `npm ci` runs cleanly on Node 22. `check-drift.js` emits one 🔵 low finding (Node 22 Maintenance LTS) — expected per DL-018, not a regression. Upgrade to Node 24 when it becomes the team's baseline; at that point DL-018 can be superseded.
**Review date:** 2027-01-01

---

### DL-017 — Deprecate Node.js wizard (`scripts/init-agile.js`) in favour of Python wizard (`infra/scripts/wizard.py`)

**Date:** 2026-05-28
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** DL-013 (2026-05-27) selected the Python standalone wizard (`infra/scripts/wizard.py`) as canonical. However, `scripts/init-agile.js` remained as an active entry point via `npm run init-agile`. Adoptants running `npm run init-agile` would invoke the Node wizard instead of the canonical Python one — silently contradicting DL-013.
**Decision:** `npm run init-agile` now prints a deprecation notice and directs users to `python infra/scripts/wizard.py`. The Node wizard file is retained for reference but not invoked. `init-agile:win` and `init-agile:unix` variants also updated.
**Rationale:** Single entry point reduces confusion. Python wizard has 84 tests; Node wizard has none. DL-013 is the authoritative choice.
**Consequences:** `npm run init-agile` no longer runs the Node wizard silently. Users are directed to `python infra/scripts/wizard.py`. The `.js` file is kept for historical reference; it can be deleted in a future cleanup sprint once all adopters have migrated.

---

### DL-019 — vitest@4.1.7 does not resolve GHSA-67mh-4wv8-2f99; advisory remains open

**Date:** 2026-05-29
**Status:** Resolved — 0 vulnerabilities confirmed 2026-05-29. ⚠️ Correction: initial DL-019 entry stated "npm audit still reports 5 moderate" — a subsequent audit after `npm ci` confirmed `found 0 vulnerabilities`. The advisory was resolved in vitest@4.1.7 (esbuild patched internally). DL-014 risk acceptance is therefore closed.
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** US-VITEST-01 (commit `c2ee9bb`) upgraded vitest from 1.6 to 4.1.7. The initial post-upgrade audit (before `npm ci`) showed 5 moderate findings due to stale node_modules. After `npm ci` the audit reports 0 vulnerabilities — the advisory is resolved.
**Decision:** Close DL-014 risk acceptance — advisory resolved. DL-019 status is Resolved.
**Rationale:** `npm audit` after clean install returns 0. The 5-finding report was an artefact of stale node_modules, not a real advisory persistence. Commit `c2ee9bb` claim of "0 vulnerabilities" was correct after all.
**Consequences:** `npm audit --audit-level=moderate` exits 0 on clean install. No deferred action required. DL-014 can be considered closed.

---

### DL-020 — Upgrade engines.node to >=24.0.0; move Node 22 to EOL list; supersedes DL-018

**Date:** 2026-05-29
**Status:** Accepted — supersedes DL-018
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** DL-018 set `engines.node >=22.0.0` because the local runtime was Node 22.22.3 and DL-015's jump to 24 caused EBADENGINE warnings. Node 24 is now the Active LTS (2026–2028). The local runtime has been confirmed as Node 22 but DL-018 had a review date of 2027-01-01 — however the falsify audit cycle confirmed all CI and tooling work correctly on Node 22 and the template's own `check-drift.js` flags Node 22 as Maintenance LTS on every run, creating noise. The right moment to upgrade is now, before Sprint QX-7 closes.
**Decision:** Set `engines.node` to `>=24.0.0` in `package.json` and `tooling/package.json`; update all workflow `node-version` references to `24`; move `'22'` from `NODE_MAINTENANCE` to `NODE_EOL` in `check-drift.js` and set `NODE_MAINTENANCE = ['24']`.
**Rationale:** Node 24 Active LTS until 2028-04-30. Eliminates the recurring 🔵 low finding from `check-drift`. DL-018's rationale (EBADENGINE friction) is no longer blocking — engineers can upgrade their local Node without losing anything. The template should lead, not lag.
**Consequences:** `check-drift` 0 Node-related findings. Projects adopting this template should run Node ≥ 24. The `pr-lint.yml` EOL check will flag Node 22 as EOL for child projects still on it.

---

### DL-022 — Promote DATA_MODEL and RUNBOOK to Core tier; accept Core budget debt

**Date:** 2026-06-01
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** Falsify audit (2026-06-01) found that `profiles.yaml` `founder.note` lists DATA_MODEL and RUNBOOK as minimum required for agents ("without these the agent cannot navigate the codebase") but both were tagged `[Profile]` in AGENTS.md, causing agents to treat them as conditional. RUNBOOK.md was never in `founder.optional` (it was always kept for solo founders), but its `[Profile]` tag in AGENTS.md incorrectly signalled it as optional context.
**Decision:** (1) Promote DATA_MODEL.md and RUNBOOK.md from `[Profile]` to `[Core]` in AGENTS.md. (2) Add explicit comment in `profiles.yaml` founder.optional confirming RUNBOOK.md is intentionally kept for solo founders. (3) Update `core/INDEX.md` count from 18 to 20. (4) Accept Core tier budget overflow: 20 files vs. the Solo/CLI budget of ≤ 12 documented in GOVERNANCE.md §VII.
**Rationale:** Tag accuracy is an agent-correctness issue — an agent that deprioritises DATA_MODEL or RUNBOOK for founder projects will produce incomplete or incorrect output. The budget violation is a known limitation of the current flat Core tier model; module-level budgets (US-COH-5) are the correct long-term resolution.
**Consequences:** Core tier grows from 18 to 20 files. founder.optional count unchanged at 18 (RUNBOOK was never in the optional list). GOVERNANCE.md §VII Solo/CLI budget (≤ 12) is now visibly violated — documented in core/INDEX.md as accepted debt pending US-COH-5.

### DL-023 — GOVERNANCE.md rubrics verified complete; G-005 closed as false positive

**Date:** 2026-06-01
**Status:** Accepted — closes G-005 (AUDIT_REPORT_2026-05-23)
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** Falsify audit (2026-06-01) re-examined GOVERNANCE.md to verify G-005 (prior audit finding: "8 of 11 scoring dimensions lack 0–10 rubrics"). Direct read of GOVERNANCE.md lines 120–220 found all 14 scoring dimensions (Layer 1: 6, Layer 2: 4, Layer 3: 4) already have complete 0–10 rubric tables. G-005 was based on a stale count from before Sprint QX rubric work.
**Decision:** Close G-005 as resolved. No changes to GOVERNANCE.md required.
**Rationale:** Acting on a false positive would add duplicate rubrics, inflate GOVERNANCE.md by ~80 lines, and introduce inconsistency.
**Consequences:** None — GOVERNANCE.md unchanged.

### DL-021 — Add MIGRATION_GUIDE.md and upgrade check-drift wizard detection

**Date:** 2026-05-30
**Status:** Accepted
**Participants:** @jmpmachado, Claude Code (claude-sonnet-4-6)
**Context:** Falsify audit (2026-05-30) identified that the template lacked an explicit migration guide for projects adopting from a proto-version with divergent git history. `check-drift` reported `[CONFIGURE]` placeholder findings as `medium` even when the wizard had never been run (≥ 10 placeholders), making the signal too weak to trigger action. `START_HERE.md §3` also had a stale test count (75 instead of 121).
**Decision:** (1) Create `MIGRATION_GUIDE.md` with §A (clean adoption) and §B (proto-version migration with divergent git history). (2) Upgrade `check-drift.js checkAgileConfigFilled()` to emit `high` severity when ≥ 10 `[CONFIGURE]` placeholders are present (wizard never ran), `medium` for 1–9 (partial fill). (3) Fix `START_HERE.md §3` test count to 121. (4) Fix `EXAMPLE_PROJECT.md` template version `0.1.0` → `v1.0.0`. Register `MIGRATION_GUIDE.md` in `AGENTS.md`.
**Rationale:** Proto-version migration is the most complex adoption scenario and had no documented path. The `high`/`medium` distinction makes `check-drift` actionable — a `high` finding blocks adoption gates; a `medium` is a reminder. Test count accuracy is required for onboarding trust.
**Consequences:** `check-drift` now emits `high` for un-wizarded repos (breaking change for CI gates that treat high as blocking). `MIGRATION_GUIDE.md` is the canonical reference for all non-zero adoption scenarios.
