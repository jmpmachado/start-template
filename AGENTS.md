# Engineering Template â€” Master Index (Agent Knowledge Base)

This index guides AI agents and engineers through the modular template knowledge base.

> [!IMPORTANT]
> **Guard Rule**: Every file added to `.agent/context/` must be registered here in the same commit, or the integrity tests will fail.

---

## ðŸ—ºï¸� Context Map

### 1. Guidelines & Best Practices

* **[.agent/context/AGENT_GUIDELINES.md](.agent/context/AGENT_GUIDELINES.md)**: Core behavioral invariants, reasoning patterns, and quality gates for agent operation in this workspace. â€” **[Core]**
* **[.agent/context/BEST_PRACTICES.md](.agent/context/BEST_PRACTICES.md)**: Coding golden rules, lifecycle hooks, docs-as-code guidelines, and development checklists. â€” **[Core]**
* **[.agent/context/ANTIPATTERNS.md](.agent/context/ANTIPATTERNS.md)**: Catalogue of common software design and documentation anti-patterns. â€” **[Core]**
* **[.agent/context/PATTERNS.md](.agent/context/PATTERNS.md)**: Log of validated and approved architectural design patterns. â€” **[Core]**
* **[.agent/context/AGENT_HANDOFF.md](.agent/context/AGENT_HANDOFF.md)**: Cross-agent and cross-session context transfer protocol â€” handoff document format, trigger conditions, and per-agent consumption rules. â€” **[Core]**

### 2. Architecture & Technology

* **[.agent/context/ARCHITECTURE.md](.agent/context/ARCHITECTURE.md)**: System architecture diagrams (C4 model Levels 1â€“3) and service relationships. â€” **[Core]**
* **[.agent/context/DATA_MODEL.md](.agent/context/DATA_MODEL.md)**: Database schemas, entity-relationship diagrams, migrations, and data sensitivity classifications. â€” **[Core]**
* **[.agent/context/CLASS_MAP.md](.agent/context/CLASS_MAP.md)**: System topology, responsibilities matrix, and critical class mappings. â€” **[Core]**
* **[.agent/context/STATE_MACHINE.md](.agent/context/STATE_MACHINE.md)**: Subsystem Finite State Machine (FSM) diagrams and state-action maps. â€” **[Core]**
* **[.agent/context/DECISION_LOG.md](.agent/context/DECISION_LOG.md)**: Lightweight Architecture Decision Records (ADR) log for day-to-day choices. â€” **[Core]**

### 3. Quality, Validation & Compliance

* **[.agent/context/TEST_STRATEGY.md](.agent/context/TEST_STRATEGY.md)**: Test automation framework, test ratios, coverage floors, mocking policies, and quarantine procedures. â€” **[Core]**
* **[.agent/context/TOOLING_RUNTIME.md](.agent/context/TOOLING_RUNTIME.md)**: Clarifies the distinction between Node.js as tooling runtime vs the child project's application runtime. â€” **[Core]**

### 4. Governance & Project Management

* **[.agent/context/SECURITY.md](.agent/context/SECURITY.md)**: Security blueprints, trust boundaries, AI data privacy governance rules, Microsoft SDL phase mapping, banned API list. â€” **[Core]**
* **[.agent/context/THREAT_MODEL.md](.agent/context/THREAT_MODEL.md)**: STRIDE-based system threat catalog, vulnerability vectors, and security controls. â€” **[Core]**
* **[.agent/context/BACKLOG.md](.agent/context/BACKLOG.md)**: Active backlog â€” Must Have, Should Have, Could Have items, Won't Have, Sprint History, DoD, and Velocity. â€” **[Core]**
* **[.agent/context/DEPENDENCY_POLICY.md](.agent/context/DEPENDENCY_POLICY.md)**: Library selection guidelines, licensing audits, security scan thresholds, and Renovate/Dependabot policy. â€” **[Core]**
* **[.agent/context/AGILE_GUIDE.md](.agent/context/AGILE_GUIDE.md)**: Agile operating guide for human+AI semi-autonomous teams â€” sprint structure, capacity limits, US rules, monorepo branch policy, debt checkpoint protocol. â€” **[Core]**
* **[.agent/context/LEAN_PROFILE.md](.agent/context/LEAN_PROFILE.md)**: Governance reductions for small teams (â‰¤ 3 engineers) â€” lean variants for AGILE_GUIDE. â€” **[Core]**
* **[.agent/context/AGILE_CONFIG.md](.agent/context/AGILE_CONFIG.md)**: Project-specific agile calibration â€” configuration interview, sprint capacity, module registry, DORA targets, active sprint tracker. â€” **[Core]**

### 5. Workspace Onboarding & Rules

* **[ONBOARDING.md](ONBOARDING.md)**: Workspace setup guide, environment requirements, and first-day engineering checklist. â€” **[Core]**
* **[CONTRIBUTING.md](CONTRIBUTING.md)**: Branch naming rules, commit message guidelines, pull request checklist, and code review flows. â€” **[Core]**
* **[START_HERE.md](START_HERE.md)**: 5-step path from clone to first sprint. â€” **[Core]**
* **[DOTNET_SETUP.md](DOTNET_SETUP.md)**: .NET 9 SDK and VS2022 Build Tools setup — decision matrix (VS2022 already installed vs fresh machine vs CI agent), winget one-liner, silent install, backend verification, troubleshooting. — **[Core]**
* **[TOOLING_SETUP.md](TOOLING_SETUP.md)**: Full prerequisites guide for all runtimes — Node.js ≥ 24 (mandatory), .NET 9 (mandatory for backend), Python ≥ 3.10 (optional for infra scripts); winget one-liners, official download links, nvm, version matrix, full-stack verify sequence, troubleshooting. — **[Core]**
* **[.agent/context/DEFINITION_OF_DONE.md](.agent/context/DEFINITION_OF_DONE.md)**: Checklist defining requirements for feature release (tests, lint, security, docs). â€” **[Core]**

### 6. Operations & Runbooks

* **[.agent/context/RUNBOOK.md](.agent/context/RUNBOOK.md)**: Operations handbook containing deployment instructions, database migrations, and rollback procedures. â€” **[Core]**
* **[.agent/context/CI_CD.md](.agent/context/CI_CD.md)**: CI/CD configuration pipelines and build/test workflow specifications. â€” **[Core]**

---

## ðŸŽ¯ Skills (`.agent/skills/`)

Project-scoped skills invoked via `/skill-name` in Claude Code.

| Skill | Trigger | What it does | Allowed tools |
|---|---|---|---|
| `validate-template` | `/validate-template` | Runs `npm run lint && npm run typecheck && npm test`. Reports overall pass/fail. | Bash |

---

## âš¡ Slash Commands (`.claude/commands/`)

Project-scoped slash commands that activate code-artifact modes.

| Command | Mode | Domain |
|---|---|---|
| `/code-construct` | Build â€” no audit | Implementation |
| `/code-lint` | Conformance check | Implementation |
| `/code-falsify` | Full falsification | Implementation |
| `/lint-all` | code-lint + doc-lint | Touched files |

---

## ðŸ› ï¸� Critical Rules for Agents

1. **AGENTS.md Guard**: Every new context file inside `.agent/context/` must be registered in this index in the same commit.
2. **Language standard**: All documents, code comments, docstrings, and tests must be in English.
3. **Template Neutrality**: Keep files generic. Avoid using specific project/product names (use `start-project`, `node-ts`, `typescript` placeholders).
4. **Pre-commit Checks**: Run linters, formatters, and type checkers before marking the task complete.
5. **Quality by Execution Mode**: Before concluding delivery, run explicit verification mode. Use `/lint-all` for routine changes and `/full-falsify` for high-risk changes.
6. **Minimal Traceable Memory**: Keep operational memory concise and reusable in `.agent/MEMORY.md` and `.agent/memory.json` per Rule 11.
