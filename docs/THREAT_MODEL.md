# Threat Model — [PROJECT_NAME]

> Standalone STRIDE threat model. Fill in per component as the system is built.
> Update whenever the attack surface changes: new endpoint, new integration, new data type.
> Reference this document in `DEFINITION_OF_DONE.md` security gate and RFC security sections.
>
> **Method:** STRIDE per component + risk register.
> **Owner:** `[security-lead]` — review every 6 months or after any significant architecture change.

---

## 1. Assets and Security Objectives

| Asset                                       | Confidentiality   | Integrity | Availability | Owner            |
| :------------------------------------------ | :---------------- | :-------- | :----------- | :--------------- |
| User credentials (hashed passwords, tokens) | Critical          | Critical  | High         | `[auth-service]` |
| PII / user data                             | Critical          | High      | High         | `[user-service]` |
| `[Business entity]` data                    | `[High / Medium]` | High      | High         | `[service]`      |
| API keys / secrets                          | Critical          | Critical  | Medium       | Secrets manager  |
| Audit logs                                  | Medium            | Critical  | High         | `[log-service]`  |
| Source code                                 | Medium            | High      | Medium       | SCM              |

---

## 2. Trust Boundaries

```
                      ┌─────────────────────────────────────┐
  Public Internet     │         Internal Network            │
  ─────────────────   │   ─────────────────────────────────  │
  [Client / Browser]  │   [API Server] ──> [Database]       │
         │            │        │       ──> [Cache]          │
         │ HTTPS/TLS  │        │       ──> [Worker]         │
         ▼            │        ▼                             │
    [Load Balancer]───┼──> [API Server] ──> [External SaaS] │
                      │                     (crosses boundary│
                      └─────────────────────────────────────┘
```

**Boundary crossings that require explicit trust validation:**

| From                       | To                               | Validation mechanism                     |
| :------------------------- | :------------------------------- | :--------------------------------------- |
| Public Internet → API      | TLS termination at load balancer | Certificate pinning optional             |
| API Server → Database      | Password + TLS + network policy  | Least-privilege DB user                  |
| API Server → External SaaS | API key + TLS                    | Key rotation policy in `RUNBOOK.md §6.3` |
| Worker → API Server        | Internal mTLS or service token   | Short-lived token, narrow scope          |

---

## 3. STRIDE Threat Model

### 3.1 `[API Server / HTTP Layer]`

| Threat                | STRIDE                 | CWE      | Attack scenario                                   | Mitigation                                                                      | Residual risk |
| :-------------------- | :--------------------- | :------- | :------------------------------------------------ | :------------------------------------------------------------------------------ | :------------ |
| Token forgery         | Spoofing               | CWE-345  | Attacker crafts a JWT with elevated `role`        | HS256/RS256 with ≥256-bit secret; validate `alg`, `iss`, `exp` on every request | Low           |
| Cleartext transmission | Info Disclosure        | CWE-319  | Attacker reads JSON body in transit via MitM      | TLS everywhere; reject HTTP; HTTPS-only cookies                                 | Low           |
| Missing audit trail   | Repudiation            | CWE-778  | User denies performing an action                  | Append-only audit log with `user_id`, `action`, `timestamp`, `ip`               | Low           |
| Stack trace leakage   | Info Disclosure        | CWE-209  | 500 error exposes internal paths                  | Strip stack traces in production; generic error messages                        | Low           |
| Endpoint flooding     | Denial of Service      | CWE-770  | Bot sends 10k req/s to POST /auth                 | Rate limit per IP (auth endpoints: 5 req/min); CAPTCHA optional                 | Medium        |
| JWT `alg:none` bypass | Elevation of Privilege | CWE-327  | Attacker sends unsigned token with `"alg":"none"` | Whitelist allowed algorithms; reject `none`                                     | Low           |

### 3.2 `[Authentication / Authorization Layer]`

| Threat                              | STRIDE                 | CWE      | Attack scenario                                           | Mitigation                                                               | Residual risk |
| :---------------------------------- | :--------------------- | :------- | :-------------------------------------------------------- | :----------------------------------------------------------------------- | :------------ |
| Credential stuffing                 | Spoofing               | CWE-307  | Automated login with leaked credential lists              | Account lockout after N failures; anomaly detection                      | Medium        |
| IDOR                                | Tampering              | CWE-639  | User A accesses User B's resource via `/resources/{B_id}` | Ownership check on every resource read/write; tests in `tests/security/` | Low           |
| Privilege escalation via role claim | Elevation of Privilege | CWE-269  | Attacker modifies `role` claim in token payload           | Server-side role lookup; never trust client-provided role                | Low           |
| Session fixation                    | Spoofing               | CWE-384  | Attacker pre-sets session ID before login                 | Regenerate session ID on authentication                                  | Low           |
| Refresh token theft                 | Info Disclosure        | CWE-522  | Attacker steals refresh token from storage                | HttpOnly + Secure cookies; short TTL; rotation on use; revocation list   | Medium        |

### 3.3 `[Data Layer / Database]`

| Threat                              | STRIDE          | CWE      | Attack scenario                                   | Mitigation                                                           | Residual risk |
| :---------------------------------- | :-------------- | :------- | :------------------------------------------------ | :------------------------------------------------------------------- | :------------ |
| SQL injection                       | Tampering       | CWE-89   | Attacker injects SQL via user input field         | Parameterized queries only — no string concatenation; ORM validation | Low           |
| Mass assignment                     | Tampering       | CWE-915  | Attacker sends extra fields to elevate privileges | Explicit allowlist of writable fields; DTO validation layer          | Low           |
| Data exfiltration via over-fetching | Info Disclosure | CWE-213  | API returns more fields than the caller needs     | Field-level authorization; projection on queries                     | Medium        |
| Backup exposure                     | Info Disclosure | CWE-311  | Unencrypted backup accessed by unauthorized party | Backups encrypted at rest; access restricted to ops role             | Low           |
| Schema inference via error messages | Info Disclosure | CWE-209  | DB error exposes table/column names               | Catch all DB errors; return generic `INTERNAL_ERROR`                 | Low           |

### 3.4 `[Background Workers / Job Queue]`

| Threat                  | STRIDE            | CWE      | Attack scenario                                | Mitigation                                                  | Residual risk |
| :---------------------- | :---------------- | :------- | :--------------------------------------------- | :---------------------------------------------------------- | :------------ |
| Job injection           | Tampering         | CWE-20   | Attacker enqueues a job with a crafted payload | Validate and sanitize job payload on enqueue and on dequeue | Low           |
| Unbounded job execution | Denial of Service | CWE-400  | Malicious job consumes all worker CPU          | Hard CPU and wall-clock timeout per job; resource limits    | Low           |
| Replay attack           | Spoofing          | CWE-294  | Attacker re-enqueues a completed job           | Idempotency key per job; deduplication window               | Low           |

### 3.5 `[External Integrations]`

| Threat                     | STRIDE          | CWE      | Attack scenario                                          | Mitigation                                                       | Residual risk |
| :------------------------- | :-------------- | :------- | :------------------------------------------------------- | :--------------------------------------------------------------- | :------------ |
| SSRF                       | Info Disclosure | CWE-918  | Attacker tricks the server into fetching an internal URL | Allowlist of permitted outbound domains; block RFC-1918 ranges   | Low           |
| Webhook spoofing           | Spoofing        | CWE-345  | Attacker sends a fake webhook event                      | Verify HMAC-SHA256 signature on every webhook; reject if invalid | Low           |
| Third-party data poisoning | Tampering       | CWE-20   | External API returns malicious payload                   | Validate and sanitize all external data before processing        | Medium        |

---

## 4. Risk Register

| ID     | Threat                     | Component     | Likelihood       | Impact           | Risk score | Status   | Mitigation                  |
| :----- | :------------------------- | :------------ | :--------------- | :--------------- | :--------- | :------- | :-------------------------- |
| TR-001 | Credential stuffing        | Auth          | Medium           | High             | **High**   | Open     | Lockout + anomaly detection |
| TR-002 | Refresh token theft        | Auth          | Low              | High             | **Medium** | Open     | HttpOnly cookie + rotation  |
| TR-003 | Data over-fetching         | API           | Medium           | Medium           | **Medium** | Open     | Field-level authorization   |
| TR-004 | Third-party data poisoning | Integrations  | Low              | Medium           | **Low**    | Accepted | Input validation            |
| TR-005 | `[threat description]`     | `[component]` | `[Low/Med/High]` | `[Low/Med/High]` | `[score]`  | Open     | `[mitigation]`              |

**Risk scoring:** Likelihood × Impact. `Low×Low = Low`, `Med×High = High`, `High×High = Critical`.

---

## 5. Security Controls Inventory

| Control               | Implementation                                                  | Status          |
| :-------------------- | :-------------------------------------------------------------- | :-------------- |
| TLS everywhere        | Enforced at load balancer; HTTP redirected to HTTPS             | `[✓ / pending]` |
| JWT validation        | `alg` whitelist, `exp` check, `iss` validation                  | `[✓ / pending]` |
| Input validation      | DTO schema validation on all endpoints                          | `[✓ / pending]` |
| Parameterized queries | ORM / prepared statements — no string concatenation             | `[✓ / pending]` |
| Rate limiting         | `[N] req/min per IP` on auth; `[N] req/min per token` elsewhere | `[✓ / pending]` |
| Audit logging         | Append-only, structured, no PII in values                       | `[✓ / pending]` |
| Secret management     | Secrets in `[vault / SSM / env]` — never in source code         | `[✓ / pending]` |
| Dependency audit      | `[npm audit / pip audit / cargo audit / trivy]` in CI; block on high/critical CVEs | `[✓ / pending]` |
| CORS policy           | Allowlist of permitted origins; no wildcard in production       | `[✓ / pending]` |
| Security headers      | `HSTS`, `X-Frame-Options`, `CSP`, `X-Content-Type-Options`      | `[✓ / pending]` |

---

## 7. Review History

| Date         | Reviewer          | Scope         | Findings    |
| :----------- | :---------------- | :------------ | :---------- |
| [YYYY-MM-DD] | `[security-lead]` | Initial model | `[summary]` |
