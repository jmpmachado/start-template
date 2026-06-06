# ECC — Agents Module

> Source: `utils/ECC/agents/` · Count: 63 specialized subagents · Format: Markdown + YAML frontmatter

Agents are domain-scoped subagents. Each agent file declares `name`, `description`, `tools`, and
`model` in YAML frontmatter. The harness delegates work to the appropriate agent based on task type.

---

## Agent Format

```yaml
---
name: architect
description: System design, scalability trade-offs, and architectural guidance
tools:
  - Read
  - Glob
  - Grep
  - WebSearch
model: claude-opus-4-5
---

## Role
...
```

---

## Agent Catalog

### Core Engineering

| Agent | File | Purpose |
|---|---|---|
| `architect` | `architect.md` | System design, scalability, trade-off analysis |
| `code-reviewer` | `code-reviewer.md` | Quality and correctness (security, performance, patterns) |
| `code-simplifier` | `code-simplifier.md` | Refactoring and complexity reduction |
| `planner` | `planner.md` | Implementation planning before coding |
| `tdd-guide` | `tdd-guide.md` | Test-driven development end-to-end workflow |
| `security-reviewer` | `security-reviewer.md` | Vulnerability detection and threat analysis |
| `build-error-resolver` | `build-error-resolver.md` | Generic build error diagnosis and fix |
| `e2e-runner` | `e2e-runner.md` | E2E test generation and execution |
| `database-reviewer` | `database-reviewer.md` | Schema design, query optimization, migration safety |

### Language-Specific Reviewers

| Agent | Language / Framework |
|---|---|
| `cpp-reviewer` | C++ |
| `kotlin-reviewer` | Kotlin / Android |
| `python-reviewer` | Python |
| `rust-reviewer` | Rust |
| `go-reviewer` | Go |
| `java-reviewer` | Java / Spring Boot |
| `swift-reviewer` | Swift / SwiftUI |
| `ts-reviewer` | TypeScript |
| `php-reviewer` | PHP / Laravel |
| `ruby-reviewer` | Ruby |

### Framework Specialists

| Agent | Framework |
|---|---|
| `django-reviewer` | Django |
| `fastapi-reviewer` | FastAPI |
| `flutter-reviewer` | Flutter / Dart |
| `react-reviewer` | React |
| `nextjs-reviewer` | Next.js |
| `springboot-reviewer` | Spring Boot |
| `laravel-reviewer` | Laravel |

### Build / DevOps

| Agent | Scope |
|---|---|
| `cpp-build-resolver` | C++ build failures |
| `go-build-resolver` | Go build failures |
| `rust-build-resolver` | Rust/Cargo build failures |
| `java-build-resolver` | Maven/Gradle failures |
| `docker-resolver` | Docker/Compose failures |
| `k8s-resolver` | Kubernetes manifest errors |

### ML / Data

| Agent | Scope |
|---|---|
| `mle-reviewer` | Machine learning engineering |
| `gan-generator` | GAN architecture generation |
| `data-pipeline-reviewer` | ETL / data pipeline patterns |

### Ops / Orchestration

| Agent | Scope |
|---|---|
| `harness-optimizer` | Cross-harness config optimization |
| `loop-operator` | Loop and recurring task management |
| `chief-of-staff` | High-level task orchestration |
| `session-manager` | Session lifecycle and state |

---

## Usage Pattern

Agents are invoked by the harness `Agent` tool or referenced inside skills:

```markdown
<!-- Inside a skill or command -->
Delegate architecture review to the `architect` agent.
Delegate vulnerability scanning to the `security-reviewer` agent.
```

From Claude Code:

```bash
/agent architect "Design a multi-tenant SaaS auth system"
```

---

## Adding a New Agent

1. Create `utils/ECC/agents/<name>.md` with required YAML frontmatter fields.
2. Define: `## Role`, `## Capabilities`, `## When to Use`, `## Output Format`.
3. Register the agent in `agent.yaml` under the `agents:` key.
4. If the agent is harness-specific, add an adapter entry in `.claude/`, `.codex/`, or `.cursor/`.

---

## See Also

- [SKILLS.md](SKILLS.md) — reusable skills referenced by agents
- [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) — per-harness agent availability
- `utils/ECC/agent.yaml` — export manifest listing all 63 agents
