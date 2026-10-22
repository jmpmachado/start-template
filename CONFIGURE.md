# CONFIGURE.md — Project Configuration Flags

> Fill this file when adopting the template. Flags control which tooling layers are active.

## TOOLING_NODE

Node.js tooling is required for the HTML/CSS/JS frontend and repository quality
checks. Use Node.js 24 or newer.

```env
TOOLING_NODE=true
```

`infra/scripts/install_check.py` reads this flag at runtime and verifies Node.js.

## CI

The repository ships one GitHub Actions workflow: `.github/workflows/ci.yml`.
It runs only on pushes and pull requests, on Linux, with two parallel jobs:

| Job | Validation |
| :--- | :--- |
| Web tooling | Node 24 install, lint, typecheck, Markdown lint, and tests |
| .NET 9 | Restore, build, and test `tests/backend/backend.tests.csproj` |

Dependabot, scheduled scans, PR-comment automation, and separate duplicate CI
lanes are intentionally absent. Add any new remote automation only after an
explicit review.
