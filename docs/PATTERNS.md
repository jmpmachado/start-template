# Engineering Patterns and Antipatterns — [PROJECT_NAME]

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

**Antipattern:** `run_ci_gate()` returns `None`; caller ignores it; the script prints "done"
while CI is red.

**Where to apply:** every subprocess wrapper — never swallow exit codes.

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

## Part 3 — Systems Programming Patterns (PT-C)

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
