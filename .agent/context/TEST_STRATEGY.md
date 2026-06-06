# Test Strategy — start-project

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

**Framework:** `[Vitest / Jest / pytest / RSpec / go test]`
**Location:** `tests/unit/` or co-located `*.test.ts` next to source file.

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
| External HTTP API | Mock with `[msw / nock / httpretty]` | Real or contract-verified stub  |
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

## 11. Per-Language Test Framework Reference

See `LANGUAGE_TOOLCHAINS.md` for toolchain setup. This section maps framework concepts across languages.

### Unit Test Frameworks

| Language | Framework | Test file convention | Run command |
|---|---|---|---|
| C | `CTest` + `Unity` / `cmocka` | `test_*.c` | `ctest --output-on-failure` |
| C++ | `Catch2`, `GoogleTest`, `doctest` | `*_test.cpp` / `*_spec.cpp` | `ctest` / `./test_runner` |
| Fortran | `pFUnit`, `Vegetables` | `test_*.f90` | `fpm test` |
| Python | `pytest` | `test_*.py` / `*_test.py` | `pytest` |
| Rust | Built-in (`#[test]`) | inline in `src/` + `tests/` | `cargo test` |
| Java | `JUnit 5` | `*Test.java` | `mvn test` / `./gradlew test` |
| .NET | `xUnit` / `NUnit` | `*Tests.cs` | `dotnet test` |
| R | `testthat` | `test-*.R` in `tests/testthat/` | `devtools::test()` |
| Lua | `busted` | `*_spec.lua` | `busted` |
| Julia | `Test.jl` + `Aqua.jl` | `test/runtests.jl` | `Pkg.test()` |
| JupyterLab | `nbval` / `nbmake` | `*.ipynb` | `pytest --nbval` |
| TypeScript/JS | `Vitest` / `Jest` | `*.test.ts` / `*.spec.ts` | `vitest run` / `jest` |
| Kotlin | `Kotest` (`FunSpec`, `DescribeSpec`) | `*Test.kt` / `*Spec.kt` | `./gradlew test` |
| Zig | built-in (`std.testing`) | inline `test "name" { ... }` | `zig build test` |
| CUDA | `GoogleTest` (host) + `compute-sanitizer` (device) | `*_test.cu` | `ctest`; `compute-sanitizer ./test` |
| Bash/Shell | `bats-core` | `*.bats` in `tests/shell/` | `bats tests/shell/` |
| SQL | `pgTAP`, `DuckDB` unit tests | `*.sql` in `tests/sql/` | `pg_prove tests/sql/` |

### Mocking / Test Doubles

| Language | Library |
|---|---|
| C/C++ | `cmocka`, `GoogleMock`, `FFF` (fake functions) |
| Python | `unittest.mock`, `pytest-mock` |
| Rust | `mockall`, `wiremock-rs` |
| Java | `Mockito`, `WireMock` |
| .NET | `Moq`, `NSubstitute` |
| R | `mockery` |
| Lua | Manual stubs via metatables |
| Julia | `Mocking.jl` |
| TypeScript/JS | `vi.fn()` (Vitest), `jest.mock`, MSW (HTTP) |
| Kotlin | `MockK`, `Mockito-Kotlin` |
| Zig | Hand-rolled doubles via comptime |
| CUDA | Host-side mocks (GoogleMock); device kernels tested directly |
| Bash/Shell | `bats-mock`; function override via `function name() { ... }` |
| SQL | Stub schemas via DuckDB; transaction-rollback test isolation |

### Integration & Contract Testing

| Concern | Tool(s) |
|---|---|
| HTTP contract | `Pact` (consumer-driven; supports Java, .NET, Python, Rust, Go) |
| gRPC | `grpc-testing` (Java), `tonic` test server (Rust) |
| Database | Testcontainers (Java, .NET, Python, Rust, Go) |
| Message queue | Testcontainers + broker image |

### Property-Based Testing

| Language | Framework |
|---|---|
| C++ | `rapidcheck` |
| Python | `hypothesis` |
| Rust | `proptest`, `quickcheck` |
| Java | `jqwik` |
| .NET | `FsCheck` |
| R | `hedgehog` |
| Julia | `PropCheck.jl` |

### Sanitizers in Test (C/C++/Rust)

Enable in CI debug builds — never in release:

| Sanitizer | Flag | Detects |
|---|---|---|
| ASan | `-fsanitize=address` | Heap/stack/global buffer overflow, UAF, double-free |
| UBSan | `-fsanitize=undefined` | Integer overflow, misaligned access, null deref |
| TSan | `-fsanitize=thread` | Data races |
| MSan | `-fsanitize=memory` | Uninitialized reads |
| MIRI | `cargo miri test` | UB in Rust unsafe code |

---

## 12. Extended Test Notes — New Languages

> Per-language framework rows are integrated in §11 above. This section provides
> deeper notes (layered test pyramid, GPU specifics, migration discipline).

### TypeScript / JavaScript

| Layer | Tool | Notes |
|---|---|---|
| Unit | Vitest / Jest | `vi.fn()` for mocks; `@testing-library/react` for UI |
| Integration | Supertest / Hono test client | Real HTTP, no mocks |
| E2E | Playwright | See `E2E_TESTING.md` |
| Contract | MSW (Mock Service Worker) | API contract tests |
| Coverage | V8 / Istanbul | `--coverage` flag; `coverageThreshold` in config |

### Kotlin

| Layer | Tool |
|---|---|
| Unit | Kotest (`FunSpec`, `DescribeSpec`) |
| Mocking | MockK |
| Coverage | Kover (Gradle plugin) |
| Property | Kotest property testing module |

### Zig

- Built-in test runner: `test "name" { try std.testing.expect(...); }`
- Run: `zig build test`
- No external test framework needed; standard library has `std.testing.*`

### CUDA / GPU

| Concern | Tool |
|---|---|
| Unit (host) | GoogleTest / Catch2 |
| Device memory | `compute-sanitizer --tool memcheck` |
| Race detection | `compute-sanitizer --tool racecheck` |
| Uninitialized | `compute-sanitizer --tool initcheck` |
| Performance | `nvprof` / Nsight Systems |

Note: GPU tests require a CUDA-capable runner. Tag CI jobs with `gpu: true` and provide a CPU-only mock path for standard runners.

### Bash / Shell

| Tool | Purpose |
|---|---|
| `bats-core` | Unit tests for shell scripts |
| `shellcheck` | Static analysis (CI-blocking) |
| `shfmt` | Format verification |

Convention: `set -euo pipefail` in every script; test with `bats tests/shell/`.

### SQL

| Tool | Purpose |
|---|---|
| `pgTAP` | PostgreSQL unit tests |
| `sqlfluff` | Linting and formatting |
| `Flyway` / `Liquibase` / `Alembic` | Migration testing |
| `DuckDB` | In-process SQL unit tests (portable) |

Always test migrations against a throwaway DB in CI (docker compose with health check).
