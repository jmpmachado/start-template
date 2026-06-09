# CI/CD Pipeline — [PROJECT_NAME]

> Template for continuous integration and delivery configuration.
> Adapt stage names and commands to the project's actual toolchain.
> All pipeline changes require a corresponding update to this document.

---

## 1. Pipeline Overview

**Platform:** [GitHub Actions / GitLab CI / Jenkins / other]
**Triggers:** `push` and `pull_request` to `main` and `master`
**Parallel matrix:** [e.g., language runtime versions 20.x, 22.x]

### Stage Sequence

```
[Checkout] → [Setup Runtime] → [Install] → [Lint] → [Type Check] → [Test] → [Build] → [Security Scan] → [Deploy (optional)]
```

**Gate policy:** each stage is a hard gate — failure blocks subsequent stages. No merging
to main with a failing pipeline.

---

## 2. Stage Definitions

| Stage                | Command                                | Failure Action |
| :------------------- | :------------------------------------- | :------------- |
| Checkout             | `git checkout`                         | Block          |
| Setup Runtime        | `actions/setup-node@v4` or equivalent  | Block          |
| Install Dependencies | `[npm ci / pip install / cargo fetch]` | Block          |
| Lint                 | `[npm run lint / flake8 / clippy]`     | Block          |
| Type Check           | `[tsc --noEmit / mypy / rustc]`        | Block          |
| Unit Tests           | `[npm test / pytest / cargo test]`     | Block          |
| Integration Tests    | `[command]`                            | Block          |
| Coverage Check       | `[coverage ≥ X%]`                      | Warn / Block   |
| Security Scan        | `[npm audit / pip audit / trivy]`      | Block on P0/P1 |
| Build                | `[npm run build / make / cargo build]` | Block          |
| Deploy (staging)     | `[deploy script]`                      | Block          |

---

## 3. Environment Variables and Secrets

> Never commit secret values. Use the platform's secrets manager.

| Variable         | Purpose       | Required In            |
| :--------------- | :------------ | :--------------------- |
| `[ENV_VAR_NAME]` | [description] | [dev / staging / prod] |
| `[SECRET_NAME]`  | [description] | [staging / prod]       |

**In GitHub Actions:** add secrets at `Settings → Secrets and variables → Actions`.
Reference in workflow: `${{ secrets.SECRET_NAME }}`.

**Secrets isolation (CNCF Security Whitepaper requirement):** staging and production secrets must reside in separate secret stores or namespaces — never share the same GitHub environment, Vault path, or SSM prefix between environments. A compromised staging secret must not grant any access to production resources. See `SECURITY.md` for the full secrets management policy.

---

## 4. Branch Strategy

| Branch      | Purpose                   | Protection Rules                |
| :---------- | :------------------------ | :------------------------------ |
| `main`      | Production-ready code     | Require PR + CI pass + 1 review |
| `staging`   | Pre-release integration   | Require CI pass                 |
| `feature/*` | Feature development       | CI pass recommended             |
| `hotfix/*`  | Critical production fixes | Require expedited review        |

---

## 5. Caching Strategy

Cache dependencies to reduce pipeline runtime:

```yaml
- uses: actions/cache@v4
  with:
    path: [node_modules / .venv / ~/.cargo/registry]
    key: ${{ runner.os }}-[tool]-${{ hashFiles('[lockfile]') }}
    restore-keys: |
      ${{ runner.os }}-[tool]-
```

**Cache invalidation:** triggered automatically when the lockfile hash changes.

---

## 6. Commit Message Convention

Use semantic commit prefixes — enforced by linter if configured.

> **Canonical type list:** [CONTRIBUTING.md §2](../../CONTRIBUTING.md). This section is a reference summary only; CONTRIBUTING.md is authoritative.

---

## 7. Deployment Pipeline

| Environment | Trigger              | Approval Required | Rollback Strategy          | DORA Target (high tier)     |
| :---------- | :------------------- | :---------------- | :------------------------- | :-------------------------- |
| Staging     | Auto on `main` merge | No                | Auto redeploy previous tag | Multiple times/day          |
| Production  | Manual / tag push    | Yes (1 approval)  | `[rollback command]`       | Daily–weekly (elite: on-demand) |

> DORA target reference: see `OBSERVABILITY.md §DORA Metrics Baseline` for full tier definitions.

---

## 7b. Deployment Patterns

> Choose a deployment pattern based on your risk tolerance, infrastructure, and rollback requirements. These patterns are not mutually exclusive — canary and blue-green are often combined.

### Canary Deployment

Route a small percentage of production traffic to the new version before full rollout.

```
v1 (95%) ←── most users
v2 (5%)  ←── canary cohort
         ↑
    [observe metrics 15-30 min]
         ↓
    pass → increment (25% → 50% → 100%)
    fail → rollback (set canary weight to 0%)
```

**Gate conditions per increment:**
- Error rate ≤ baseline + 0.5%
- p99 latency ≤ baseline + 10%
- No guardrail metric breached (see `EXPERIMENTATION.md §4`)

**Implementation options:** NGINX/Envoy weighted routing; AWS ALB weighted target groups; Kubernetes Argo Rollouts.

**Rollback:** set canary weight to 0% in load balancer config — no redeployment needed. < 30 seconds.

---

### Blue-Green Deployment

Maintain two identical production environments: one live (blue), one idle (green). Deploy to green, validate, then switch traffic.

```
                ┌─────────┐
users ──────────► BLUE (v1) [live]
                └─────────┘
                ┌─────────┐
staging tests ──► GREEN (v2) [idle → validate]
                └─────────┘
         ↓ switch load balancer
                ┌─────────┐
users ──────────► GREEN (v2) [now live]
                └─────────┘
                ┌─────────┐
                  BLUE (v1) [idle → retain 30 min]
                └─────────┘
```

**Advantages:** instant rollback (flip load balancer back); full pre-production validation at production scale.

**Disadvantages:** 2× infrastructure cost during switch; database schema changes require backward-compatible migrations (both versions run against the same DB schema simultaneously during switch window).

**Rollback:** re-point load balancer to blue environment. < 60 seconds.

---

### Rolling Deployment

Replace instances one at a time (or in small batches), maintaining availability throughout.

```
[v1, v1, v1, v1]  →  [v2, v1, v1, v1]  →  [v2, v2, v1, v1]  →  [v2, v2, v2, v2]
     ↑ start here             ↑ if ok                 ↑ if ok
                              if not ok: stop and redeploy v1 to replaced instances
```

**Parameters:**
- `max_unavailable`: max % of instances that can be down simultaneously (default: 25%)
- `max_surge`: max % of extra instances allowed during rollout (default: 25%)
- `min_ready_seconds`: wait time after an instance becomes healthy before proceeding (default: 30s)

**Rollback:** redeploy the previous image version; rolling replacement in reverse.

**When to use:** stateless services with no strict schema coupling; when 2× infrastructure cost of blue-green is not justified.

---

### Pattern Selection Guide

| Factor | Canary | Blue-Green | Rolling |
| :--- | :--- | :--- | :--- |
| Rollback speed | ~30s | ~60s | ~5 min |
| Infrastructure cost | Low (+5-10%) | High (2×) | Low |
| Risk isolation | Best (% of users) | Good (all or nothing) | Moderate |
| DB migration support | Hard | Hard (forward-only) | Hard |
| Stateful services | Avoid | Suitable | Avoid |
| Team maturity required | High | Medium | Low |

> For most services: **canary** is the default. Use blue-green when rollback speed is critical (payments, auth). Use rolling for stateless batch workers with no user-facing latency SLO.

---

## 8. Pipeline Health Monitoring

- Review pipeline failure rate weekly — target < 5% non-flake failures.
- Flaky tests must be fixed within one sprint of detection.
- Pipeline duration target: < [X] minutes for full suite.
- Set up alerts for pipeline failures on `main` branch.

---

## 9. Pre-Push Checklist (Local)

Before pushing to remote:

```bash
# 1. Verify working tree
git status

# 2. Run lint and type check locally
[lint command]
[type check command]

# 3. Run full test suite
[test command]

# 4. Confirm all tests pass before push
git push origin [branch]
```

> CI will re-run all stages — local pre-check avoids wasted CI minutes on trivial errors.

---

## 10. Multi-Language Pipeline Adapter — Python Tools

`risk_engine.py` and `error_budget_calculator.py` require Python 3.12. Projects not using Python as their primary runtime have three options:

### Option A — GitHub Actions `setup-python` step (recommended)

Add to any workflow that runs the risk check:

```yaml
- name: Setup Python for risk engine
  uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'

- name: Install risk engine dependencies
  run: pip install pyyaml

- name: Run RFC risk check
  run: python infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60 --output risk_report.md
```

This is already implemented in `.github/workflows/risk-check.yml`.

### Option B — Docker-based Python runner

For projects where installing Python on the CI runner is undesirable:

```yaml
- name: Run RFC risk check (Docker)
  run: |
    docker run --rm \
      -v ${{ github.workspace }}:/workspace \
      -w /workspace \
      python:3.12-slim \
      sh -c "pip install -q pyyaml && python infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60"
```

### Option C — Manual fallback (no CI enforcement)

If neither Python nor Docker is available in CI: run locally before opening a PR.

```bash
# Requires Python 3.12 + pyyaml
pip install pyyaml
python infra/scripts/risk_engine.py --rfcs-path rfcs/ --alert-threshold 60 --output risk_report.md
```

Document in `DECISION_LOG.md` if CI enforcement is intentionally skipped.

---

## 11. Multi-Language Pipeline Matrix

See `LANGUAGE_TOOLCHAINS.md` for full toolchain details. Adapt pipeline stages per language:

### Stage: Setup / Install

| Language | Install command | Cache key |
|---|---|---|
| .NET | `dotnet restore` | `*.csproj` / `packages.lock.json` hash |
| TypeScript/JS | `npm ci` | `package-lock.json` hash |
| Bash/Shell | `apt-get install -y shellcheck shfmt` | Image tag |

### Stage: Lint / Format Check

| Language | Command |
|---|---|
| .NET | `dotnet format --verify-no-changes` |
| TypeScript/JS | `eslint . --max-warnings 0`; `tsc --noEmit`; `prettier --check .` |
| Bash/Shell | `shellcheck scripts/**/*.sh` (CI-blocking); `shfmt -d scripts/` |

### Stage: Test

| Language | Command | Coverage flag |
|---|---|---|
| .NET | `dotnet test --collect:"XPlat Code Coverage"` | Coverlet |
| TypeScript/JS | `vitest run` / `jest` / `playwright test` | `--coverage` (V8 / Istanbul) |

### Stage: Security Scan

| Language | Command |
|---|---|
| .NET | `dotnet list package --vulnerable` |
| TypeScript/JS | `npm audit --audit-level=high` |
| Bash/Shell | `shellcheck` (CWE-78); `trivy fs scripts/` |

### Stage: Build / Package

| Language | Command |
|---|---|
| .NET | `dotnet publish -c Release --self-contained` |
| TypeScript/JS | `tsc --noEmit` |

---

## 12. GitHub Actions Snippets (New Languages)

> Concrete pipeline-step examples. Matrix coverage for these languages already
> lives in §11 above; snippets below are drop-in YAML fragments.

### TypeScript / JavaScript

```yaml
- name: Lint & Type-check
  run: |
    npx eslint . --max-warnings 0
    npx tsc --noEmit
- name: Test
  run: npx vitest run --coverage
- name: Security
  run: npm audit --audit-level=high
```

### Bash / Shell

```yaml
- name: Shellcheck (blocking)
  run: shellcheck scripts/**/*.sh
- name: Format check
  run: shfmt -d scripts/
```

---

## 13. Reference — GitHub Actions Starter Workflows

**Source:** [`github.com/actions/starter-workflows`](https://github.com/actions/starter-workflows)

Official GitHub repository of CI/CD workflow templates — the same catalog surfaced in the GitHub UI under "New workflow". Use as a **structure reference** for new language profiles, not as production-ready configuration.

### What to use from starter-workflows

| Use | Do not use as-is |
|---|---|
| Job/step structure per language | `permissions:` blocks (default is overly broad) |
| Matrix strategy patterns | Third-party actions without SHA pin |
| Runtime setup step names | `pull_request_target` trigger (supply chain risk) |
| Cache key patterns | Any step that interpolates secrets into `run:` |

### Mandatory hardening before production use

Every workflow derived from starter-workflows must pass these gates before merge:

```yaml
# 1. Explicit minimal permissions — add to every workflow top-level
permissions:
  contents: read

# 2. Pin third-party actions to full commit SHA — never use mutable tags
# BAD:  uses: actions/checkout@v4
# GOOD: uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2

# 3. Never use pull_request_target with fork checkout
# pull_request_target runs with repo-base permissions — attacker fork can exfiltrate secrets

# 4. Mask secrets before use — never interpolate directly into run:
- name: Auth step
  run: |
    echo "::add-mask::${{ secrets.TOKEN }}"
    tool auth --token "${{ secrets.TOKEN }}"
```

### Security classification

| System type | Starter workflows usable? | Condition |
|---|---|---|
| Public repo / open source | ✅ With SHA pinning + permissions block | Low residual risk |
| Internal / private repo | ✅ With full hardening checklist above | Medium residual risk without audit |
| Regulated / compliance-required (SOC2, ISO 27001, PCI) | ⚠️ Structural reference only | Must pass `SUPPLY_CHAIN.md` audit + SHA pin all actions + SAST on workflow YAML |
| Air-gapped / high-security | ❌ GitHub-hosted runners not allowed | Use self-hosted runners; starter-workflows irrelevant |

Cross-reference: [`SUPPLY_CHAIN.md`](.agent/context/SUPPLY_CHAIN.md) — SHA pinning policy and Renovate/Dependabot configuration for automated action updates.

---

## 14. Active Workflows — Quick Reference

- `ci.yml`: Node tooling CI — lint + typecheck + test on Node 24.
- `ci-matrix.yml`: Stack-aware orchestrator, routes to `ci-dotnet.yml` backend pipeline.
- `ci-dotnet.yml`: .NET backend CI — restore + build + test on .NET 9.
- `security.yml`: npm audit + NuGet dependency vulnerability audits.
- `risk-check.yml`: RFC YAML risk gate, blocks on score ≥ 60.
- `docs-integrity.yml`: AGENTS.md bidirectional guard + markdown lint.
- `pr-lint.yml`: Node.js EOL check + placeholder detection on PRs.
- `template-drift.yml`: weekly cron — drift detection and memory checks.
- `lint-all.yml`: developer-facing formatting and lint checker.
