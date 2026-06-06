# Onboarding Guide — start-project

> For new engineers joining the project. Read in order — each section builds on the previous.
> Estimated time: 2–4 hours for a complete first pass.

---

## 1. Before You Start

### What you need

**Node.js tooling (governance, lint, tests):**

| Tool | Minimum Version | Check Command |
| :--- | :--- | :--- |
| Node.js | v24+ | `node --version` |
| npm | v10+ (bundled with Node) | `npm --version` |
| Git | 2.40+ | `git --version` |
| Editor | VS Code recommended | — |

**Backend (.NET 8/9):**

| Tool | Minimum Version | Check Command | Install |
| :--- | :--- | :--- | :--- |
| .NET 9 SDK | 9.0.x | `dotnet --version` | See [DOTNET_SETUP.md](DOTNET_SETUP.md) §2 |
| VS2022 Build Tools | 17.8+ | `msbuild -version` | See [DOTNET_SETUP.md](DOTNET_SETUP.md) §1 |

> **VS2022 already installed?** You only need the standalone .NET 9 SDK:
> ```powershell
> winget install --id Microsoft.DotNet.SDK.9
> ```
> See [DOTNET_SETUP.md §2](DOTNET_SETUP.md) for full options (winget / manual download / VS Installer).

### Recommended editor setup

- Install the `[language]` extension.
- Enable "format on save" with the project's formatter config.
- The project enforces code style via pre-commit hooks — they run automatically on `git commit`.

---

## 2. First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/start-org/start-project.git
cd [repo-name]

# 2. Copy environment template (never commit real values)
cp .env.example .env
# Fill in the required values — see .env.example comments

# 3. Install dependencies (Node.js reference stack)
npm install

# 4. Run the test suite — all tests must pass before you write a line
npm test

# 4b. Run Python tests (if Python tooling is active)
npm run test:python   # runs pytest tests/unit/test_*.py

# 5. Start the development server
npm run dev
```

> Replace `npm install` / `npm test` / `npm run dev` with your stack's equivalent if not Node.js.
> Estimated setup time: ≤ 5 minutes for a clean Node.js environment.
>
> If any step fails, check [TROUBLESHOOTING](#9-troubleshooting) below before asking for help.

---

## 3. Repository Structure

```
[project-name]/
├── .agent/context/       # Engineering knowledge base (docs for agents + humans)
├── .github/workflows/    # CI/CD pipeline definitions
├── infra/                # Infrastructure scripts
├── rfcs/                 # Design Docs and Architecture Decision Records
├── src/
│   ├── frontend/         # HTML5 + CSS + JS (open index.html in browser)
│   │   ├── index.html
│   │   ├── style.css
│   │   └── app.js
│   └── backend/          # .NET 8/9 Minimal API
│       ├── Program.cs
│       ├── backend.csproj
│       └── appsettings.json
└── tests/
    ├── unit/             # Node.js vitest tests (governance)
    ├── integration/      # Node.js integration tests
    └── backend/          # .NET xUnit tests
        ├── ApiTests.cs
        └── backend.tests.csproj
```

---

## 4. Knowledge Base Reading Order

Read these documents before making your first PR:

| Order | Document                                                                               | Why                                                                 |
| :---: | :------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
|   1   | [AGENTS.md](AGENTS.md)                                                                 | Master index — understand what every doc is for                     |
|   2   | [CLAUDE.md](CLAUDE.md) / [.github/copilot-instructions.md](.github/copilot-instructions.md) | AI agent runtime contracts — read if working with Claude or Copilot |
|   3   | [.agent/context/ARCHITECTURE.md](.agent/context/ARCHITECTURE.md)                      | System design and layer model                                       |
|   4   | [.agent/context/SECURITY.md](.agent/context/SECURITY.md)                              | Security policy — mandatory before touching auth or data            |
|   5   | [.agent/context/BEST_PRACTICES.md](.agent/context/BEST_PRACTICES.md)                  | Coding rules and lifecycle patterns                                 |
|   6   | [.agent/context/PATTERNS.md](.agent/context/PATTERNS.md)                              | Validated patterns and antipatterns                                 |
|   7   | [.agent/context/AGENT_HANDOFF.md](.agent/context/AGENT_HANDOFF.md)                    | Cross-agent handoff protocol — mandatory for multi-agent sessions   |
|   8   | [CONTRIBUTING.md](CONTRIBUTING.md)                                                     | Branch, commit, and PR workflow                                     |
|   9   | [.agent/context/DATA_PRIVACY.md](.agent/context/DATA_PRIVACY.md)                      | PII handling requirements — read before any feature that collects user data |
|  10   | [.agent/context/EXPERIMENTATION.md](.agent/context/EXPERIMENTATION.md)                | A/B testing framework — read before designing any experiment or feature flag rollout |
|  11   | [.agent/context/CAPACITY_PLANNING.md](.agent/context/CAPACITY_PLANNING.md)            | Infrastructure sizing — read before any launch planning or traffic peak preparation |

---

## 5. Development Workflow

### Daily loop

```
1. git pull origin main              # start fresh
2. git checkout -b feat/my-feature   # branch from main
3. [write tests first — TDD]
4. [implement]
5. npm test                          # all tests must pass locally
6. npm run lint                      # zero errors
7. git commit -m "feat: ..."         # pre-commit hook runs automatically
8. git push origin feat/my-feature
9. Open a PR → CI runs → request review
```

### Commit message format

```
<type>(<scope>): <short description>
```

See [CONTRIBUTING.md §2](CONTRIBUTING.md) for the canonical type list and rules. Examples:

- `feat: add password reset flow`
- `fix: prevent IDOR on resource deletion`
- `test: cover quota exhaustion state`
- `security: enforce ownership check in update handler`

---

## 6. Running Tests

| Command                      | What it runs                                   |
| :--------------------------- | :--------------------------------------------- |
| `npm test`                   | Full Node.js test suite (unit + integration)   |
| `npm run test:watch`         | Unit tests in watch mode                       |
| `npm run test:coverage`      | Coverage report                                |
| `dotnet test tests/backend/backend.tests.csproj` | .NET xUnit backend tests |
| `dotnet build src/backend/backend.csproj` | Build the backend          |
| `dotnet run --project src/backend/backend.csproj` | Run the API locally on `https://localhost:5001` |

**Coverage targets:** ≥ [80]% statements, ≥ [70]% branches.
A PR that drops coverage below the target requires explicit approval.

### Integration Test Bootstrap

Integration tests require local services (PostgreSQL + Redis). Start them with Docker Compose:

```bash
# Start local services (db on :5432, cache on :6379)
docker compose -f infra/docker-compose.yml up -d

# Wait for services to be healthy (healthchecks are configured)
docker compose -f infra/docker-compose.yml ps

# Set environment variables
export DATABASE_URL=postgres://appuser:localdevpassword@localhost:5432/appdb
export REDIS_URL=redis://localhost:6379

# Run integration tests
npm run test:integration

# Stop services when done
docker compose -f infra/docker-compose.yml down
```

**Environment variables required by `tests/integration/`:**

| Variable | Value for local dev | Description |
| :------- | :------------------ | :---------- |
| `DATABASE_URL` | `postgres://appuser:localdevpassword@localhost:5432/appdb` | Primary DB connection |
| `REDIS_URL` | `redis://localhost:6379` | Cache connection |

> See [DOTNET_SETUP.md §5](DOTNET_SETUP.md) for .NET-specific troubleshooting (PATH issues, SDK mismatch, port conflicts).

---

## 7. Making Your First PR

Before opening a PR, verify:

- [ ] All tests pass locally.
- [ ] Linter passes with zero errors.
- [ ] If you added a file to `.agent/context/` → updated `AGENTS.md` in the same commit.
- [ ] No secrets or credentials in the diff.
- [ ] PR description explains _why_, not just _what_.

---

## 8. Key Contacts

| Role      | Name / Handle | Contact           |
| :-------- | :------------ | :---------------- |
| Tech Lead | [name]        | [slack / email]   |
| On-call   | [rotation]    | [pager / channel] |
| Security  | [name / team] | [channel]         |

---

## 9. Troubleshooting

### Tests fail on first run

1. Verify local services are running: `docker compose ps`
2. Check `.env` has all required variables from `.env.example`
3. Check runtime version matches the requirement table above

### Pre-commit hook fails

1. Run `[npm run lint]` manually to see the full error
2. Fix the reported issues
3. Stage the fixes and try committing again

### Port conflict on `dev` server

Change the port in `.env`: `PORT=[another port]`

### Native module binary mismatch

If you see `not a valid executable` errors after `npm install`:

```bash
npm rebuild [module-name]
```

---

## Cold-Start Agent Prompt

Copy-paste this as the system prompt when starting a new agent session on this template:

> You are working on `start-project` — a project derived from the engineering template at `project-template`.
> Mandatory reads before any task:
> 1. `AGENTS.md` — full knowledge base index and guard rules
> 2. `CLAUDE.md` (or your agent contract file) — operating rules, modes, pre-commit gate
> 3. `.agent/context/BACKLOG.md` — active sprint and open items
> 4. `.agent/context/AGILE_CONFIG.md` — project-specific capacity and module registry
> Active sprint: [SPRINT_NUMBER]. Pre-commit gate: `npm run lint && npm run typecheck && npm test`.
> Apply Rule 8 (falsification default for analysis) and Rule 9 (construct default for code).

---

## 10. Glossary

A full glossary of acronyms and terms used in this project lives in
[.agent/context/GLOSSARY.md](.agent/context/GLOSSARY.md) (create if not yet present).

Quick reference for the most common terms:

| Term   | Meaning                                                     |
| :----- | :---------------------------------------------------------- |
| ADR    | Architecture Decision Record                                |
| RFC    | Request for Comments (Design Doc proposal)                  |
| SLO    | Service Level Objective                                     |
| SLI    | Service Level Indicator                                     |
| DoD    | Definition of Done                                          |
| STRIDE | Spoofing, Tampering, Repudiation, Info Disclosure, DoS, EoP |
| CWE    | Common Weakness Enumeration                                 |
| DORA   | DevOps Research and Assessment metrics                      |
| MoSCoW | Must / Should / Could / Won't prioritization                |
| IDOR   | Insecure Direct Object Reference                            |
