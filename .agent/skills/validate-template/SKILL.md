---
name: validate-template
description: "Runs lint + typecheck + full test suite for the engineering template. Use after any change to .agent/context/, workflows, scripts, or test files."
allowed-tools: [Bash]
---

Run the following commands sequentially in the project root (`e:\Users\jmpma\Documents\project-template`):

```
npm run lint && npm run typecheck && npm test
```

Report back:
- Total tests passed / failed
- Any lint or typecheck errors (first 5 lines of output only)
- Total duration
- Final status: ✅ PASS or ❌ FAIL
