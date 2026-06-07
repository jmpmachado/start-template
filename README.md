# Engineering Template - [PROJECT_NAME]

Beginner-friendly, stack-agnostic engineering template with a modular frontend/backend structure and a governance layer built around `AGENTS.md`, CI, `memory.json`, and `AGILE_CONFIG.md`.

Use this directory as the starting point for a new `[PROJECT_NAME]` adoption or as the baseline for a derived project module.

---

## Framework Structure

### 1. Governance and Design ([.agent/context/](.agent/context/))

| File                               | Purpose                                                                               |
| :--------------------------------- | :------------------------------------------------------------------------------------ |
| `AGENTS.md`                        | Master index — register every context file here                                       |
| `AGENT_GUIDELINES.md`              | Core behavioral invariants, reasoning patterns, and quality gates for agent operation |
| `BEST_PRACTICES.md`                | Coding golden rules, docs-as-code, readiness levels, engineering excellence checklist |
| `SECURITY.md`                      | Master security policy and STRIDE model                                               |
| `ANTIPATTERNS.md`                  | Design Doc anti-patterns catalogue                                                   |
| `PATTERNS.md`                      | Validated patterns and project-specific anti-patterns                                 |
| `AGENT_HANDOFF.md`                 | Agent session handoff guidelines                                                      |

### 2. Architecture and Mapping

| File                        | Purpose                                     |
| :-------------------------- | :------------------------------------------ |
| `ARCHITECTURE.md`           | System architecture (C4 L1–L3, layer model) |
| `CLASS_MAP.md`              | Service topology and responsibility matrix  |
| `STATE_MACHINE.md`          | Formal FSMs for all subsystems              |
| `DATA_MODEL.md`             | Database schemas and sensitivity logs       |

### 3. Project Management & Quality

| File                   | Purpose                                                                    |
| :--------------------- | :------------------------------------------------------------------------- |
| `BACKLOG.md`           | MoSCoW backlog, roadmap, and active user stories                           |
| `DEPENDENCY_POLICY.md` | Dependency evaluation, licensing, versioning, and removal policy           |
| `AGILE_GUIDE.md`       | Scrum process and Agile framework guidelines                               |
| `LEAN_PROFILE.md`      | Lean modifications for small teams                                         |
| `AGILE_CONFIG.md`      | Sprint capacity and module settings                                        |
| `DECISION_LOG.md`      | Architecture Decision Records log                                          |
| `DEFINITION_OF_DONE.md`| Requirements to mark a user story as done                                  |
| `TEST_STRATEGY.md`     | Automated test metrics and coverage goals                                  |
| `TOOLING_RUNTIME.md`   | System vs tooling configuration differences                                |

### 4. Operations & Runbooks

| File              | Purpose                                                              |
| :---------------- | :------------------------------------------------------------------- |
| `RUNBOOK.md`      | Deployment instructions and rollback runbook                         |
| `CI_CD.md`        | CI/CD pipeline overview                                              |

### 5. Onboarding and Contribution

| File              | Purpose                                                              |
| :---------------- | :------------------------------------------------------------------- |
| `ONBOARDING.md`   | New engineer setup — environment, structure, reading order, first PR |
| `CONTRIBUTING.md` | Branch, commit, PR, review, and conflict resolution rules            |
| `.env.example`    | Environment variable template with descriptions                      |
| `CHANGELOG.md`    | Version history — Keep a Changelog format                            |
| `START_HERE.md`   | Beginner-friendly quickstart guide                                   |

---

## Starting a New Project

1. **Install dependencies** — Run `npm install` inside `tooling/` (or run `npm test` from root to automatically trigger npm ci).
2. **Execute tests** — Run `npm test` to verify everything is fully functional.
3. **Follow AGENTS.md** — Register any new context files in `AGENTS.md` in the same commit.
4. **Adhere to guidelines** — Refer to `.agent/context/AGENT_GUIDELINES.md` for the core agent operating rules.
