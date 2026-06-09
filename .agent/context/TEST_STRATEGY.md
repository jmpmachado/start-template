# Test Strategy — [PROJECT_NAME]

> Authoritative test philosophy for this project.
> Every engineer and AI agent must consult this before writing or reviewing tests.
> Update when the team agrees to change coverage targets, tooling, or triad ratios.

---

## 1. Core Principles

1. **Tests are specifications.** A test failure means either the code is wrong or the requirement changed — never "just a flaky test."
2. **Hermetic by default.** Unit tests have no real I/O, no real network, no real clock. Non-hermetic tests are integration tests and must be labeled as such.
3. **Flakiness is a bug.** A flaky test is quarantined immediately and fixed within one sprint. `it.skip` with no linked issue is forbidden.
4. **Test the contract, not the implementation.** Tests should survive internal refactors. If renaming a private function breaks tests, the tests are testing the wrong thing.
5. **Coverage is a floor, not a goal.** Meeting the coverage threshold is a minimum bar, not a definition of quality. A 90%-covered module can still have critical untested behaviors.

---

## 2. Test Triad

| Type             | Scope                            | Dependencies                        | Speed       | Count (guideline) |
| :--------------- | :------------------------------- | :---------------------------------- | :---------- | :---------------- |
| **Unit**         | Single function / class / module | All external deps mocked/stubbed    | < 10ms each | ~70–80% of suite  |
| **Integration**  | Multiple components or real I/O  | Real DB, real cache, local services | Seconds     | ~15–25% of suite  |
| **E2E / System** | Full stack, user-facing flows    | Full environment                    | Minutes     | ~5% of suite      |

> The 70/20/10 guideline is a rough target, not a hard rule. The right ratio depends on your system's risk profile. Adjust deliberately — record the rationale in `DECISION_LOG.md`.

---

## 3. Unit Tests

**Framework:** Vitest (Frontend), xUnit (Backend)
**Location:** `tests/unit/` (Frontend) or `*.Tests` project (Backend).

### Rules

- One test file per module/class.
- Test names follow: `"[unit] [condition] [expected outcome]"` — readable as a sentence.
- No `beforeAll` that mutates shared state. Use `beforeEach` to reset.
- Use `vi.useFakeTimers()` (or equivalent) for time-dependent logic — never `Date.now()` or `setTimeout` in tests.
- Mock at the boundary: mock the interface, not the internals.
- Assert on observable outcomes (return values, thrown errors, emitted events) — not on internal state.

### Coverage targets

| Layer                   | Statements | Branches  | Functions |
| :---------------------- | :--------- | :-------- | :-------- |
| `src/[domain]/`         | ≥ `[90]%`  | ≥ `[85]%` | ≥ `[90]%` |
| `src/[application]/`    | ≥ `[85]%`  | ≥ `[80]%` | ≥ `[85]%` |
| `src/[infrastructure]/` | ≥ `[70]%`  | ≥ `[65]%` | ≥ `[70]%` |
| Overall                 | ≥ `[80]%`  | ≥ `[75]%` | ≥ `[80]%` |

### What to test per unit

For every non-trivial function:

- [ ] Happy path — correct input produces correct output.
- [ ] Error path — invalid input throws/returns the expected error.
- [ ] Boundary — empty collection, zero, max value, null/undefined.
- [ ] Side effects — if the function emits events or calls dependencies, verify the call.

---

## 4. Integration Tests

**Location:** `tests/integration/`
**Prerequisites:** Local services running. See `ONBOARDING.md` and `docker-compose.yml`.

### Rules

- `beforeAll` starts or connects to real dependencies.
- `afterAll` closes connections and cleans up all test data — no leaked state between runs.
- Each test is idempotent: safe to run multiple times in any order against a live environment.
- Use a dedicated test database / keyspace — never point at staging or production.
- Seed data via factory functions, not raw SQL in test bodies.
- Every protected endpoint must have at least one unauthenticated test (`expect 401`) and one unauthorized test (`expect 403`).

### Standard integration test cases per endpoint

| Test case                 | Assert                         |
| :------------------------ | :----------------------------- |
| Happy path                | `2xx`, correct response schema |
| Missing auth token        | `401`                          |
| Insufficient permissions  | `403`                          |
| Invalid input             | `400` with `VALIDATION_ERROR`  |
| Resource not found        | `404`                          |
| Concurrent write conflict | `409`                          |
| Rate limit exceeded       | `429`                          |

---

## 5. Security Tests

**Location:** `tests/security/`

Minimum required tests — add to this list as STRIDE threats are identified:

| Test                                  | Tool                         | Assertion                                            |
| :------------------------------------ | :--------------------------- | :--------------------------------------------------- |
| No stack trace in 4xx/5xx responses   | Integration test             | Body does not contain `at Object.`, `/src/`, `/app/` |
| No PII in error responses             | Integration test             | Body does not contain email, SSN patterns            |
| SQL injection on string inputs        | Integration test or `sqlmap` | `400` or `422`, no DB error leakage                  |
| Path traversal on file inputs         | Integration test             | `400`, no directory listing                          |
| IDOR — access another user's resource | Integration test             | `403`                                                |
| Auth bypass — missing token           | Integration test             | `401`                                                |
| Auth bypass — expired token           | Integration test             | `401`                                                |
| Rate limit enforcement                | k6 / integration test        | `429` before 5xx                                     |

Reference: `tests/security/` and `infra/scripts/k6/k6_security.js`.

---

## 6. Load and Performance Tests

**Framework:** k6. Scripts in `infra/scripts/k6/`.

| Script            | When to run                | Pass criterion                                       |
| :---------------- | :------------------------- | :--------------------------------------------------- |
| `k6_spike.js`     | Before every major release | p95 < 500ms, error rate < 5%                         |
| `k6_endurance.js` | Weekly in staging          | No latency degradation over 30min, error rate < 1%   |
| `k6_security.js`  | Before every major release | Rate limiter returns 429, never 5xx; no stack traces |

Full framework: `LOAD_TESTING_FRAMEWORK.md`.

---

## 7. Mocking Policy

| Dependency        | Unit tests                           | Integration tests               |
| :---------------- | :----------------------------------- | :------------------------------ |
| Database          | Mock repository interface            | Real DB (test schema)           |
| Cache             | In-memory stub                       | Real Redis (test keyspace)      |
| External HTTP API | Mock with MSW / WireMock.Net | Real or contract-verified stub  |
| File system       | In-memory FS or temp dir             | Temp dir, cleaned in `afterAll` |
| Clock / timers    | `vi.useFakeTimers()`                 | Real clock                      |
| Message queue     | In-memory stub                       | Real queue (test topic)         |

**Rule:** never mock the system under test. Mock its dependencies at the interface boundary.

---

## 8. Test Data Strategy

- **Factories:** use builder/factory functions to create test data — no hardcoded IDs or magic strings scattered across test files.
- **Isolation:** each test creates its own data and cleans up in `afterAll`/`afterEach`.
- **No production data:** never copy production records into test fixtures — generate synthetic data.
- **Sensitive fields:** use clearly fake values (`test@example.com`, `+1-555-000-0000`).
- **Seed scripts:** for integration environments, a `db:seed:test` script populates baseline state.

---

## 9. CI Integration

| Stage             | Command                                 | Blocks merge                |
| :---------------- | :-------------------------------------- | :-------------------------- |
| Unit tests        | `[npm test]`                            | Yes                         |
| Coverage check    | `[npm run test:coverage]`               | Yes — fails below threshold |
| Integration tests | `[npm run test:integration]`            | Yes                         |
| Security tests    | `[npm run test:security]`               | Yes                         |
| Load tests        | `[k6 run infra/scripts/k6/k6_spike.js]` | Manual gate before release  |

Flaky test quarantine process:

1. Detect: CI reports intermittent failure.
2. Tag: add `it.skip` with `// FLAKY: [issue-url]`.
3. Track: open issue with reproduction steps.
4. Fix: resolve within one sprint. If not fixable, delete the test and file a bug.

---

## 10. What Not to Test

- **Framework internals:** do not test that `express.Router` routes correctly — test your handler.
- **Third-party libraries:** trust that `bcrypt.hash` works — test that you call it correctly.
- **Getters/setters with no logic:** trivial accessors do not need individual tests.
- **Private implementation details:** if a refactor that preserves behavior breaks a test, the test is wrong.
- **Infrastructure config:** Kubernetes manifests and Terraform are validated by linters, not unit tests.

---

## 11. Stack Test Framework Reference

This section maps testing concepts across our selected project stacks.

### Unit Test Frameworks

| Stack | Framework | Test file convention | Run command |
|---|---|---|---|
| **TypeScript/JS** | `Vitest` / `Jest` | `*.test.ts` / `*.spec.ts` | `vitest run` / `jest` |
| **.NET** | `xUnit` / `NUnit` | `*Tests.cs` | `dotnet test` |

### Mocking / Test Doubles

| Stack | Library / Tool |
|---|---|
| **TypeScript/JS** | `vi.fn()` (Vitest), `jest.mock`, MSW (HTTP contract/mocking) |
| **.NET** | `Moq`, `NSubstitute`, `WireMock.Net` (HTTP mocking) |

### Integration & Contract Testing

| Concern | Tool(s) |
|---|---|
| HTTP contract | `Pact` (consumer-driven contracts; supports .NET and JS) |
| Database | Testcontainers (.NET and Node.js) |
| Message queue | Testcontainers + broker image |

### Property-Based Testing

| Stack | Framework |
|---|---|
| **TypeScript/JS** | `fast-check` |
| **.NET** | `FsCheck` |

---

## 12. Extended Test Notes

This section provides deeper notes on our stack-specific testing environments.

### TypeScript / JavaScript

| Layer | Tool | Notes |
|---|---|---|
| Unit | Vitest / Jest | `vi.fn()` for mocks; component unit testing |
| Integration | Supertest | Real HTTP, integration boundaries |
| E2E | Playwright | Full browser automation |
| Contract | MSW (Mock Service Worker) | API contract tests and network interception |
| Coverage | V8 / Istanbul | `--coverage` flag; coverage threshold enforcement |

### .NET (C#)

| Layer | Tool | Notes |
|---|---|---|
| Unit | xUnit / NUnit | Standard unit tests; `Moq` for dependency mock injection |
| Integration | WebApplicationFactory | In-memory integration testing for ASP.NET Core Minimal APIs |
| DB / Containers | Testcontainers.PostgreSql | Spawning real database instances inside containerized integration tests |
| Coverage | Coverlet | dotnet-coverage / coverlet output parsed in CI |
