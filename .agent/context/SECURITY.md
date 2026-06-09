# Security Policy — [PROJECT_NAME]

> Master security policy. Every engineer must read this before their first PR.
> Fill in project-specific values in all `[placeholder]` sections.

---

## 1. AI Agent Guidelines

Rules governing AI assistant behavior in this codebase:

- **Verify Before Acting:** Validate flags, credentials, and inputs before executing. Reject shell metacharacters (CWE-78).
- **Confirm Human:** Destructive operations (DROP, delete, rm -rf, force-push) require explicit user approval — never execute autonomously.
- **Least Privilege:** Request only the permissions necessary for the current task. Tokens and credentials must have short TTL and narrow scope.
- **Immutable Audit Trail:** All actions with side effects must be logged with structured, tamper-resistant records.
- **Fail Safe:** On anomaly or ambiguity, halt and surface the uncertainty to the operator — never proceed with a destructive action under uncertainty.

---

## 2. Master Security Policy

**Core Principles:**

| Principle         | Implementation                                                                        |
| :---------------- | :------------------------------------------------------------------------------------ |
| Zero Trust        | No component, user, or network is trusted by default — verify every request           |
| Defense in Depth  | Multiple independent security layers: WAF → Auth → Input Validation → Sandbox → Audit |
| Secure by Default | Features that increase attack surface are disabled by default; opt-in to enable       |
| Least Privilege   | Minimum permissions at every layer: process, DB user, IAM role, JWT scope             |
| Fail Secure       | On authentication failure, deny access — never fall back to permissive mode           |

---

## 3. Authentication and Authorization Controls

> Fill in project-specific values.

| Control         | Requirement                      | Project Value |
| :-------------- | :------------------------------- | :------------ |
| Token type      | [JWT / session / OAuth2]         | [value]       |
| Secret entropy  | ≥256 bits                        | [value]       |
| Token TTL       | [access: 15min / refresh: 7d]    | [value]       |
| Rotation policy | Semi-annual minimum              | [value]       |
| Rate limiting   | [N req/min per IP]               | [value]       |
| Lockout policy  | [N failed attempts → Xmin block] | [value]       |
| MFA requirement | [required / optional]            | [value]       |

---

## 4. Execution Sandbox Controls

> Fill in if the project executes untrusted code, processes, or external input.

| Control              | Requirement                     | Project Value |
| :------------------- | :------------------------------ | :------------ |
| Process isolation    | Container / namespace / sandbox | [value]       |
| CPU limit            | Hard cap per execution          | [value]       |
| Memory limit         | Hard cap per process            | [value]       |
| Wall-clock timeout   | Hard timeout per execution      | [value]       |
| Network access       | Blocked by default              | [value]       |
| Filesystem isolation | Scoped temp dir, no host access | [value]       |
| Privilege level      | Unprivileged user (not root)    | [value]       |

---

## 5. Threat Model (STRIDE)

> Adapt to actual threat actors and surfaces for this project.

| Threat                     | Attack Vector                      | Mitigation                                       | Status |
| :------------------------- | :--------------------------------- | :----------------------------------------------- | :----- |
| **Spoofing**               | Forged credentials / tokens        | Strong secrets, token signing, short TTL         | ⬜     |
| **Tampering**              | Payload manipulation in transit    | TLS in transit, input validation, HMAC           | ⬜     |
| **Repudiation**            | Action denial                      | Structured audit log with actor ID               | ⬜     |
| **Information Disclosure** | Error leakage, path traversal      | Generic error messages in prod, allowlist paths  | ⬜     |
| **Denial of Service**      | Resource exhaustion, infinite loop | Rate limiting, execution timeout, quotas         | ⬜     |
| **Elevation of Privilege** | Sandbox escape, IDOR, auth bypass  | Ownership checks, sandbox hardening, authz tests | ⬜     |

Status: ✅ Mitigated | ⚠️ Partially mitigated | ❌ Unmitigated | ⬜ Not evaluated

---

## 6. Secrets Management

- All secrets must be stored outside version control — `.env` files in `.gitignore`.
- Use a secrets manager (Vault, AWS Secrets Manager, GitHub Secrets) for production.
- Document all required environment variables in `.env.example` with redacted values.
- Rotate secrets after any potential exposure — assume breach, act immediately.
- Never log secrets — audit logs must redact credential fields.

---

## 7. Dependency Security

- Run a CVE scan on every PR (`npm audit`, `pip audit`, `cargo audit`, or equivalent).
- Block merge on P0/P1 CVEs unless an explicit exception is approved and documented.
- Pin dependency versions in lockfiles; review updates before merging.
- Flag unmaintained dependencies (no release > 2 years) for replacement.

---

## 8. Security Review Checklist (per PR)

- [ ] No new `shell: true` / `exec(string)` calls.
- [ ] No new hard-coded credentials or secrets.
- [ ] All new endpoints have authentication + authorization checks.
- [ ] All new file path operations resolve and validate against an allowlist.
- [ ] Error responses do not leak stack traces or internal paths in production.
- [ ] New dependencies scanned for CVEs.
- [ ] Ownership checks present on all data mutation operations.

---

## 9. Language-Specific Security Controls

See `LANGUAGE_TOOLCHAINS.md` for toolchain details and `RUNTIME_MODELS.md` for memory models.

### Memory Safety (C / C++ / Fortran)

| CWE | Risk | Mitigation |
|---|---|---|
| CWE-119 | Buffer overflow | ASan + bounds checking; `std::span`; `-D_FORTIFY_SOURCE=2` |
| CWE-416 | Use-after-free | ASan; RAII; `unique_ptr`/`shared_ptr` |
| CWE-476 | Null pointer dereference | UBSan; compiler `-Wnull-dereference` |
| CWE-362 | Race condition | TSan; `std::atomic`; lock hierarchies |
| CWE-190 | Integer overflow | UBSan; `__builtin_add_overflow`; `std::numeric_limits` |
| CWE-121 | Stack overflow | `-fstack-protector-strong`; limit recursion depth |

### Hardware-Level Defenses (C/C++)

| Defense | Compiler flag | Mitigates | Notes |
|---|---|---|---|
| Stack protector (all) | `-fstack-protector-all` (GCC/Clang) | CWE-121, CWE-787 | Stronger than `-strong`; small perf cost |
| Safe stack | `-fsanitize=safe-stack` (Clang) | CWE-121 | Separates unsafe stack from safe stack |
| ARM Memory Tagging Extension | `-march=armv8.5-a+memtag` + `-fsanitize=memtag` | CWE-119, CWE-416 | Hardware heap/stack tag checking; ARMv8.5-A+ only |
| SPARC ADI (Application Data Integrity) | Compiler + OS support required | CWE-119 | Hardware memory coloring on SPARC M7+ |
| Control Flow Integrity | `-fsanitize=cfi` (Clang) | CWE-691 | Prevents indirect call/jump to unexpected targets |
| Fortify source | `-D_FORTIFY_SOURCE=3` | CWE-119, CWE-126 | Glibc compile-time + runtime buffer checks |

**Fortran-specific:** `-fbounds-check` / `-fcheck=all` catches array out-of-bounds; `-ffpe-trap=invalid,zero,overflow` traps FP exceptions.

### `unsafe` Code (Rust)

Every `unsafe` block requires:
1. A `// SAFETY:` comment stating the invariant that makes the code sound.
2. Review by a second engineer in PR.
3. Tracking in `AUDIT_REPORT.md` under the unsafe inventory section.

Never use `unsafe` to silence borrow-checker errors — fix the design instead.

### .NET Security

| Risk | Mitigation |
|---|---|
| .NET deserialization | Avoid `BinaryFormatter` (deprecated, removed in .NET 9); use `System.Text.Json` with `TypeInfoResolver` for polymorphic types. **Never use `DataContractSerializer` or `NetDataContractSerializer` on untrusted input** (CWE-502) — both allow arbitrary type instantiation; `NetDataContractSerializer` is deprecated and must not be used in new code. |
| P/Invoke CWE-78 | Validate all strings before passing to native; use `SafeHandle` |

### Web / Managed Runtimes (TypeScript / JavaScript)

- Prototype pollution (CWE-1321): freeze prototypes; reject `__proto__`/`constructor` keys on deserialization.
- XSS (CWE-79): default escaping in templates; CSP header; `dangerouslySetInnerHTML` reviews required.
- Path traversal (CWE-22): canonicalize paths; reject `..` and absolute paths from user input.
- Open redirect (CWE-601): allowlist destination URLs; never reflect raw `redirect` query params.
- `tsconfig.json` must enable `strict`, `noImplicitAny`, `noUncheckedIndexedAccess`.

### Shell Scripts (Bash / POSIX sh)

- Command injection (CWE-78): never interpolate user input into commands — use arrays and `--` separators.
- Path traversal (CWE-22): validate paths against an allowlist; reject `..`.
- Temp file race (CWE-377): use `mktemp -d` exclusively; never predictable `/tmp/$$` names.
- Strict mode mandatory: `set -euo pipefail` at the top of every script.

### Persistent Storage (SQL)

- SQL injection (CWE-89): parameterized queries only; ORM with prepared-statement enforcement.
- Information exposure via error messages (CWE-209): never leak DB errors to clients; map to `INTERNAL_ERROR`.
- Mass assignment / over-fetch (CWE-915, CWE-213): explicit field allowlist; column-level grants where possible.
- Migration safety: dry-run every migration; require explicit DBA approval for `DROP`/`ALTER COLUMN` on prod-sized tables.

### Dependency Audit Commands

| Language | Command |
|---|---|
| C/C++ | `vcpkg x-package-info`; `conan audit`; `trivy fs`; `grype dir:.` |
| Python | `pip-audit`; `safety check` |
| Rust | `cargo audit`; `cargo deny check advisories` |
| Java | `mvn dependency-check:check`; `./gradlew dependencyCheckAnalyze` |
| .NET | `dotnet list package --vulnerable --include-transitive` |
| R | `oysteR::audit_installed_r_pkgs()` |
| Julia | `Pkg.audit()` |
| TypeScript/JS | `npm audit --audit-level=high`; `snyk test` |
| Kotlin | `./gradlew dependencyCheckAnalyze`; Snyk Gradle plugin |
| Zig | Manual review; `zig build` dependency hash verification |
| CUDA | `compute-sanitizer`; nvcc with `-Xcompiler -fstack-protector-all` |
| Bash/Shell | `shellcheck` (CWE-78 command injection); `trivy fs` for image scanning |
| SQL | `sqlfluff` + parameterized query enforcement; `sqlmap` (pen-test only) |

---

## 10. Microsoft SDL — Sprint-Stage Mapping

> The Microsoft Security Development Lifecycle (SDL) embeds security practices into every phase of the engineering process. This mapping translates SDL phases into the sprint-based workflow of this template. Every sprint touches multiple SDL phases simultaneously.

### SDL Phase Overview

| SDL Phase | Goal | When in Sprint |
| :--- | :--- | :--- |
| **Training** | Engineers understand secure coding, STRIDE, OWASP Top 10 | Pre-project onboarding; refreshed when `THREAT_MODEL.md` or `SECURITY.md` changes |
| **Requirements** | Security requirements defined before implementation | Sprint planning — every user story with an auth, data, or network element must include security acceptance criteria |
| **Design** | Threat model updated; attack surface minimized | RFC authoring (see `DESIGN_DOC_GUIDE.md`); `THREAT_MODEL.md` updated before implementation begins |
| **Implementation** | Secure coding standards enforced; banned APIs avoided | During coding — ESLint security plugin, `tsc --strict`, language-specific controls (§9 above) |
| **Verification** | Security testing: SAST, DAST, dependency audit, fuzzing | CI pipeline (`security.yml`) + PR review (§8 checklist) |
| **Release** | Final security review; PRODUCTION_READINESS_REVIEW.md | Before merge to `main` for any new public endpoint, external integration, or background job |
| **Response** | Incident response; CVE disclosure; patch SLA | `INCIDENT_RUNBOOK.md`, `THREAT_MODEL.md` updated post-incident |

### Per-Sprint SDL Checklist

**Sprint planning (Requirements + Design):**
- [ ] New user stories with auth, data collection, or network calls have explicit security acceptance criteria.
- [ ] `THREAT_MODEL.md` reviewed for relevance to sprint scope; new threats added if attack surface is expanding.
- [ ] RFCs for new features include a Security section (see `DESIGN_DOC_GUIDE.md §Security`).

**During implementation (Implementation):**
- [ ] Banned API list consulted: no `eval`, no raw `innerHTML`, no `shell=True`, no `ObjectInputStream` on untrusted data (see §9).
- [ ] All new inputs from untrusted sources validated and sanitized before use.
- [ ] Secrets sourced from environment — never hardcoded (enforced by `detect-secrets` pre-commit).

**PR review gate (Verification):**
- [ ] `npm audit --audit-level=high` (or language equivalent) passes with zero new high/critical findings.
- [ ] ESLint `eslint-plugin-security` rules pass: `no-eval`, `detect-child-process`, `detect-non-literal-fs-filename`.
- [ ] §8 Security Review Checklist completed by reviewer.
- [ ] If attack surface changed: `THREAT_MODEL.md` diff present in PR.

**Pre-release (Release):**
- [ ] `PRODUCTION_READINESS_REVIEW.md` Security section completed and filed in `DECISION_LOG.md`.
- [ ] Penetration test or security-focused code review completed for any new authentication flow, payment integration, or PII-handling path.
- [ ] Incident response runbook (`INCIDENT_RUNBOOK.md`) updated if new failure modes were introduced.

**Post-incident (Response):**
- [ ] `THREAT_MODEL.md` updated with new attack vector discovered.
- [ ] CVE filed (if applicable) within 90 days of discovery (coordinated disclosure).
- [ ] Patch SLA met: Critical ≤ 24 h, High ≤ 7 days, Medium ≤ 30 days, Low ≤ 90 days (see `DEPENDENCY_POLICY.md §Vulnerability Response`).

### Banned Functions / APIs

The following are banned unconditionally. Any use requires a documented exception in `DECISION_LOG.md` and a second engineer's sign-off:

| Language | Banned | Reason | Alternative |
| :--- | :--- | :--- | :--- |
| JS/TS | `eval()`, `new Function()` | CWE-95 code injection | Static imports; JSON.parse for data |
| JS/TS | `innerHTML =` (unsanitized) | CWE-79 XSS | `textContent`; DOMPurify for HTML |
| Python | `pickle.load()` on untrusted data | CWE-502 arbitrary code | `json`, `msgpack` |
| Python | `subprocess(..., shell=True)` | CWE-78 command injection | `subprocess(..., shell=False)` with list args |
| Java | `ObjectInputStream` on untrusted data | CWE-502 | Jackson with type allowlist |
| .NET | `BinaryFormatter`, `NetDataContractSerializer` | CWE-502 | `System.Text.Json` |
| Rust | `unsafe` without `// SAFETY:` comment | Unsound code | Add invariant comment; fix root design |
| SQL | String concatenation in queries | CWE-89 SQL injection | Parameterized queries only |
| Any | Hardcoded credentials in source | CWE-798 | Secrets manager / environment variables |
