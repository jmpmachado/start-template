> Mode: code-lint

Conformance check on implementation files touched in this turn. Do not attempt to break semantics.

Check for:
- Naming conventions (functions, variables, classes)
- Mandatory field presence (return types, error handling surface)
- Obvious structural omissions (missing null check, unused import, dead branch)
- Format consistency with the rest of the file

Output format:
- One finding per line: `[LINT] <file>:<line> — <issue> (🔴/🟡/🟢)`
- End with: `Scope checked: <files reviewed>`
- If no findings: `[LINT] No conformance issues found. Scope checked: <files>`

Announce `> Mode: code-lint` at the start of the response.
