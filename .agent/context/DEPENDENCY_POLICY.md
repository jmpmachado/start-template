# Dependency Policy — start-project

> Governs how dependencies are evaluated, introduced, updated, and retired.
> Apply this policy before every `npm install` / `pip install` / `cargo add` equivalent.
> Reactive CVE scanning (AUDIT_REPORT.md) is necessary but not sufficient — this policy
> adds the proactive layer.

---

## 1. Introduction Criteria

Before adding a dependency, answer all five questions. A "No" on any of them requires
team discussion before proceeding.

| Question                                | Threshold                                  |
| :-------------------------------------- | :----------------------------------------- |
| Is it actively maintained?              | Last release ≤ 12 months ago               |
| Does it have a permissive license?      | MIT / Apache-2.0 / BSD — see §3            |
| Is its CVE history clean?               | No unpatched P0/P1 CVEs                    |
| Is the dependency tree shallow?         | Transitive deps < 20 new packages          |
| Can we build this ourselves in < 1 day? | If yes, consider not adding the dependency |

**One-liner rule:** prefer boring, well-known libraries with 5+ years of production use
over novel, feature-rich alternatives with < 2 years of history.

---

## 2. Evaluation Checklist

Run this before every new dependency PR:

```
[ ] Checked npm/PyPI/crates.io for weekly download count (signal of community health)
[ ] Checked open issues count and last maintainer response date
[ ] Checked if the library is a single-maintainer project (bus factor = 1)
[ ] Ran CVE scan: npm audit / pip audit / cargo audit
[ ] Checked license via: license-checker / pip-licenses / cargo license
[ ] Verified the dependency is not already provided by an existing library in the project
[ ] Pinned to a specific version (not a floating range like ^1.x in production)
```

---

## 3. License Policy

| License              | Status     | Notes                                  |
| :------------------- | :--------- | :------------------------------------- |
| MIT                  | ✅ Allowed | No conditions                          |
| Apache-2.0           | ✅ Allowed | Patent grant included                  |
| BSD-2/3-Clause       | ✅ Allowed | Attribution required in docs           |
| ISC                  | ✅ Allowed | Functionally equivalent to MIT         |
| MPL-2.0              | ⚠️ Review  | File-level copyleft — consult legal    |
| LGPL-2.1/3.0         | ⚠️ Review  | Dynamic linking may be acceptable      |
| GPL-2.0/3.0          | ❌ Blocked | Copyleft propagates to entire codebase |
| AGPL-3.0             | ❌ Blocked | Network use triggers copyleft          |
| Proprietary          | ❌ Blocked | Requires explicit legal approval       |
| Unknown / Unlicensed | ❌ Blocked | No usage rights                        |

---

## 4. Version Pinning Strategy

| Environment             | Strategy                | Rationale                                |
| :---------------------- | :---------------------- | :--------------------------------------- |
| Production dependencies | Exact version (`1.2.3`) | Reproducible builds, no surprise updates |
| Dev dependencies        | Caret range (`^1.2.3`)  | Easier tooling updates, no runtime risk  |
| Security patches        | Immediate update        | Override pinning for P0/P1 CVEs          |

**Lockfile policy:** always commit `package-lock.json` / `Pipfile.lock` / `Cargo.lock`.
Never `.gitignore` lockfiles.

---

## 5. Update Policy

| Update Type            | Frequency                        | Approval                                    |
| :--------------------- | :------------------------------- | :------------------------------------------ |
| Patch releases (1.2.x) | Weekly, automated                | PR + CI pass                                |
| Minor releases (1.x.0) | Monthly, manual review           | PR + review + CI pass                       |
| Major releases (x.0.0) | Planned sprint, with testing     | RFC if breaking changes affect architecture |
| Security patches (any) | Immediate (within 48h for P0/P1) | Expedited review, no freeze exemption       |

---

## 6. Deprecation and Removal

A dependency is a candidate for removal when:

- No release in > 24 months.
- Maintainer has publicly archived the repository.
- A P0/P1 CVE exists with no upstream fix after 30 days.
- The dependency is no longer used (verify with `depcheck` / `pip-check` / `cargo machete`).
- A significantly better alternative exists and migration cost is justified.

**Removal process:**

1. Open a chore PR with the removal.
2. Add an ADR documenting why it was removed and what replaced it (if applicable).
3. Update `AUDIT_REPORT.md` if the removal closes a CVE.

---

## 7. Forbidden Patterns

- **No `*` or `latest` version specifiers** in production dependencies.
- **No `npm install --legacy-peer-deps`** without documenting why in the PR.
- **No forked copies** of libraries committed to the repository — use a proper fork on a package registry.
- **No patching node_modules directly** — use `patch-package` or equivalent with a documented reason.
- **No dependencies that shell out** (spawn external processes) unless explicitly reviewed for CWE-78.

---

## 8. Dependency Inventory

> Maintain this table for all non-trivial dependencies (exclude dev tooling).
> Update when adding, updating to a major version, or removing a dependency.

| Package     | Version | Purpose   | License   | Last Audit   | Notes |
| :---------- | :------ | :-------- | :-------- | :----------- | :---- |
| `[package]` | `[v]`   | [purpose] | [license] | [YYYY-MM-DD] | —     |

---

## 9. Per-Language Registry & Audit Reference

| Language | Registry | Lockfile | Audit command | CVE source |
|---|---|---|---|---|
| C/C++ (vcpkg) | vcpkg registry | `vcpkg.json` + `vcpkg-lock.json` | `vcpkg x-check-support` | OSV / NVD |
| C/C++ (Conan) | ConanCenter | `conanfile.txt` / `conanfile.py` | `conan audit` | NVD |
| Fortran (fpm) | fpm registry | `fpm.toml` | Manual / OSV scan | OSV |
| Python (pip) | PyPI | `requirements.txt` / `pyproject.toml` | `pip-audit` / `safety` | PyPA Advisory DB |
| Python (conda) | conda-forge / Anaconda | `environment.yml` | `conda audit` / `pip-audit` | NVD |
| Rust | crates.io | `Cargo.lock` | `cargo audit` / `cargo deny` | RustSec Advisory DB |
| Java (Maven) | Maven Central | `pom.xml` | `mvn dependency-check:check` | NVD / OSV |
| Java (Gradle) | Maven Central | `gradle.lockfile` | `./gradlew dependencyCheckAnalyze` | NVD |
| .NET | NuGet | `packages.lock.json` | `dotnet list package --vulnerable` | GitHub Advisory DB |
| R | CRAN / Bioconductor | `renv.lock` | `oysteR::audit_installed_r_pkgs()` | OSV |
| Lua | LuaRocks | `*.rockspec` | Manual / OSV scan | OSV |
| Julia | Pkg.jl General registry | `Manifest.toml` | `Pkg.audit()` | Julia Security Advisories + OSV |
| Zig | `build.zig.zon` (URL + hash, no centralized registry) | `build.zig.zon` (content-hash-pinned) | Manual — check OSV and upstream issue tracker | OSV / NVD (search "zig" + package name) |

> **Zig note (as of 2026):** Zig has no centralized package registry. All dependencies are fetched by URL with a hash pin in `build.zig.zon`. Treat any dependency change as requiring a full manual audit. Verify the URL origin and inspect source diffs for any upstream changes.

### Toolchain Integrity

Pin compiler/toolchain versions in CI to prevent supply-chain attacks on the build itself:

| Tool | Pin mechanism |
|---|---|
| GCC / Clang | CI image tag + `apt-get install gcc=[version]` |
| LLVM | `llvm-[version]` package; verify with `sha256sum` |
| Rust toolchain | `rust-toolchain.toml` committed in repo |
| Python interpreter | `.python-version` (pyenv) or `PYTHON_VERSION` in CI matrix |
| Java JDK | `uses: actions/setup-java@v4` with explicit `java-version` |
| .NET SDK | `global.json` `sdk.version` field |
| R | `r-version` in CI matrix; `renv` for packages |
| TypeScript/JS | npm / pnpm / Yarn | `package-lock.json` / `pnpm-lock.yaml` | `npm audit` | GitHub Advisory DB |
| Kotlin | Maven Central / JitPack | `gradle.lockfile` | `./gradlew dependencyCheckAnalyze` | NVD |
| Zig | `build.zig.zon` | Content-addressed hash (built-in) | Manual review | — |
| CUDA | NVIDIA NGC / CUDA Toolkit | `CMakeLists.txt` pinned version | `compute-sanitizer` | NVIDIA Security Bulletins |
| Bash/Shell | System packages | `apt.lock` / `Brewfile` | `trivy fs` | CVE databases |
| SQL | DB engine / migration tools | Flyway/Liquibase version in CI | `snyk test` (ORM deps) | NVD |

---

## Automated Dependency Updates (Renovate / Dependabot)

### Preferred tool

**Renovate** (see `TECH_RADAR.md`). Dependabot acceptable when a project is on a platform without Renovate support. Never run both simultaneously on the same repo.

### Update cadence policy

| Update type | Frequency | Auto-merge eligibility |
|---|---|---|
| Security patch (Critical/High CVE) | Open PR within 1 h of advisory | Auto-merge after CI green; SLA per `SUPPLY_CHAIN.md` §7 |
| Patch (semver `x.y.Z`) | Daily batch (one PR per ecosystem) | Auto-merge if CI green + no test changes required |
| Minor (semver `x.Y.0`) | Weekly batch | Manual review; merge after 1 reviewer |
| Major (semver `X.0.0`) | Open immediately, no auto-merge | Manual review; ADR required if breaking change cascade |
| Dev-dependencies | Bundled weekly | Auto-merge if CI green |
| Lockfile maintenance | Weekly | Auto-merge if CI green |
| GitHub Actions versions | Weekly | Auto-merge if CI green; pin by SHA, not tag |
| Docker base images | Daily | Auto-merge patches; manual review for minor+ |

### Grouping rules

Renovate `packageRules` should group:

- All `@types/*` packages → one PR
- Storybook ecosystem → one PR
- ESLint + plugins → one PR
- Major framework updates → individual PRs (React, Vue, Angular, etc.)
- Linters/formatters → one PR per ecosystem (Ruff, Prettier, etc.)

### Auto-merge prerequisites (hard rules)

A dep-update PR auto-merges ONLY when ALL of:

- [ ] CI fully green (lint, type-check, unit, integration tests)
- [ ] No CODEOWNERS for the changed paths flagged it for manual review
- [ ] No security audit regression (new CVE introduced)
- [ ] Within update-cadence policy (above)
- [ ] Update is patch or dev-dep (or explicitly allowlisted via `Renovate.json` `automerge: true`)
- [ ] SBOM diff shows no unexpected new transitive deps (`SUPPLY_CHAIN.md` §2)
- [ ] PR sat ≥ 1 h after CI green (cooling-off window for human override)

### Schedule (low-noise hours)

Run Renovate during:
- Weekdays 06:00–10:00 local team time (review-fresh)
- Suppress weekends and major holidays
- Pause for 24 h before/after major release tags

### Vulnerability override path

If a transitive dep has a CVE and direct dep hasn't updated:

1. Verify exploitability in our context (not all CVEs apply).
2. If exploitable: pin the transitive (via `overrides` in `package.json`, `[patch]` in `Cargo.toml`, etc.).
3. Open upstream issue at direct dep; track in `DECISION_LOG.md`.
4. Re-evaluate weekly until upstream catches up.

### Configuration files (per repo)

| Tool | File | Documented in |
|---|---|---|
| Renovate | `renovate.json` or `.github/renovate.json` | This file |
| Dependabot | `.github/dependabot.yml` | This file |
| Snyk | `.snyk` | `SECURITY.md` |

### AI agent rule

When an AI agent updates a dependency manually (outside Renovate):

1. Check `TECH_RADAR.md` — never add a HOLD-ring dep.
2. Follow `SUPPLY_CHAIN.md` §9 new-dependency approval process.
3. Run the cadence check: is this a security patch? An emergency? Justify in PR description.
4. Update SBOM + lockfile in the same commit.
