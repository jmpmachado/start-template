> Mode: map-falsify

**Scope resolution:** scope is always the full CLASS_MAP.md and ARCHITECTURE.md — no argument needed. If those files do not exist yet, say so and exit.

Assume an undeclared cyclic dependency or dual-responsibility class exists in CLASS_MAP.md. Find it.

Enumerate:
- Cyclic dependencies: A → B → A (direct or transitive)
- Class with dual responsibility: single entry that owns two distinct domains
- Class that should exist but is absent (implied by others' dependencies)
- Dependency direction that violates layering (UI imports from DB layer directly)
- Module boundary violation (class in wrong package/directory for its responsibility)
- Orphaned class: listed in CLASS_MAP but no other entry depends on it and it has no external caller documented

Output format:
- Severity table: `| 🔴/🟡/🟢 | Class/Module | Finding | Evidence |`
- End with: `Scope checked: full CLASS_MAP.md (N entries). Findings: <N> critical / <N> operational / <N> observation`

Announce `> Mode: map-falsify` at the start of the response.
