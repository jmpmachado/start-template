> Mode: machine-lint

Conformance check on STATE_MACHINE.md. Do not enumerate all paths (no O(n²) traversal).

Check for:
- State with no outgoing transition (potential terminal state — flag if not documented as intentional)
- State with no incoming transition (potential orphan — flag if not the initial state)
- Transition with no guard where a guard is structurally expected (non-deterministic branch)
- Missing initial state declaration
- Missing terminal/error state declaration
- Transition that references a state not listed in the state table

Output format:
- One finding per line: `[MACHINE-LINT] <state/transition> — <issue> (🔴/🟡/🟢)`
- End with: `Scope checked: STATE_MACHINE.md (N states, M transitions)`
- If no findings: `[MACHINE-LINT] No conformance issues found. Scope checked: <N states, M transitions>`

Announce `> Mode: machine-lint` at the start of the response.
