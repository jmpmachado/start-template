# Engineering Template

A language-agnostic, framework-agnostic engineering framework based on
Design-First, SRE, and Scale Engineering principles.

Use this directory as the starting point for any new project or module.

---

## Framework Structure

### 1. Governance and Design ([.agent/context/](.agent/context/))

| File                               | Purpose                                                                               |
| :--------------------------------- | :------------------------------------------------------------------------------------ |
| `AGENTS.md`                        | Master index — register every context file here                                       |
| `DESIGN_DOC_GUIDE.md`              | RFC/Design Doc template and guide                                                     |
| `ARCHITECTURE_VALIDATION.md`       | 4-phase architecture validation roadmap                                               |
| `ARCHITECTURE_SCORING_PLAYBOOK.md` | Layer scoring methodology (0.0–10.0)                                                  |
| `TRADE_OFF_SIMULATOR.md`           | Structured trade-off analysis framework                                               |
| `BEST_PRACTICES.md`                | Coding golden rules, docs-as-code, readiness levels, engineering excellence checklist |
| `SECURITY.md`                      | Master security policy and STRIDE model                                               |
| `COMPLIANCE_TESTING.md`            | Test framework and compliance specifications                                          |
| `ANTIPATTERNS.md`                  | Design Doc anti-patterns catalogue                                                    |
| `PATTERNS.md`                      | Validated patterns and project-specific anti-patterns                                 |

### 2. Maturity and Observability

| File                     | Purpose                                                                            |
| :----------------------- | :--------------------------------------------------------------------------------- |
| `MATURITY_REPORT.md`     | Maturity state snapshot with scoring rubric, DORA proxy, and team-size adaptations |
| `ERROR_BUDGET_POLICY.md` | Speed vs. stability arbitration policy, burn rate formulas, milestone simulation   |
| `GOVERNANCE.md`          | Technical debt tracking dashboard (3-layer risk matrix)                            |
| `COMPLIANCE_MAPPING.md`  | Pillars → Metrics → SLOs map and source audit                                      |

### 3. Architecture and Mapping

| File                        | Purpose                                     |
| :-------------------------- | :------------------------------------------ |
| `ARCHITECTURE.md`           | System architecture (C4 L1–L3, layer model) |
| `CLASS_MAP.md`              | Service topology and responsibility matrix  |
| `STATE_MACHINE.md`          | Formal FSMs for all subsystems              |
| `IMPLEMENTATION_SUMMARY.md` | Framework readiness implementation summary  |

### 4. Project Management

| File                   | Purpose                                                                    |
| :--------------------- | :------------------------------------------------------------------------- |
| `BACKLOG.md`           | MoSCoW backlog, roadmap, and user stories                                  |
| `DOSSIER.md`           | Complexity audit (Big-O) and scientific modelling                          |
| `DEPENDENCY_POLICY.md` | Dependency evaluation, licensing, versioning, and removal policy           |
| `GLOSSARY.md`          | Definitions for all acronyms and terms                                     |
| `INCIDENT_RUNBOOK.md`  | Incident severity classification, response checklist, post-mortem template |

### 5. Automation ([infra/scripts/](infra/scripts/))

| Script                          | Purpose                              |
| :------------------------------ | :----------------------------------- |
| `risk_engine.py`                | Design Doc risk score calculator     |
| `error_budget_calculator.py`    | Schedule impact simulator            |
| `generate_governance_charts.py` | Governance dashboard chart generator |

### 6. Load Testing ([infra/scripts/k6/](infra/scripts/k6/))

| Script            | Purpose                                                |
| :---------------- | :----------------------------------------------------- |
| `k6_endurance.js` | Endurance test (steady load, long duration)            |
| `k6_spike.js`     | Spike test (sudden traffic burst)                      |
| `k6_security.js`  | Security-focused load test (auth endpoints under load) |

### 7. Onboarding and Contribution

| File              | Purpose                                                              |
| :---------------- | :------------------------------------------------------------------- |
| `ONBOARDING.md`   | New engineer setup — environment, structure, reading order, first PR |
| `CONTRIBUTING.md` | Branch, commit, PR, review, and conflict resolution rules            |
| `.env.example`    | Environment variable template with descriptions                      |
| `CHANGELOG.md`    | Version history — Keep a Changelog format                            |
| `OWNERS`          | Repository ownership map — areas, owners, and escalation paths       |

---

## Starting a New Project

1. **Copy this template** into the new repository root.
2. **Fill in all `start-project` placeholders** across files.
3. **Configure `.env`** — copy `.env.example` to `.env` and fill in values.
4. **Create your first RFC** in `rfcs/` using `rfcs/TEMPLATE.yaml`.
5. **Install dependencies** — `npm install` then `npm test` to verify the CI guard passes.
6. **Activate CI/CD** — the `.github/workflows/ci.yml` workflow runs on every push.
7. **Follow AGENTS.md** — register every new context file in the same commit.
8. **Record adoption in `DECISION_LOG.md`** — append a new entry with the next available `DL-NNN` number: record why you adopted this template and what you changed. Never edit existing entries.
9. **Score your architecture** using `ARCHITECTURE_SCORING_PLAYBOOK.md` before Sprint 1.

---

> **Compliance with this framework is required** to ensure scalability and auditability
> across all projects that adopt it.
