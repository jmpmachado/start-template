> Mode: code-lint + doc-lint

Runs the project-agnostic lint gate on all files touched this sprint.

## Execution order

1. **`npm run lint:all`** (or stack equivalent) — runs sequentially:
   - `eslint` — static analysis, zero warnings allowed
   - `tsc --noEmit` — type correctness
   - `markdownlint-cli2` — doc conformance
   - Python stack (`PROJECT_STACK=python`): `ruff check` + `pyright`
   - Go stack (`PROJECT_STACK=go`): `go vet` + `staticcheck`
   - Rust stack (`PROJECT_STACK=rust`): `cargo fmt --check` + `cargo clippy`

2. **doc-lint pass** — agent inspects public symbols in touched files for:
   - Missing docstrings/JSDoc on exported functions and interfaces
   - Stale param names vs. implementation
   - Unreachable union type variants

## Output format

- `[LINT] <file>:<line> — <issue> (🔴/🟡/🟢)` for code findings
- `[DOC-LINT] <file>:<symbol> — <issue> (🔴/🟡/🟢)` for doc findings
- End with: `Scope checked: <files>. code-lint: N findings. doc-lint: N findings.`

## DoD gate rule

Run `npm run lint:all` at sprint close (final commit). All 🔴 findings must be resolved or registered as a new US before the sprint is marked Done. 🟡/🟢 findings may be deferred with explicit notation. See `DEFINITION_OF_DONE.md` §Sprint Gate.

## CI equivalent

`.github/workflows/lint-all.yml` runs `npm run lint:all` (single script) on every PR and push to main/master. A failing CI run is equivalent to a failing `/lint-all` gate.

Announce `> Mode: code-lint + doc-lint` at the start of the response.
