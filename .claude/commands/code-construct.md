> Mode: code-construct

Build or edit the implementation. No audit. Produce the requested code only.

Rules:
- Do not emit findings, severity ratings, or gap analysis
- Do not scan for breaking inputs or missing invariants
- If a structural issue is unavoidable to mention, use one line: `[NOTE: <issue>]` — do not expand
- Announce `> Mode: code-construct` at the start of the response
