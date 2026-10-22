# Engineering Template - [PROJECT_NAME]

Beginner-friendly, stack-agnostic engineering template: a modular frontend/backend structure, CI, an RFC/ADR process and a set of
engineering documents (security, architecture, runbooks, testing, dependency policy).

Use this directory as the starting point for a new `[PROJECT_NAME]` or as the baseline for a derived project module.

---

## Documentation (`docs/`)

### 1. Design and quality

| File | Purpose |
| :--- | :--- |
| `BEST_PRACTICES.md` | Coding golden rules, docs-as-code, readiness levels, engineering excellence checklist |
| `SECURITY.md` | Security policy, controls and review checklist |
| `THREAT_MODEL.md` | STRIDE threat model, risk register and controls inventory |
| `ANTIPATTERNS.md` | Design-doc anti-patterns catalogue |
| `PATTERNS.md` | Validated patterns and project-specific anti-patterns |

### 2. Architecture and mapping

| File | Purpose |
| :--- | :--- |
| `ARCHITECTURE.md` | System architecture (C4 L1-L3, layer model) |
| `CLASS_MAP.md` | Service topology and responsibility matrix |
| `STATE_MACHINE.md` | Formal FSMs for the subsystems |
| `DATA_MODEL.md` | Database schemas and sensitivity logs |
| `DATA_PRIVACY.md` | PII handling requirements |

### 3. Project management and quality

| File | Purpose |
| :--- | :--- |
| `BACKLOG.md` | MoSCoW backlog and roadmap |
| `DEPENDENCY_POLICY.md` | Dependency evaluation, licensing, versioning and removal |
| `DECISION_LOG.md` | Architecture decision log |
| `DEFINITION_OF_DONE.md` | Requirements to mark work as done |
| `TEST_STRATEGY.md` | Test metrics and coverage goals |
| `EXPERIMENTATION.md` | A/B testing framework |
| `TOOLING_RUNTIME.md`, `LANGUAGE_TOOLCHAINS.md` | Runtime vs tooling configuration, per-language toolchains |

### 4. Operations

| File | Purpose |
| :--- | :--- |
| `RUNBOOK.md` | Deployment and rollback runbook |
| `CI_CD.md` | CI/CD pipeline overview |
| `CAPACITY_PLANNING.md` | Infrastructure sizing |
| `SECURITY_REVIEW.md` | Security review record |

### 5. Onboarding and contribution (repository root)

| File | Purpose |
| :--- | :--- |
| `START_HERE.md` | Beginner-friendly quickstart |
| `ONBOARDING.md` | Environment, structure, reading order, first PR |
| `CONTRIBUTING.md` | Branch, commit, PR and review rules |
| `BRANCHES.md` | Branch map |
| `CONFIGURE.md`, `TOOLING_SETUP.md`, `DOTNET_SETUP.md` | Placeholders and toolchain setup |
| `CHANGELOG.md` | Version history (Keep a Changelog) |

---

## Starting a new project

1. **Install dependencies** — run `npm install` inside `tooling/` (or `npm test` from the root, which runs `npm ci` first).
2. **Run the tests** — `npm test` verifies the template end to end.
3. **Fill the placeholders** — search for `[PROJECT_NAME]` and the other bracketed placeholders (see `CONFIGURE.md`).
4. **Record decisions** — use `rfcs/` for RFCs and `rfcs/ADR-TEMPLATE.md` for smaller decisions.

## License

MIT — see `LICENSE`.
