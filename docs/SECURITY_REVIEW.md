# Security Review Checklist — [PROJECT_NAME]

> Actionable FAIL/PASS checklist to run when touching security-sensitive code.
> Complements `SECURITY.md` (principles + CWE catalogue) and `THREAT_MODEL.md` (STRIDE).
> Stack-neutral: examples are pseudocode — apply the rule in your language's idiom.

## When to run this review

Trigger this checklist when a change does any of:

- Adds or modifies authentication / authorization
- Accepts user input, file uploads, or external data
- Adds or changes an API endpoint or RPC handler
- Reads/writes secrets, tokens, or credentials
- Handles payment, PII, or other sensitive data
- Integrates a third-party API or executes a subprocess

## Checklist

### 1. Secrets management

- ❌ **FAIL:** secret literal in source — `apiKey = "sk-live-1234"`
- ✅ **PASS:** secret read from environment / secret manager at runtime; never committed
- ✅ Rotate any secret that has ever appeared in logs, chat, or git history (see `SECURITY.md`)

### 2. Input validation

- ❌ **FAIL:** trust the caller — use raw input directly in a query, path, or command
- ✅ **PASS:** validate type/range/format at the boundary; reject by allowlist, not blocklist
- ✅ Treat every external value (query param, header, file name, env) as hostile until validated

### 3. Injection (CWE-89 / CWE-78 / CWE-79 / CWE-22)

- ❌ **FAIL:** build a query/command/path by string concatenation with user input
- ✅ **PASS — SQL:** parameterized queries / prepared statements only
- ✅ **PASS — shell:** pass an argument array, never a shell string; use `--` separators
- ✅ **PASS — HTML:** context-aware output encoding; set a Content-Security-Policy
- ✅ **PASS — path:** canonicalize, then reject `..` and absolute paths from user input

### 4. AuthN / AuthZ

- ❌ **FAIL:** check authentication but not authorization (logged-in ≠ allowed)
- ✅ **PASS:** enforce authorization on every protected resource, server-side, per request
- ✅ Deny by default; fail closed on error (an exception must not grant access)
- ✅ Tokens: short TTL, narrow scope, server-side revocation path (ties to SM-03 in `STATE_MACHINE.md`)

### 5. Error handling & disclosure

- ❌ **FAIL:** return stack traces, SQL errors, or internal paths to the client
- ✅ **PASS:** generic error to the caller; full detail only in server logs
- ✅ Do not log secrets, tokens, or full PII

### 6. Dependencies & supply chain

- ✅ No new dependency without review (see `DEPENDENCY_POLICY.md`)
- ✅ Pin versions; run the audit gate (`npm audit` / `pip-audit` / equivalent) in CI
- ✅ Flag dependencies with no release in > 2 years for replacement

### 7. Data protection

- ✅ Encrypt sensitive data in transit (TLS) and, where required, at rest
- ✅ Apply least-privilege to every actor: process, DB user, IAM role, token scope
- ✅ Classify and minimize PII; honor retention and erasure (see `DATA_PRIVACY.md`)

## Outcome

- **Pass:** every applicable item is ✅ — change may merge.
- **Conditional:** an item cannot be met now — open a `[US-DEBT]` with the gap and a fix date.
- **Fail:** any ❌ remains — block the merge until resolved.

> This checklist is a floor, not a ceiling. A passing review is the minimum bar,
> not proof of security. For novel attack surface, do a STRIDE pass (`THREAT_MODEL.md`).
