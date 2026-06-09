# Contributing Guide — [PROJECT_NAME]

> This document defines the workflow for contributing to this project.
> All contributors — including AI agents — must follow these rules.

---

## 1. Branch Strategy

| Branch          | Purpose                             | Who creates | Merged into                     |
| :-------------- | :---------------------------------- | :---------- | :------------------------------ |
| `main`          | Production-ready, always deployable | CI/CD       | —                               |
| `feat/<slug>`   | New feature                         | Engineer    | `main` via PR                   |
| `fix/<slug>`    | Bug fix                             | Engineer    | `main` via PR                   |
| `hotfix/<slug>` | Critical production fix             | Engineer    | `main` directly (with approval) |
| `chore/<slug>`  | Non-functional (deps, config, docs) | Engineer    | `main` via PR                   |

**Rules:**

- Never commit directly to `main`.
- Branch names must be lowercase, hyphen-separated: `feat/user-auth`, not `Feature/UserAuth`.
- Delete branches after merging.

---

## 2. Commit Convention

Format: `<type>(<scope>): <short description>`

The `(<scope>)` is optional but recommended for larger codebases.

| Type       | Use Case                                 |
| :--------- | :--------------------------------------- |
| `feat`     | New functionality                        |
| `fix`      | Bug fix                                  |
| `test`     | Adding or updating tests                 |
| `docs`     | Documentation only                       |
| `refactor` | Code restructure without behavior change |
| `perf`     | Performance improvement                  |
| `chore`    | Build, config, dependency updates        |
| `ci`       | CI/CD configuration                      |
| `security` | Security fix or hardening                |

**Examples:**

```
feat(auth): add JWT refresh token endpoint
fix(quota): prevent double-deduction on concurrent requests
test(auth): cover token expiry edge case
security: enforce ownership check in DELETE /resources/:id
```

**Rules:**

- Description in imperative mood: "add", not "added" or "adds".
- Max 72 characters in the subject line.
- If the commit closes an issue: add `Closes #123` in the body.

---

## 3. Pull Request Workflow

### Opening a PR

1. Ensure your branch is up to date with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Run the full local pre-flight:
   ```bash
   [npm run lint]
   [npm test]
   ```
3. Push and open the PR.

### PR description template

Use the template at [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) — GitHub loads it automatically when opening a PR.

### Review rules

- Every PR requires **at least 1 approval** before merging.
- Author must not merge their own PR (except hotfixes with explicit lead approval).
- Reviewer is responsible for understanding the change — "LGTM" without reading is not a review.
- Address all comments before merging — either fix or explicitly explain why not.

### Merging

- Use **squash merge** for feature branches — keeps `main` history clean.
- Use **merge commit** for hotfixes — preserves the hotfix context.
- Delete the source branch after merge.

---

## 4. Pre-Commit Hooks

The project uses a native pre-commit hook (no external dependency) that runs automatically on `git commit`.

**Install once after cloning:**

```bash
sh scripts/install-hooks.sh
```

This copies `scripts/pre-commit.sh` to `.git/hooks/pre-commit`. The hook runs:

```
[npm run lint] → [npm run typecheck] → [npm test]
```

If the hook fails:

1. Read the error output carefully.
2. Fix the reported issue.
3. Stage the fix: `git add <files>`
4. Retry the commit — do **not** bypass with `--no-verify`.

> `git commit --no-verify` is forbidden except in hotfix scenarios with explicit tech-lead approval documented in the PR description.

---

## 5. Code Review Standards

### What reviewers check

| Layer         | What to verify                                                               |
| :------------ | :--------------------------------------------------------------------------- |
| Correctness   | Does the code do what the PR says? Does it handle edge cases?                |
| Security      | New endpoints authenticated? Ownership checks present? No injection vectors? |
| Tests         | Are the right things tested? Are tests hermetic (no real I/O in unit tests)? |
| Architecture  | Does it follow the Dependency Rule? No cross-layer violations?               |
| Documentation | CLASS_MAP updated? State machine updated if new states added?                |

### What reviewers do NOT nitpick

- Formatting — handled by the linter/formatter automatically.
- Minor naming preferences — only raise if genuinely misleading.

---

## 6. Working with the Knowledge Base

The `.agent/context/` directory is the project's engineering brain. It is used by both
humans and AI agents. Keep it accurate.

**Rules:**

- Adding a file to `.agent/context/`? → Register it in `AGENTS.md` in **the same commit**.
- Changing a service's responsibilities? → Update `CLASS_MAP.md`.
- Adding a new stateful subsystem? → Add an FSM to `STATE_MACHINE.md`.
- Making an architectural decision? → Record it as an ADR in `rfcs/`.
- Finding a new antipattern? → Add it to `ANTIPATTERNS.md`.
- Making a smaller scoped decision? → Use `rfcs/ADR-TEMPLATE.md` instead of a full RFC.

**RFC file naming convention:** `RFC-NNN.yaml` or `RFC-NNN-short-slug.yaml` where `NNN` is a zero-padded three-digit number (e.g., `RFC-001.yaml`, `RFC-003-auth-redesign.yaml`). The number must be unique and sequential. The `risk-check` CI workflow parses filenames by this pattern.

CI enforces the `AGENTS.md` guard via `tests/unit/documentation.test.ts`.

---

## 7. Handling Conflicts

```bash
# 1. Fetch latest main
git fetch origin

# 2. Rebase your branch (preferred over merge for feature branches)
git rebase origin/main

# 3. Resolve each conflict file by file
# Edit the file, remove conflict markers (<<<<, ====, >>>>)
git add <resolved-file>
git rebase --continue

# 4. If rebase becomes too complex, discuss with the team before force-pushing
```

Never discard changes without understanding them — "theirs" or "ours" blindly can
silently delete important work.

> **VS Code users:** use the Source Control panel or GitLens conflict editor.

---

## 8. Reporting Issues

When opening a bug report, include:

- **Expected behavior** — what should have happened.
- **Actual behavior** — what happened instead.
- **Reproduction steps** — minimal steps to reproduce.
- **Environment** — runtime version, OS, relevant config.
- **Logs** — relevant error output (redact any credentials).

For security vulnerabilities: do **not** open a public issue.
Contact the security team directly via [security contact channel].
