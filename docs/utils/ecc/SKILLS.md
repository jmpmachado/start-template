# ECC — Skills Module

> Source: `utils/ECC/skills/` · Count: 250 skills · Format: `skills/<name>/SKILL.md`

Skills are reusable, harness-agnostic workflow definitions. They encode domain knowledge,
recommended patterns, step-by-step procedures, and anti-patterns for a specific engineering domain.
Modern ECC workflows use skills; legacy workflows use [commands](COMMANDS.md).

---

## Skill Format

Each skill lives in its own directory:

```
skills/
└── react-patterns/
    └── SKILL.md       # Primary definition
```

`SKILL.md` structure:

```markdown
---
name: react-patterns
description: React component design patterns and performance best practices
---

## When to Use
## How It Works
## Step-by-Step
## Examples
## Anti-Patterns
## See Also
```

---

## Skill Catalog by Domain

### Architecture & Design

| Skill | Description |
|---|---|
| `agent-architecture-audit` | Audit multi-agent system design for gaps and anti-patterns |
| `agent-harness-construction` | Build and configure new agent harness integrations |
| `api-design` | RESTful and GraphQL API design patterns |
| `agentic-engineering` | Patterns for building robust agentic workflows |
| `ai-first-engineering` | Engineering practices for AI-native applications |

### Backend Patterns

| Skill | Description |
|---|---|
| `backend-patterns` | General backend architecture (SOLID, DDD, CQRS) |
| `database-migrations` | Safe schema migration strategies and rollback plans |
| `django-patterns` | Django models, views, serializers, and URL patterns |
| `django-security` | Django-specific OWASP mitigations and hardening |
| `django-tdd` | TDD workflow for Django with pytest-django |
| `fastapi-patterns` | FastAPI dependency injection, async patterns, OpenAPI docs |
| `laravel-patterns` | Laravel Eloquent, service containers, queue patterns |
| `springboot-patterns` | Spring Boot DI, JPA, REST controllers |
| `springboot-security` | Spring Security, OAuth2, CSRF, CORS hardening |

### Frontend Patterns

| Skill | Description |
|---|---|
| `frontend-patterns` | Component architecture, state management, rendering |
| `react-patterns` | React hooks, context, composition, and code splitting |
| `react-testing` | Testing Library, MSW, Vitest integration patterns |
| `react-performance` | Memoization, virtualization, bundle optimization |
| `nextjs-turbopack` | Next.js App Router with Turbopack configuration |

### Language-Specific

| Skill | Language |
|---|---|
| `cpp-coding-standards` | C++ — RAII, ownership, move semantics, sanitizers |
| `golang-patterns` | Go — interfaces, channels, error wrapping, context |
| `golang-testing` | Go — table tests, mocks, benchmark patterns |
| `java-coding-standards` | Java — generics, streams, records, module system |
| `kotlin-patterns` | Kotlin — coroutines, sealed classes, data classes |
| `python-patterns` | Python — dataclasses, type hints, protocols, async |
| `python-testing` | Python — pytest, fixtures, parameterization, coverage |
| `rust-patterns` | Rust — ownership, traits, error handling, unsafe |
| `rust-testing` | Rust — unit/integration tests, property testing, fuzzing |
| `swift-actor-persistence` | Swift — actors, async/await, Core Data persistence |

### Testing & Quality

| Skill | Description |
|---|---|
| `tdd-workflow` | Red-green-refactor cycle with harness integration |
| `e2e-testing` | Playwright E2E generation and CI integration |
| `ai-regression-testing` | LLM output regression and evaluation harness |
| `code-review` | Structured code review with severity ratings |
| `continuous-learning` | Pattern extraction from session history |

### DevOps & Infrastructure

| Skill | Description |
|---|---|
| `docker-patterns` | Dockerfile best practices, multi-stage builds, Compose |
| `kubernetes-patterns` | Deployment, service, ingress, and HPA configurations |
| `kubernetes-security` | RBAC, network policies, pod security standards |
| `terraform-patterns` | Module design, state management, drift detection |
| `terraform-testing` | Terratest and policy-as-code validation |

### Security & Compliance

| Skill | Description |
|---|---|
| `security-review` | OWASP Top 10 audit, threat modeling, CVE triage |
| `security-scan` | Automated static analysis and dependency audit |
| `healthcare-phi-compliance` | PHI handling, audit trails, access controls |
| `hipaa-compliance` | HIPAA technical safeguards and risk assessment |

### ML / Data Engineering

| Skill | Description |
|---|---|
| `pytorch-patterns` | PyTorch model definition, training loops, checkpointing |
| `data-scraper-agent` | Ethical web scraping, rate limiting, robots.txt |
| `deep-research` | Multi-step research synthesis with source validation |
| `mle-workflow` | ML experiment tracking, versioning, model deployment |

### Accessibility

| Skill | Description |
|---|---|
| `accessibility` | WCAG 2.1 AA compliance, ARIA, keyboard navigation |

### Business & Product

| Skill | Description |
|---|---|
| `investor-materials` | Pitch deck, metrics, financial projections |
| `market-research` | Competitive analysis, TAM/SAM/SOM estimation |
| `sales-enablement` | Sales collateral, objection handling, demo scripts |

---

## Using a Skill

Reference a skill by name in a harness command or slash command:

```bash
# Claude Code
/react-patterns "Refactor this component to use composition"

# Codex
@skill react-patterns
```

From within an agent or another skill:

```markdown
Apply the `tdd-workflow` skill to generate tests before the implementation.
```

---

## Adding a New Skill

1. Create `utils/ECC/skills/<name>/SKILL.md`.
2. Include frontmatter: `name`, `description`.
3. Populate: `## When to Use`, `## How It Works`, `## Examples`, `## Anti-Patterns`.
4. Register the skill in `agent.yaml` under `skills:`.
5. Cross-reference from related agents if applicable.

---

## See Also

- [AGENTS.md](ECC_AGENTS.md) — agents that delegate to skills
- [COMMANDS.md](COMMANDS.md) — legacy command wrappers over skills
- `utils/ECC/docs/SKILL-DEVELOPMENT-GUIDE.md` — authoring guide
- `utils/ECC/docs/SKILL-PLACEMENT-POLICY.md` — where skills should live
