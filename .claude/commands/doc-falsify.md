> Mode: doc-falsify

**Scope resolution:** if no file or symbol is specified, ask before executing: "Which file(s) or module should I falsify?" — do not default to the full repository.

Assume at least one docstring in the named scope contradicts the implementation or omits a required contract element. Find it.

Enumerate:
- Docstring that describes behavior the implementation does not exhibit
- Missing exception/error contract (function throws but docstring is silent)
- Return type documented incorrectly (says `string`, returns `string | null`)
- Param documented as required but implementation treats it as optional (or vice versa)
- Side effect not documented (writes to file, mutates shared state, emits event)
- Outdated docstring after a refactor (refers to removed param or old return shape)

Output format:
- Severity table: `| 🔴/🟡/🟢 | File:Symbol | Finding | Contradiction or omission |`
- End with: `Scope checked: <files>. Findings: <N> critical / <N> operational / <N> observation`

Announce `> Mode: doc-falsify` at the start of the response.
