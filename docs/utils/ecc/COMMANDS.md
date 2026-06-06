# ECC — Commands Module

> Source: `utils/ECC/commands/` · Count: 79 slash commands · Format: Markdown with `description` frontmatter

Commands are the legacy slash-command interface. Each command wraps one or more skills and
exposes a consistent invocation surface across harnesses. Prefer [Skills](SKILLS.md) for new
workflows; commands exist for backward compatibility and cross-harness reach.

---

## Command Format

```markdown
---
description: Run the full TDD workflow for the current file
---

## Steps
1. Identify the module under test.
2. Generate failing tests using the `tdd-workflow` skill.
3. Implement until all tests pass.
4. Refactor with `code-simplifier` agent.
```

---

## Command Catalog

### Development Workflow

| Command | Description |
|---|---|
| `/tdd` | Full red-green-refactor TDD cycle |
| `/plan` | Produce an implementation plan before coding |
| `/code-review` | Structured code review (local diff or PR) |
| `/code-review ultra` | Deep multi-agent cloud review |
| `/simplify` | Refactor for clarity, reuse, and efficiency |
| `/build-fix` | Diagnose and fix build errors |
| `/e2e` | Generate and run Playwright E2E tests |
| `/learn` | Extract reusable patterns from session history |

### Security

| Command | Description |
|---|---|
| `/security-scan` | SAST + dependency audit |
| `/security-review` | Full OWASP + threat model audit |

### Language-Specific

| Command | Languages |
|---|---|
| `/python-review` | Python code review |
| `/python-test` | Generate Python test suite |
| `/python-build` | Fix Python build/import errors |
| `/go-review` | Go code review |
| `/go-test` | Generate Go test suite |
| `/go-build` | Fix Go build errors |
| `/rust-review` | Rust code review |
| `/rust-test` | Generate Rust test suite |
| `/rust-build` | Fix Rust/Cargo build errors |
| `/cpp-review` | C++ code review |
| `/cpp-test` | Generate C++ test suite |
| `/cpp-build` | Fix C++ build errors |
| `/java-review` | Java code review |
| `/java-test` | Generate Java test suite |
| `/kotlin-review` | Kotlin code review |
| `/swift-review` | Swift code review |
| `/ts-review` | TypeScript code review |
| `/php-review` | PHP / Laravel code review |
| `/ruby-review` | Ruby code review |

### Framework-Specific

| Command | Framework |
|---|---|
| `/django-review` | Django code review |
| `/django-test` | Django pytest suite |
| `/fastapi-review` | FastAPI review |
| `/react-review` | React component review |
| `/nextjs-review` | Next.js App Router review |
| `/springboot-review` | Spring Boot review |
| `/laravel-review` | Laravel review |

### Architecture & DevOps

| Command | Description |
|---|---|
| `/architect` | Architectural design and trade-off analysis |
| `/database-review` | Schema and query review |
| `/docker-review` | Dockerfile and Compose review |
| `/k8s-review` | Kubernetes manifest review |
| `/terraform-review` | Terraform module and state review |

### Data / ML

| Command | Description |
|---|---|
| `/deep-research` | Multi-step research with source synthesis |
| `/mle-review` | ML engineering code and pipeline review |

---

## Command vs. Skill

| Aspect | Command | Skill |
|---|---|---|
| Format | Single Markdown file in `commands/` | Directory with `SKILL.md` |
| Invocation | `/command-name` prefix | Referenced by name in agents or harness |
| Status | Legacy, maintained for compatibility | Modern, preferred |
| Cross-harness | High (native slash command everywhere) | High via skill loader |
| Composition | Wraps one or more skills | Self-contained or delegates to agents |

---

## Legacy Shims

`utils/ECC/legacy-command-shims/` contains thin wrapper files that redirect old command names
to their modern skill or command equivalents. They are loaded automatically by the harness and
require no manual intervention.

---

## See Also

- [SKILLS.md](SKILLS.md) — modern skill definitions
- [AGENTS.md](ECC_AGENTS.md) — agents invoked by commands
- `utils/ECC/agent.yaml` — lists all 79 commands in the `commands:` key
