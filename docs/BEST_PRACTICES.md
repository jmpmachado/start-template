# Best Practices — [PROJECT_NAME]

> To maintain [PROJECT_NAME] in a healthy paradigm over an expected useful life of 3–5 years,
> follow the guidelines below. Adapt environment-specific sections to your actual stack.

---

## 1. Development Environment

> **Principle:** The execution environment must be verified before any build or test action.

- Define the minimum required runtime versions in a lockfile or `.tool-versions` / `.nvmrc` equivalent.
- Document all required system-level tools (compilers, runtimes, CLI tools) in `README.md`.
- Use environment variables for all configuration; never hard-code paths, ports, or credentials.
- Verify environment parity between development, staging, and production (document all deltas).

---

## 2. Zero-Trust Input Handling

> **Principle:** Never trust any input, regardless of source — user, service, or internal API.

- Validate and sanitize at every system boundary: HTTP, WebSocket, IPC, file I/O.
- Apply allowlist validation (not denylist) for structured inputs (file paths, commands, schema fields).
- Escape all data before injecting into system calls, queries, or templates.
- In subprocess or exec calls: pass arguments as arrays, never interpolate strings with user input (`shell: false` equivalent).

---

## 3. Component Lifecycle Management

> **Principle:** Every resource allocation must have a corresponding deallocation path.

- Any module that opens a connection, allocates memory, or starts a process must expose a `dispose()` / `close()` / `cleanup()` method.
- In reactive/event-driven frameworks: lifecycle hooks that register listeners or start connections **must** have cleanup logic in their teardown callback.
- Avoid memory leaks from lingering references in closures, event emitters, or timers.
- For background jobs: implement graceful shutdown — drain queues before exit.

---

## 4. Isolated Component Design

> **Principle:** Components should have a single, well-defined responsibility (SRP).
>
> **Scope:** Rules marked *(UI)* apply to browser/native desktop targets (React, Vue, Electron). Backend and CLI projects apply SRP at the service/module boundary instead.

- Design each component or module to encapsulate only its own responsibility — avoid cross-cutting concerns inside a single unit.
- *(UI)* Separate state management from rendering logic — use a designated state layer (context, store, signal, reducer).
- *(UI)* Avoid passing state down more than 2 levels — if props drilling occurs, promote to shared state.
- Use dependency injection for external services; never instantiate dependencies inside components or service classes.

---

## 5. Offline-First and Asset Strategy

> **Principle:** Assets required for core functionality must not depend on external network calls.
>
> **Scope:** Applies to **browser-based and mobile targets only**. CLI tools, backend services, and data pipelines skip this section — applying offline-first patterns to server-side code adds accidental complexity with no benefit.

- Bundle all critical fonts, icons, and static assets locally — do not load from CDN for core features.
- Design the data layer with an optimistic update model: apply changes locally first, sync later.
- Implement a service worker or equivalent caching layer for browser targets.
- Define a clear conflict resolution strategy for offline mutations that sync with a remote store.

---

## 6. UI Resilience and Error Hardening

> **Principle:** Isolated failures must not crash the entire application.

- Wrap heavy I/O modules, external library integrations, and non-critical features with error boundaries or equivalent fault isolation.
- Provide local recovery options (retry, reload component) rather than crashing the full application.
- Effect hooks or reactive subscriptions that open connections (WebSocket, SSE, polling) must have teardown logic registered before first execution.
- Log all unhandled errors to the observability layer — silent failures are worse than visible crashes.

---

## 7. Interaction Quality Standards

> **Principle:** User interactions must be non-blocking and informative.
>
> **Scope:** Applies to **browser/native UI targets** only.

- Avoid native blocking dialogs (`alert`, `confirm`, `prompt`) in production UI.
- Use non-blocking feedback patterns: toast notifications, inline validation, optimistic UI.
- Provide immediate feedback for async operations (loading states, progress indicators).
- Debounce input events; throttle scroll and resize events — they have different optimal patterns and both should avoid firing on every tick.

---

## 8. Security Hygiene Checklist (per sprint)

- [ ] No new `shell: true` / `exec(string)` calls without explicit approval and audit.
- [ ] No new hard-coded credentials, tokens, or secrets.
- [ ] All new user-facing endpoints have authentication + rate limiting.
- [ ] All new file path operations use absolute path resolution and allowlist validation.
- [ ] Dependency audit run — no new P0/P1 CVEs introduced.
- [ ] Environment variables documented in `.env.example` (values redacted).

---

## 9. Documentation Standards (Docs-as-Code)

> **Principle:** Documentation is treated as code — versioned, reviewed, owned, and updated alongside software.

### 9.1 Five documentation types

A mature project clearly distinguishes purpose and audience to avoid the antipattern of mixing content:

| Type               | Purpose                                           | Example               |
| :----------------- | :------------------------------------------------ | :-------------------- |
| **Reference docs** | API comments, module docs, public contracts       | JSDoc, TSDoc, OpenAPI |
| **Design docs**    | Architectural decisions, alternatives, trade-offs | RFCs, ADRs            |
| **Tutorials**      | Onboarding, setup, step-by-step guided flows      | ONBOARDING.md         |
| **Concept docs**   | Deep system or module explanation                 | Architecture overview |
| **Landing pages**  | Navigation entry points — no dense content        | README.md             |

### 9.2 Docs-as-code readiness checklist

- [ ] Documentation is under version control.
- [ ] Each document has an explicit owner.
- [ ] Mandatory review for relevant documentation changes.
- [ ] Documentation issues enter the backlog.
- [ ] Docs change alongside the code.
- [ ] There is a policy to detect outdated docs.
- [ ] There is a canonical location for engineering docs.

### 9.3 Design-First — the "Social Phase"

A Design Doc is required before the first commit when **any** of the following is true:
- The change affects a public API surface or external integration.
- The change introduces a new dependency or data schema migration.
- Reversing the decision would cost more than 2 engineer-days.
- The change crosses more than one team or module boundary.

The document is exposed to peers and specialists for trade-off validation in the "cheap space" of text — before code exists. The absence of an "Alternatives Considered" section weakens any design doc. Labelling a change "not complex" to avoid writing a Design Doc is an anti-pattern.

### 9.4 Readability anti-signals (trigger a review)

- Excessively long functions.
- Deep `if/else` chains.
- Implicit dependencies that are hard to mock.
- Generic abstractions without real necessity.
- Opaque acronyms or names without context.

---

## 10. Engineering Excellence Executive Checklist

### Documentation

- [ ] Canonical source of truth exists.
- [ ] Docs are alongside the code.
- [ ] Docs have an owner.
- [ ] Docs pass review.
- [ ] README and CONTRIBUTING are adequate.
- [ ] Tutorials and runbooks exist for essential operations.

### Architecture

- [ ] Large changes require a design doc.
- [ ] There are goals, non-goals, and trade-offs.
- [ ] Security, privacy, and rollout were evaluated.

### Code

- [ ] Style guide defined.
- [ ] Lint/format automated.
- [ ] Code is optimized for the reader.
- [ ] Comments explain intent and non-obvious parts.

### Tests

- [ ] Logic changes always bring tests.
  - **Small / unit tests**: business rules and pure functions.
  - **Medium / integration tests**: module integration and controlled I/O.
  - **Large / E2E tests**: a few critical end-to-end flows. The test pyramid (70/20/5) is a starting heuristic, not a compliance gate — the goal is **confidence to deploy**, not ratio compliance. See `TEST_STRATEGY.md §2` for guidance. Intentional deviation from the heuristic requires a trade-off documented in `DECISION_LOG.md`; undocumented deviation is a DoD violation.
- [ ] There is separation between unit, integration, and E2E.
- [ ] Architecture favors testability (dependency injection, no global state, mockable interfaces).
- [ ] Flaky tests are treated as engineering failures — disabled or rewritten immediately; flakiness is not a QA issue.

### Review

- [ ] Every change goes through review.
- [ ] Changes are small and focused.
- [ ] Change description explains the why.
- [ ] Owners exist for critical areas.

### Operation

- [ ] Rollout and rollback are explicit.
- [ ] Observability covers critical flows.
  - Shift-Left Security: SAST/DAST and linters replace cosmetic "nitpicking" in code review.
  - Canary rollouts are structured: phased releases with observation windows, health metrics, and explicit advance criteria.
- [ ] Incidents generate institutional learning (blameless postmortems).
- [ ] Operational toil above 50% of team time is an alarm signal — trigger automation investment immediately. The target is to drive toil toward zero, not to sustain it at 49%.

---

## 11. Readiness Levels

| Level | Name         | Characteristics                                                                                              |
| :---- | :----------- | :----------------------------------------------------------------------------------------------------------- |
| 0     | Ad hoc       | No design docs, no clear owners, little automation, scattered docs                                           |
| 1     | Basic        | README, lint and minimal tests; review exists but without consistent governance                              |
| 2     | Standardized | Style guide, versioned docs, defined owners, design docs for large changes                                   |
| 3     | Scalable     | Blocking pipeline, canonical documentation, consistent reviews, formalized rollout/rollback                  |
| 4     | Operable     | SLOs, blameless postmortems, mature runbooks, strong traceability between design, code, tests, and operation |
