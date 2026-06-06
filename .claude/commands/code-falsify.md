> Mode: code-falsify

**Scope resolution:** if no file or module is specified, ask before executing: "Which file(s) or module should I falsify?" — do not default to the full repository.

Assume a failure exists in the named file(s) or current module. Try to break it.

Enumerate:
- Inputs or states that cause incorrect output, exception, or silent data corruption
- Unprotected invariants (preconditions assumed but not enforced)
- Race conditions or ordering dependencies not documented
- Edge cases not covered by existing tests (empty, null, boundary, overflow)
- Error paths that swallow exceptions or return wrong type

Output format:
- Severity table: `| 🔴/🟡/🟢 | Location | Finding | Breaking scenario |`
- End with: `Scope checked: <files>. Findings: <N> critical / <N> operational / <N> observation`
- If no failure scenario found after exhaustive search: state scope explicitly — do not say "no issues"

Announce `> Mode: code-falsify` at the start of the response.
