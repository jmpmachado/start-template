> Mode: doc-lint

Conformance check on docstrings and inline comments in files touched this turn.

Check for:
- Missing docstring on public functions, classes, or exported symbols
- Docstring present but missing mandatory elements (params, return, raises/throws)
- Stale parameter name (docstring says `foo`, signature says `bar`)
- Comment that describes WHAT instead of WHY (flag as observation only)

Output format:
- One finding per line: `[DOC-LINT] <file>:<symbol> — <issue> (🔴/🟡/🟢)`
- End with: `Scope checked: <files reviewed>`
- If no findings: `[DOC-LINT] No doc conformance issues found. Scope checked: <files>`

Announce `> Mode: doc-lint` at the start of the response.
