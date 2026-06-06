# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

> Changes staged for the next release. Move to a versioned section on release.
> Cut a release when this section exceeds 10 entries.

### Added

- Initial multi-stack template: HTML5 + CSS + JS frontend, .NET 9 Minimal API backend
- Governance layer: AGENTS.md, GEMINI.md, AGILE_CONFIG.md, memory.json, DECISION_LOG.md
- CI matrix configured for `PROJECT_STACK=multi`
- DOTNET_SETUP.md: .NET 9 SDK and VS2022 Build Tools setup guide

---

## [x.y.z] — YYYY-MM-DD

### Added

- [Example: `POST /auth/refresh` endpoint for JWT token renewal]

### Fixed

- [Example: ownership check missing on `DELETE /resources/:id` (CWE-284)]

### Security

- [Example: upgraded `[library]` from 1.2.3 to 1.2.4 — CVE-XXXX-XXXXX]

---

<!-- CHANGELOG RULES

1. Every PR that changes observable behavior must include a CHANGELOG entry.
2. Security fixes always go under "Security" even if they are also "Fixed".
3. Use past tense under KaC section headers ("Added", "Fixed").
   Commit messages use imperative mood — that is a separate rule.
4. Reference issue or PR numbers where helpful: "Fix IDOR in resource deletion (#42)".
5. Do not document internal refactors unless they affect public API or behavior.
6. "Unreleased" is always present at the top — cut a release when it exceeds 10 entries.

RELEASE PROCESS

1. Rename [Unreleased] to [x.y.z] — YYYY-MM-DD
2. Add a new empty [Unreleased] section at the top
3. Tag the commit: git tag -a vx.y.z -m "Release x.y.z"
4. Push the tag: git push origin vx.y.z

VERSION BUMP RULES (Semantic Versioning)

- MAJOR (x.0.0): breaking change to public API or behavior
- MINOR (x.y.0): new feature, backwards compatible
- PATCH (x.y.z): bug fix or security patch, backwards compatible

-->
