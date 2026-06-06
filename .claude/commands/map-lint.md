> Mode: map-lint

Conformance check on CLASS_MAP.md and ARCHITECTURE.md. Do not trace transitive dependencies.

Check for:
- Entry format inconsistency (missing column, wrong table structure)
- File path that does not match the actual file location
- Class listed with no test status filled
- Description that is blank or placeholder (`[CONFIGURE]`, `TODO`, `—`)
- File added to `.agent/context/` but not registered in AGENTS.md

Output format:
- One finding per line: `[MAP-LINT] <file>:<entry> — <issue> (🔴/🟡/🟢)`
- End with: `Scope checked: CLASS_MAP.md, ARCHITECTURE.md, AGENTS.md`
- If no findings: `[MAP-LINT] No conformance issues found. Scope checked: <files>`

Announce `> Mode: map-lint` at the start of the response.
