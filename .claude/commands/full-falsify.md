> Mode: full-falsify [code-falsify + doc-falsify + map-falsify + machine-falsify]

Maximum cost mode. Runs all four falsification domains on the named module or current scope.
Use before major releases, post-incident reviews, or architecture audits. Not for routine sprints.

Execution order:
1. code-falsify — breaking inputs, unprotected invariants, edge cases
2. doc-falsify — docstring contradictions, missing contracts, stale docs
3. map-falsify — cyclic deps, dual-responsibility, orphaned classes
4. machine-falsify — unreachable states, unguarded transitions, dead-end paths

Output format per domain:
- Severity table: `| 🔴/🟡/🟢 | Location | Finding | Evidence |`
- Domain summary line after each table

Final summary:
```
FULL FALSIFY SUMMARY
Scope: <module or files>
code-falsify:    N critical / N operational / N observation
doc-falsify:     N critical / N operational / N observation
map-falsify:     N critical / N operational / N observation
machine-falsify: N critical / N operational / N observation
TOTAL:           N critical / N operational / N observation
Recommended next action: [US-CANDIDATE: <finding summary>] for each 🔴 finding — do not open USs autonomously; await human approval per AGILE_GUIDE.md
```

Announce `> Mode: full-falsify` at the start of the response.
