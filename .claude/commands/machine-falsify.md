> Mode: machine-falsify

**Scope resolution:** scope is always the full STATE_MACHINE.md — no argument needed. If that file does not exist yet, say so and exit.
Warning: this mode is O(n²) on the number of states × transitions. Use on explicit request only.

Enumerate:
- Unreachable states: states that cannot be entered from the initial state via any valid transition sequence
- Unguarded transitions: transitions from a state where multiple transitions exist but not all have guards (non-determinism)
- Dead-end paths: sequences that reach a non-terminal state with no valid exit
- Missing error state: happy path defined but no state handles failure/timeout
- Guard contradiction: two transitions from the same state with mutually exclusive guards that together do not cover all inputs (gap) or that overlap (ambiguity)
- Transition cycle with no exit: A → B → C → A with no branch out (livelock)

Output format:
- Severity table: `| 🔴/🟡/🟢 | State/Transition | Finding | Path that demonstrates it |`
- End with: `Scope checked: full STATE_MACHINE.md (N states, M transitions, P paths enumerated). Findings: <N> critical / <N> operational / <N> observation`

Announce `> Mode: machine-falsify` at the start of the response.
