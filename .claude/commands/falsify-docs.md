> Mode: code-lint + doc-falsify

Lint the implementation for conformance, then fully falsify the docstrings.
Use before publishing a public API surface or before a release branch cut.

**Scope resolution:** if no file is specified, ask before executing: "Which file(s) should I lint + falsify?"

Runs sequentially:
1. **code-lint** — naming, format, mandatory fields, obvious omissions (cheap, ~1.5–2.5k tokens)
2. **doc-falsify** — assume at least one docstring contradicts the implementation or omits a contract element; enumerate all violations (~1–2k tokens)

Output format:
- `[LINT] <file>:<line> — <issue> (🔴/🟡/🟢)` for code findings
- Severity table for doc-falsify: `| 🔴/🟡/🟢 | File:Symbol | Finding | Contradiction or omission |`
- End with: `Scope checked: <files>. code-lint: N findings. doc-falsify: N critical / N operational / N observation.`

Announce `> Mode: code-lint + doc-falsify` at the start of the response.
