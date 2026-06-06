# Project Playbook — Engineering Template

> **What this is:** An index pointing to the canonical sources for adopting this template.
> Follow phases in order. The full step-by-step content lives in the documents linked below.

---

## Phase 0 — Prerequisites

**Goal:** Verify environment and establish the repository.

- **Tool requirements:** [ONBOARDING.md §1](ONBOARDING.md) — Node.js v24+, Git 2.40+, Python 3.10+
- **Wizard:** `python3 infra/scripts/wizard.py` — fills all `[PLACEHOLDER]` values
- **First run check:** `npm test` + `npm run test:python` must both pass

---

## Phase 1 — Configuration

**Goal:** Select your project profile and activate the right CI lanes.

- **Profile selection:** [CONFIGURE.md](CONFIGURE.md) — lean / standard / enterprise
- **CI lane activation:** Set `PROJECT_STACK` in `CONFIGURE.md` (`node` / `python` / `go` / `rust`)
- **Environment variables:** Copy `.env.example` → `.env` and fill required values

---

## Phase 2 — Sprint 00

**Goal:** Record the adoption decision and write your first sprint.

- **Decision log:** Add entry to `.agent/context/DECISION_LOG.md` (next available DL-NNN)
- **Backlog:** [.agent/context/BACKLOG.md](.agent/context/BACKLOG.md) — Sprint 00, ≤ 3 USs (lean) or ≤ 5 USs (standard)
- **Agile guide:** [.agent/context/AGILE_GUIDE.md](.agent/context/AGILE_GUIDE.md) §I

---

## Phase 3 — First Feature

**Goal:** Implement Sprint 00 and validate the DORA baseline.

- **Contribution rules:** [CONTRIBUTING.md](CONTRIBUTING.md) — branch, commit, PR, review
- **Definition of Done:** [.agent/context/DEFINITION_OF_DONE.md](.agent/context/DEFINITION_OF_DONE.md)
- **Architecture scoring:** [.agent/context/ARCHITECTURE_SCORING_PLAYBOOK.md](.agent/context/ARCHITECTURE_SCORING_PLAYBOOK.md) — score before Sprint 1

---

## Phase 4 — Ongoing Governance

**Goal:** Keep the template healthy across sprints.

- **Drift detection:** `npm run check-drift` — run before every sprint planning
- **Knowledge base:** [AGENTS.md](AGENTS.md) — register every new `.agent/context/` file in the same commit
- **Security:** [.agent/context/SECURITY.md](.agent/context/SECURITY.md) — review threat model each quarter
- **Risk scoring:** `npm run check-drift` covers RFC risk; `risk-check.yml` runs on every RFC push

---

## Phase 5 — Upgrade

**Goal:** Pull template updates into child projects.

- **Protocol:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md) — review breaking changes before upgrade
- **Backlog health:** `BACKLOG.md` ≤ 150 lines before upgrade; move completed sprint rows to a project-local archive outside `.agent/context/`

---

> Full onboarding: [ONBOARDING.md](ONBOARDING.md) · Contribution: [CONTRIBUTING.md](CONTRIBUTING.md) · Agent contracts: [AGENTS.md](AGENTS.md)
