# Engineering Patterns and Antipatterns — start-project

> Living catalog of validated patterns and antipatterns identified during development.
> Update after each sprint. Complements `BEST_PRACTICES.md` (general guidelines)
> and `ANTIPATTERNS.md` (Design Doc antipatterns).

---

## Part 1 — Validated Patterns

### PT-01: Hoist Mock Dependencies Before Module Registration

**Context:** Many test frameworks hoist module mock registrations to the top of the file at
compile time. If the mock factory references variables declared in file scope (outside the
hoist boundary), a temporal dead zone error occurs.

**Correct Pattern:**

```typescript
// Example: Vitest vi.hoisted()
const { mockFn } = vi.hoisted(() => {
  const mockFn = vi.fn().mockReturnValue({ result: true });
  return { mockFn };
});

vi.mock('../../src/services/myService.js', () => ({
  default: { run: mockFn },
}));
```

**Antipattern:**

```typescript
// BREAKS — mockFn does not exist when the mock is hoisted
const mockFn = vi.fn();
vi.mock('../../src/services/myService.js', () => ({
  default: { run: mockFn }, // ReferenceError
}));
```

**Where to apply:** any unit test that mocks a singleton module with side effects on import.

---

### PT-02: Global Test Cleanup at Suite Level

**Context:** Repeating cleanup logic (`clearAllMocks`, `resetModules`) in each `describe`
creates noise and can be forgotten when new describes are added.

**Correct Pattern:**

```typescript
// Outside all describes — covers the entire file
beforeEach(() => vi.clearAllMocks());

describe("featureA", () => { ... });
describe("featureB", () => { ... });
```

**Antipattern:** repeating `beforeEach(() => vi.clearAllMocks())` inside each describe block.

**Where to apply:** suites with multiple describes that share the same global mocks.

---

### PT-03: Named Constants for Test Fixtures

**Context:** Repeated string/number literals across test cases make refactoring risky
and increase diff noise.

**Correct Pattern:**

```typescript
const TEST_ID = 'test-uuid-1234';
const USER_ID = 'user-1';

it('creates resource', () => {
  expect(create(USER_ID)).toMatchObject({ id: TEST_ID });
});
```

**Where to apply:** any literal that appears 3+ times in the same test suite.

---

### PT-04: Structured Agent Token Log

**Context:** Sessions with AI subagents consume tokens from a shared rate-limit pool.
Without tracking, it is impossible to know when the pool is nearing its limit.

**Pattern:** `token_log.jsonl` — one JSON entry per line.

**Schema:**

```json
{
  "ts": "ISO-8601 UTC",
  "session": "slug",
  "agent": "[model-name]",
  "task": "short description",
  "total_tokens": 0,
  "tool_uses": 0,
  "duration_ms": 0,
  "notes": "optional"
}
```

**Rotation Policy:** 200-line threshold → rename to `token_log.YYYY-MM.jsonl`, keep 3 archives.

**Where to apply:** every session that spawns subagents.

---

### PT-05: Orchestrator + Worker Agent Split

**Context:** Capable (expensive) models carry higher per-token cost. Simple parallelizable
tasks (file search, grep, inventory) do not require full reasoning capacity.

**Pattern:**

- Orchestrator (capable model): security judgment, synthesis, architecture decisions, web search.
- Workers (fast model): grep, isolated file reads, boilerplate generation, inventory.
- Ceiling: ≤ 3 workers in parallel per turn.
- Mandatory briefing: explicit root path, single responsibility, structured output (table/list).

**Antipattern:** delegating web search or cross-file synthesis to worker agents — the token
cost multiplies without quality gain.

---

### PT-06: Documentation Integrity Guard via CI Test

**Context:** A context file added to `.agent/context/` but not registered in `AGENTS.md`
silently breaks the knowledge base index.

**Pattern:** CI test (`documentation.test.ts`) that reads the filesystem and compares against
the `AGENTS.md` index. Any orphaned file fails the build immediately.

**Rule:** always update `AGENTS.md` in the **same commit** as the new context file.

**Antipattern:** committing the context file in one commit and `AGENTS.md` in a later one —
the intermediate commit's CI breaks.

---

### PT-07: Output Sanitization with Allowlist (CWE-150)

**Context:** Output from untrusted execution environments (subprocess, sandbox, remote eval)
can contain escape sequences that manipulate the host terminal or UI.

**Pattern — 3 steps:**

1. Tokenize legitimate formatting sequences (SGR, color codes) before stripping.
2. Remove all remaining non-allowlisted escape sequences.
3. Restore the tokenized legitimate sequences.

**Why:** the stripping regex is greedy — text directly concatenated to a disallowed sequence
is discarded intentionally (prevents injection via padding).

**Where to apply:** any rendering surface that displays untrusted process output.

---

### PT-08: Ownership Check in All Data Mutations (CWE-284)

**Context:** UPDATE and DELETE operations must validate resource ownership — never filter
by ID alone. Without an owner check, any authenticated user can modify another user's data (IDOR).

**Pattern:**

```sql
DELETE FROM resources WHERE id = ? AND owner_id = ?
UPDATE resources SET field = ? WHERE id = ? AND owner_id = ?
```

**Verification:** check `affected_rows > 0` after mutation — if zero, the record does not
belong to the caller. Return `403 Forbidden`, not `404 Not Found` (prevents enumeration).

**Where to apply:** every data service function that accepts an external resource ID.

---

### PT-09: Platform-Aware Package Management

**Context:** In environments where the runtime platform differs from the shell platform
(e.g., Windows host + Linux container, macOS CI + Linux deploy), native module binaries
are platform-specific and incompatible across environments.

**Pattern:**

- Always install packages using the **target platform's** package manager shell.
- Document the required platform in `README.md` and CI configuration.
- After cross-platform contamination: rebuild native modules for the correct platform
  before running tests (`npm rebuild [module]` or equivalent).

**Antipattern:** running `npm install` inside a container/WSL shell when the project
runs on the host platform — native binary mismatch fails silently until test execution.

---

### PT-10: Route Handler Tested in Isolation (No HTTP Server)

**Context:** Testing HTTP routes via full server initialization (supertest, httpx, etc.)
requires database connections, middleware chains, and port binding — fragile in CI.

**Pattern:** extract the handler function from the router stack and call it directly
with mock request/response objects. Zero server overhead, zero port conflicts.

```typescript
// Extract handler from router (framework-specific)
const handler = extractHandler(router, 'POST', '/resource');
handler(mockRequest({ body: payload }), mockResponse());
```

**Where to apply:** unit tests for individual route handlers — reserve integration tests
for full request-cycle testing.

---

## Part 2 — Project Antipatterns

> Document antipatterns discovered during this project's development.
> Format: symptom → why dangerous → countermeasure.

### AP-01: Orphaned Context Files

**Symptom:** file added to `.agent/context/` without updating `AGENTS.md`.

**Why it's dangerous:** CI test detects the orphan and fails the build. Other agents
using the knowledge base cannot find the file via the index.

**Countermeasure:** see PT-06. Same-commit rule is mandatory.

---

### AP-02: Module Mock Without Hoist Boundary

**Symptom:** `vi.mock()` factory references a variable declared outside `vi.hoisted()`.

**Why it's dangerous:** `ReferenceError` at test runtime — the mock is hoisted before
the variable is initialized.

**Countermeasure:** see PT-01.

---

### AP-03: Concurrent Mock Contamination in Test Suites

**Symptom:** running multiple test files that mock the same module in the same worker
process — second file sees first file's mock state.

**Why it's dangerous:** tests pass individually but fail together. False negative in CI.

**Countermeasure:** run suites that conflict over shared mocks in isolated worker
processes (`--pool=forks` in Vitest, `--runInBand` isolation in Jest).

---

### AP-04: pre-commit Hook Encoding Issue

**Symptom:** hook script saved with non-UTF-8 encoding (e.g., UTF-16 LE on Windows) —
shell reports `cannot execute binary file`.

**Why it's dangerous:** blocks all local commits. CI is unaffected, so the problem is
only discovered on the developer's machine.

**Countermeasure:** write hook files using shell `printf` or a text editor that confirms
UTF-8 encoding. Never use a binary-writing tool for shell scripts.

---

### PT-11: Externalise Profile Config to YAML (not code)

**Context:** Profile definitions (sets of optional files, labels, notes) that drive wizard
behaviour are configuration, not logic. Hardcoding them as a Python dict means every profile
change requires a code change, a test run, and a code review.

**Correct Pattern:**

```yaml
# infra/scripts/profiles.yaml
founder:
  label: "Founder / Early-stage"
  optional: [ARCHITECTURE_MAP.md, E2E_TESTING.md]
  note: "Minimum context for AI agents."
```

```python
SLIM_PROFILES = _load_profiles()  # reads profiles.yaml at import time
```

**Antipattern:** 120-line `SLIM_PROFILES` dict hardcoded in `wizard.py` — profile changes
require touching implementation code and re-running the full test suite for a data change.

**Where to apply:** any configuration edited by product/ops rather than engineering, or that
a child project may want to override without forking the script.

---

### PT-12: Guard Internal Config Files from Placeholder Scan

**Context:** A wizard that scans and rewrites `[PLACEHOLDER]` tokens across the repo will
corrupt its own config files if they contain bracket-enclosed values.

**Correct Pattern:**

```python
_PROFILES_YAML = Path(__file__).with_name("profiles.yaml")
_WIZARD_INTERNAL_FILES: frozenset[Path] = frozenset({_PROFILES_YAML.resolve()})

# In scan_placeholders() and apply_substitutions():
if path.resolve() in _WIZARD_INTERNAL_FILES:
    continue
```

**Antipattern:** scanning all files under root without an exclusion list — the wizard
rewrites its own `profiles.yaml`, corrupting labels that contain bracket patterns.

**Where to apply:** any script that performs repo-wide text substitution.

---

### PT-13: Propagate Exit Codes from Subprocesses

**Context:** A subprocess wrapper that prints failure output but returns `None` gives the
caller no signal. The parent concludes "done" even when the subprocess failed.

**Correct Pattern:**

```python
def run_ci_gate() -> bool:
    result = subprocess.run(cmd, ...)
    if result.returncode != 0:
        return False
    return True

if not run_ci_gate():
    sys.exit(1)
```

**Antipattern:** `run_ci_gate()` returns `None`; caller ignores it; wizard prints "done"
while CI is red.

**Where to apply:** every subprocess wrapper — never swallow exit codes.

---

### PT-14: falsify → fix → lint Sprint Gate Order

**Context:** Running lint before falsify wastes effort — lint passes but falsify still finds
semantic bugs, requiring a second lint pass. Correct order:

1. **falsify** — enumerate breaking inputs, unprotected invariants, edge cases
2. **fix** — resolve all 🔴 and prioritised 🟡 findings
3. **lint** — confirm fixes are also formally conformant

**Antipattern:** lint → falsify → fix with no second lint — fixes from falsify are never
lint-checked; doc/format regressions accumulate silently.

**Where to apply:** every sprint close gate and every PR touching business logic.

---

### PT-15: Normalise Line Endings at Repo Level via `.gitattributes`

**Context:** Mixed CRLF/LF causes spurious merge conflicts on every cross-platform branch
merge, pollutes diffs, and makes `git blame` unreliable.

**Correct Pattern:**

```gitattributes
* text=auto eol=lf
*.png binary
package-lock.json text eol=lf
```

Re-normalise existing index: `git rm --cached -r . && git add .`

**Antipattern:** no `.gitattributes` — every merge between Windows and Linux contributors
produces CRLF conflicts unrelated to actual code changes.

**Where to apply:** every new repo, in the first commit.

---

## Part 3 — Quick Reference

### Pre-Sprint Checklist

- [ ] Check AI agent token headroom before spawning subagents.
- [ ] Run full test suite — confirm zero failures before starting.
- [ ] Working tree clean: `git status`.
- [ ] New `.agent/context/` file? → `AGENTS.md` updated in same commit.

### Pre-Commit Checklist

- [ ] Linter passes with zero errors.
- [ ] All tests passing.
- [ ] New context file? → `AGENTS.md` updated?
- [ ] No hard-coded secrets or credentials introduced.
- [ ] Native module platform compatibility verified if packages changed.

### Patterns × Antipatterns Matrix

| Pattern                            | Guards Against                       |
| :--------------------------------- | :----------------------------------- |
| PT-01: Hoist mock dependencies     | AP-02: mock without hoist boundary   |
| PT-04: Token log                   | session pool exhaustion              |
| PT-05: Orchestrator + worker split | token waste on web search in workers |
| PT-06: AGENTS.md guard             | AP-01: orphaned context files        |
| PT-07: Output sanitization         | CWE-150: terminal escape injection   |
| PT-08: Ownership check             | CWE-284: IDOR in data mutations      |
| PT-09: Platform-aware package mgmt | native binary mismatch               |
| PT-10: Isolated route handlers     | AP-03: concurrent mock contamination |
| PT-11: Externalise config to YAML  | hardcoded profile dict in code       |
| PT-12: Guard internal files        | wizard corrupts own config           |
| PT-13: Propagate exit codes        | silent CI failure swallowed          |
| PT-14: falsify → fix → lint order  | AP-11: analysis without falsification |
| PT-15: `.gitattributes` LF norm    | AP-10: CRLF merge conflict noise     |
| PT-C1: Intrusive free-list         | AP-C1: O(N) slot scan                |
| PT-C2: Malloc sentinel             | AP-C2: partial malloc                |
| PT-C3: Checked fread/fwrite        | AP-C3: unchecked fread               |
| PT-C4: Symplectic Euler            | AP-C4: explicit Euler in physics     |
| PT-C5: Align-safe arena alloc      | silent misalignment on non-pow2      |
| PT-C6: Volatile loop-exit flag     | AP-C6: flag not declared volatile    |
| PT-C7: fork/execvp over system()   | AP-C7: shell injection via system()  |
| PT-C8: dt clamp before accumulator | spiral physics on VM resume          |

---

## Part 4 — Systems Programming Patterns (PT-C)

> Language-neutral reference patterns for low-level systems code.
> Replace `typescript` with the project's implementation language.
> Code examples use C syntax — adapt to `typescript` equivalents.

---

### PT-C1: Intrusive Free-List for O(1) Pool Alloc/Free

**Context:** Fixed-capacity pools (entities, objects, particles) need O(1) allocation
and deallocation with no heap traffic. The naive approach — scan for the first inactive
slot — degrades to O(N) and causes stutter at N > 64.

**Pattern:** Maintain a `free_head` index and a `next[]` array (linked list of free slots
embedded in the same fixed array). Sentinel: `free_head == -1` means pool full.

```c
/* typescript: init — chain all slots */
for (int i = 0; i < MAX; i++) pool_next[i] = i + 1;
pool_next[MAX - 1] = -1;
pool_free_head = 0;

/* alloc: O(1) pop */
int id = pool_free_head;
pool_free_head = pool_next[id];
pool_active[id] = 1;

/* free: O(1) push — double-free guard mandatory */
if (!pool_active[id]) return;
pool_active[id] = 0;
pool_next[id]   = pool_free_head;
pool_free_head  = id;
```

**Double-free guard is mandatory** — without it, a duplicate ID on the free-list corrupts
all subsequent allocs.

---

### PT-C2: Malloc Sentinel — Null-Code Buffer on OOM

**Context:** A constructor that calls multiple allocations. If any fails after others
succeed, the returned struct has some pointers non-NULL — callers checking only the
first pointer proceed with a partially-allocated object and NULL-deref at first use.

**Pattern:** On any allocation failure, free all allocations, zero the struct, and
return a sentinel. Callers check the primary pointer before use.

```c
/* typescript equivalent */
Object obj_create(int size) {
    Object o = { .data = malloc(size), .meta = malloc(sizeof(Meta)) };
    if (!o.data || !o.meta) {
        free(o.data); free(o.meta);
        return (Object){0};   /* sentinel — caller checks o.data == NULL */
    }
    return o;
}
```

---

### PT-C3: Checked fread/fwrite — Commit-on-Complete Serialisation

**Context:** `fread`/`fwrite` (or equivalent) return the number of items transferred.
Silent short reads produce partial state restoration — arrays half-loaded, indexes
corrupted, objects in impossible states.

**Pattern:** Check every read/write return. Read into temporaries; only commit to
global/shared state after all reads succeed. Return distinct error codes per failure mode.

```c
/* typescript: commit-on-complete pattern */
int load_state(FILE *f) {
    Header hdr;
    if (fread(&hdr, sizeof(hdr), 1, f) != 1) return -5;  /* short read */
    if (hdr.magic != MAGIC || hdr.version != VERSION) return -1;
    Type tmp[MAX];
    if (fread(tmp, sizeof(tmp), 1, f) != 1) return -5;
    memcpy(g_global, tmp, sizeof(g_global));   /* commit only on success */
    return 0;
}
```

---

### PT-C4: Symplectic Euler — Energy-Bounded Integration

**Context:** Explicit Euler (`x += v*dt` using old `v`) is not symplectic — it adds
artificial energy each step. For spring-mass or gravity systems, energy diverges
unboundedly. Bug is latent until forces are added.

**Pattern:** Update velocity with acceleration first, then position with the **new** velocity.

```c
/* typescript: Symplectic Euler */
velocity += acceleration * dt;   /* v_new = v_old + a*dt */
position += velocity * dt;       /* p_new = p_old + v_new*dt */
```

**Evidence:** Explicit Euler diverges +1114% over 1000 steps at dt=0.05 vs +1.2% for Symplectic (Millington §2.1).

---

### PT-C5: Align-Safe Arena Alloc with Power-of-2 Guard

**Context:** Arena allocators use `(offset + align-1) & ~(align-1)` to round up to the
next aligned boundary. This formula is **only correct when `align` is a power of 2**.
Passing a non-power-of-2 silently produces wrong alignment without any warning.

**Pattern:** Validate `align` is a power of 2 at the boundary; return NULL otherwise.

```c
/* typescript: power-of-2 guard */
if (align & (align - 1)) return NULL;   /* not a power of 2 */
size_t aligned = (offset + align - 1) & ~(align - 1);
```

---

### PT-C6: Volatile Flag for Loop Termination

**Context:** At optimisation levels > 0, the compiler may hoist a loop-exit flag into
a register if no observable modification is visible inside the loop body. Setting the
flag from a callback has no effect — the loop never exits.

**Pattern:** Declare the flag `volatile` in the owning struct. This prevents register
hoisting without requiring a memory barrier.

```c
/* typescript: volatile loop-exit flag */
typedef struct {
    volatile int running;   /* must not be hoisted by optimiser */
    /* ... */
} EventLoop;
```

**Where NOT to use:** do not make every shared variable `volatile`. Reserve for flags
written by a callback and read by an outer loop in the same thread.

---

### PT-C7: Subprocess Spawn without Shell Interpolation

**Context:** Spawning a subprocess via a shell wrapper (`system(cmd)` or `sh -c`) passes
the command string to a shell. Any metacharacter in the string executes attacker-controlled
shell code — even with sanitisation, PATH manipulation can redirect the command.

**Pattern:** Validate the path against a blocklist of metacharacters, then spawn directly
with an argv array — no shell is invoked, no interpolation occurs.

```c
/* typescript: direct spawn — no shell */
static int path_is_safe(const char *path) {
    static const char bad[] = "'\"`$\\;& |()\n\r\t";
    for (const char *p = path; *p; p++)
        if (strchr(bad, *p)) return 0;
    return 1;
}
/* caller: validate → fork/execvp (POSIX) or CreateProcess (Win32) */
```

---

### PT-C8: dt Clamp Before Fixed-Timestep Accumulator

**Context:** On VM resume, debugger attach, or system suspend/resume, the clock may
return a delta of several seconds. Feeding this raw `dt` into a fixed-timestep
accumulator causes hundreds of update calls in a single frame — visible freeze
followed by physics explosion.

**Pattern:** Clamp `dt` to a maximum (e.g. 0.25 s = 4 dropped frames) before adding
to the accumulator. The clamp discards "time debt" rather than trying to repay it.

```c
/* typescript: dt clamp */
double dt = measure_elapsed();
if (dt > 0.25) dt = 0.25;   /* drop time debt rather than burst */
accumulator += dt;
while (accumulator >= tick) {
    update(tick);
    accumulator -= tick;
}
```
