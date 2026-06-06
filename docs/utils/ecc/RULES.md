# ECC — Rules Module

> Source: `utils/ECC/rules/` · Count: 18 language/framework rule sets

Rules are always-active coding standards that the harness loads based on the detected stack.
Unlike skills (invoked on demand), rules are injected into the system prompt automatically
when the matching language or framework is detected in the project.

---

## Rule Set Catalog

| Directory | Language / Framework | Key Concerns |
|---|---|---|
| `common/` | Universal | Security, naming, testing, commit messages |
| `angular/` | Angular | Component lifecycle, DI, RxJS, change detection |
| `arkts/` | ArkTS (Harmony OS) | ArkUI patterns, declarative UI |
| `cpp/` | C++ | RAII, ownership, memory safety, sanitizers |
| `csharp/` | C# | Nullable refs, LINQ, async/await, records |
| `dart/` | Dart / Flutter | Null safety, widget composition, streams |
| `fsharp/` | F# | Discriminated unions, computation expressions |
| `golang/` | Go | Interface design, error wrapping, goroutine safety |
| `java/` | Java | Generics, streams, records, module system |
| `kotlin/` | Kotlin / Android | Coroutines, sealed classes, Compose |
| `perl/` | Perl | `use strict`, `use warnings`, regex safety |
| `php/` | PHP / Laravel | Type declarations, PSR-12, Eloquent patterns |
| `python/` | Python | Type hints, protocols, `__all__`, async patterns |
| `react/` | React / JSX | Hooks rules, prop types, key props, memo |
| `ruby/` | Ruby | Rubocop alignment, frozen string literals |
| `rust/` | Rust | Ownership, lifetimes, `unwrap` policy, `unsafe` |
| `swift/` | Swift / SwiftUI | Actors, Sendable, MainActor, concurrency |
| `typescript/` | TypeScript | Strict mode, no `any`, interface vs type |
| `web/` | Web (general) | CSP, CORS, accessibility, Web Vitals |
| `zh/` | All (Chinese) | Translated versions of common + key rule sets |

---

## Common Rules (Universal)

`rules/common/` applies to every project regardless of stack. Key rules:

### Security
- Never log secrets, passwords, tokens, or PII.
- Validate all external input at system boundaries.
- Never disable TLS verification.
- Parameterize all SQL queries; never interpolate user input.

### Naming
- Use descriptive names — no abbreviations except well-established acronyms.
- File names: `kebab-case` for JS/TS, `snake_case` for Python/Rust/Go.
- Classes: `PascalCase`. Functions/variables: `camelCase` (JS/TS) or `snake_case` (Python/Rust/Go).

### Testing
- Every public function requires at least one unit test.
- Test file mirrors source file path: `src/foo.ts` → `tests/foo.test.ts`.
- No `TODO` or `FIXME` in committed test files.

### Commits
- Conventional Commits format: `type(scope): message`.
- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`.
- Body line length ≤ 72 characters.

---

## TypeScript Rules (Example Deep-Dive)

`rules/typescript/` enforces:

```
✅ Strict mode enabled (tsconfig: strict: true)
✅ No `any` — use `unknown` and narrow explicitly
✅ Prefer `interface` for object shapes, `type` for unions/aliases
✅ All public APIs: JSDoc with @param, @returns, @throws
✅ Explicit return types on all exported functions
✅ No barrel re-exports from deeply nested paths
✅ Import order: node builtins → external → internal → types
❌ No `@ts-ignore` — use `@ts-expect-error` with a comment
❌ No non-null assertions (`!`) without narrowing proof
❌ No `Function` or `object` as parameter types
```

---

## Rust Rules (Example Deep-Dive)

`rules/rust/` enforces:

```
✅ No `unwrap()` in library code — use `?` or explicit match
✅ All `unsafe` blocks require a SAFETY comment
✅ Derive `Debug` on all public types
✅ Use `thiserror` for error types in libraries
✅ Prefer `Arc<Mutex<T>>` over raw pointer sharing
✅ Run `cargo clippy -- -D warnings` in CI
❌ No `std::mem::forget` without a documented reason
❌ No `Box<dyn Error>` in library public APIs
```

---

## Rule Loading

Rules are loaded by the harness adapter at session start:

1. `session:start` hook triggers `scripts/lib/detect-stack.js`.
2. Detected languages (from file extensions and `package.json`/`Cargo.toml`/`pyproject.toml`) map to rule directories.
3. Matching rule files are injected into the system prompt alongside `common/`.
4. Rules from `.claude/rules/` (project-local) take precedence over ECC rules.

---

## Adding a New Rule Set

1. Create `utils/ECC/rules/<language>/` directory.
2. Add one or more `.md` files with rule definitions.
3. Add a `README.md` summarizing the rule set.
4. Register the directory in `scripts/lib/detect-stack.js` extension map.
5. Add tests in `tests/lib/detect-stack.test.js`.

---

## See Also

- [HOOKS.md](HOOKS.md) — `session:start` hook that loads rules
- [HARNESS_ADAPTERS.md](HARNESS_ADAPTERS.md) — per-harness rule injection points
- `utils/ECC/rules/README.md` — upstream rules overview
