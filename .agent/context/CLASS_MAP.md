<!-- STATUS: adoption-time fill-in — populate with real classes after src/ is implemented. All rows below are illustrative placeholders; replace before Sprint 1. -->

# Class Map — [PROJECT_NAME]

> **Template instruction:** Document every significant class, service, and module here.
> Update after each sprint. Stale class maps are worse than no map.
> Mark test status as: `Covered` | `Partial` | `Pending`.

---

## Service Layer (Backend / Core)

| Class / Service | File                   | Test Status | Responsibility         | Key Integrations             |
| :-------------- | :--------------------- | :---------- | :--------------------- | :--------------------------- |
| `[ServiceA]`    | `[path/serviceA.ts]`   | Pending     | [one-line description] | `[ServiceB]`, `[Repository]` |
| `[ServiceB]`    | `[path/serviceB.ts]`   | Pending     | [one-line description] | `[Database]`, `[Cache]`      |
| `[Repository]`  | `[path/repository.ts]` | Pending     | Data access layer      | `[ORM / DB driver]`          |

---

## Middleware and Cross-Cutting Concerns

| Module                  | File     | Responsibility                       |
| :---------------------- | :------- | :----------------------------------- |
| `[AuthMiddleware]`      | `[path]` | Token validation, identity injection |
| `[RateLimitMiddleware]` | `[path]` | DoS and brute-force protection       |
| `[LoggingMiddleware]`   | `[path]` | Structured request/response logging  |
| `[ErrorHandler]`        | `[path]` | Centralized error normalization      |

---

## Interface Layer (API / Controllers)

| Controller             | File     | Routes                                   | Test Status |
| :--------------------- | :------- | :--------------------------------------- | :---------- |
| `[ResourceController]` | `[path]` | `GET /resource`, `POST /resource`        | Pending     |
| `[AuthController]`     | `[path]` | `POST /auth/login`, `POST /auth/refresh` | Pending     |

---

## Domain Model

| Entity / Aggregate | File     | Invariants                             |
| :----------------- | :------- | :------------------------------------- |
| `[Entity A]`       | `[path]` | [e.g., ID is immutable after creation] |
| `[Value Object B]` | `[path]` | [e.g., Email must be valid RFC 5321]   |

---

## Frontend / Client Layer

| Component         | File     | Test Status | Responsibility              |
| :---------------- | :------- | :---------- | :-------------------------- |
| `[PageComponent]` | `[path]` | Pending     | Top-level page, route entry |
| `[FeatureWidget]` | `[path]` | Pending     | Isolated feature UI         |
| `[SharedHook]`    | `[path]` | Pending     | Reusable state/effect logic |

---

## Infrastructure Adapters

| Adapter            | File     | External System                 | Notes          |
| :----------------- | :------- | :------------------------------ | :------------- |
| `[CacheAdapter]`   | `[path]` | [Redis / Memcached / in-memory] | [TTL strategy] |
| `[StorageAdapter]` | `[path]` | [S3 / local FS / DB blob]       | [streaming?]   |
| `[EmailAdapter]`   | `[path]` | [SMTP / SES / SendGrid]         | [retry policy] |

---

## Dependency Rule Compliance

> Classes/modules must only import from layers **below** them in the stack.
> Violations are tracked here until resolved.

| Violation   | From                      | To              | Status |
| :---------- | :------------------------ | :-------------- | :----- |
| `[example]` | `Domain → Infrastructure` | `[import path]` | Open   |

---

## Update Policy

- Update this file within the same PR that adds or changes a class.
- If a class is deleted, remove its row — do not leave stale entries.
- `AGENTS.md` guard: this file is listed in AGENTS.md; keep in sync.
