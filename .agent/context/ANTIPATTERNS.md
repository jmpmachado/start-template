# Catalog of Antipatterns in Design Docs

> This catalog documents recurring failure patterns in corporate design docs.
> For each antipattern: name, observable symptom, systemic risk and countermeasure.

---

## AP-01: The Showcase Doc ("Looks Good on Paper")

**Symptom:**
The document describes the solution with grandiose language and beautiful diagrams, but records no rejected alternatives, no trade-offs and no open questions. It looks complete but is empty of rationality.

**Real antipattern example:**

> _Architecture:_ We will adopt a scalable and resilient microservices architecture, utilizing best practices in distributed engineering. [diagram with 12 rectangles connected by arrows]

**Why it's dangerous:**

- Provides false sense of security to the reviewer.
- Prevents real review: without alternatives, there is nothing to question.
- The author did not go through the necessary thinking process.

**Countermeasure:**

> Require at least 2 alternatives with explicit rejection justification. If there are no alternatives, the solution space has not been explored.

---

## AP-02: Infinite Scope ("The Everything Doc")

**Symptom:**
Goals and non-goals are absent or goals are so broad that everything can be considered "in scope". The document tries to solve 5 distinct problems at once.

**Real antipattern example:**

> _Objectives:_ Improve system performance. Increase security. Facilitate maintenance. Modernize infrastructure. Improve developer experience.

**Why it's dangerous:**

- Without non-goals, scope expands indefinitely during implementation.
- Impossible to reject the design: any implementation "meets the objectives".
- Reviews do not reach consensus because each reviewer assumes different scope.

**Countermeasure:**

> Goals must be measurable ("reduce P99 from 300ms to < 100ms"). Non-goals must be as explicit as goals.

---

## AP-03: Security as Afterthought ("Security Footnote")

**Symptom:**
Security appears as a single paragraph at the end of the document, after architecture is already decided. Often contains "will be authenticated via JWT" as the totality of analysis.

**Real antipattern example:**

> _Security:_ The endpoint will be protected via JWT. Sensitive data will be encrypted. We will follow security best practices.

**Why it's dangerous:**

- Specific design threats are never modeled (no STRIDE, no threat model).
- New design's attack surface is not evaluated.
- PII, secrets management and granular authorization are left for "later".
- "Later" often does not happen before go-live.

**Countermeasure:**

> Security must be modeled **per new or modified component**, using minimal STRIDE: Spoofing, Tampering, Information Disclosure, Elevation of Privilege. Each threat must have mitigation and residual risk.

---

## AP-04: Ghost Rollback ("We Can Always Rollback")

**Symptom:**
The rollback plan is one sentence: "If there are problems, we will rollback the deploy." No commands, no data compatibility checks, no trigger criteria, no staging tests.

**Real antipattern example:**

> _Rollback:_ If necessary, we will rollback the deploy via CI/CD pipeline.

**Why it's dangerous:**

- Schema migrations are not trivially reversible.
- Async jobs in flight are left in inconsistent state.
- "Rolling back the deploy" without data validation can corrupt state.
- Without trigger criteria, no one knows when rollback should occur.

**Countermeasure:**

> Rollback must answer 4 questions:
>
> 1. What is the trigger criterion? (error rate, latency, alerts)
> 2. What are the exact commands?
> 3. Are data created in the new system compatible with the old?
> 4. Has rollback been tested in staging?

---

## AP-05: The Magic Diagram ("Trust the Architecture Diagram")

**Symptom:**
The design doc has an elaborate diagram with many components, but critical interactions (failures, timeouts, retries, error flows) are not represented. The diagram only shows the "happy path".

**Real antipattern example:**

> [Diagram with 8 services connected]
> _Flow:_ User → API → Service A → Service B → DB → Response
> _No timeout defined. No circuit breaker. No dead-letter queue._

**Why it's dangerous:**

- Systems fail at the edges, not on the happy path.
- Reviewers approve architecture that appears functional but was not thought through for partial failures.
- Incidents reveal gaps that were "in the diagram" but never discussed.

**Countermeasure:**

> For each external dependency in the diagram, answer: "What happens when this dependency fails?" Document timeout, retry, fallback and graceful degradation.

---

## AP-06: The Mausoleum Document ("Written Once, Never Read Again")

**Symptom:**
The design doc was written, approved, and became outdated in 3 months. It has no owner. When a new engineer finds it, 40% of documented decisions have already been reverted but the doc was not updated.

**Why it's dangerous:**

- New engineers make decisions based on obsolete architecture.
- The document creates more confusion than clarity.
- "Read the design doc before changing X" stops being a reliable habit.

**Countermeasure:**

> Every design doc must have:
>
> - Explicit owner responsible for maintaining it.
> - Updated status (Draft / Approved / Superseded / Deprecated).
> - Link to the RFC that replaces it when obsolete.
> - Process: relevant implementation changes must update the doc or open a new RFC that supersedes it.

---

## AP-07: Strawman Alternatives ("Strawman Alternatives")

**Symptom:**
The document lists "alternatives considered", but all are obviously inferior or absurd, created only to validate the author's preferred solution. No alternative represents an option that someone would seriously consider.

**Real antipattern example:**

> _Alternatives Considered:_ Rewrite everything in Rust — rejected due to complexity. Do nothing — rejected as it does not solve the problem. Proposed solution in this doc ✓

**Why it's dangerous:**

- The RFC process loses its main value: forcing the author to think about non-favorite solutions.
- Reviewers familiar with the domain lose confidence in the document.
- Real trade-offs of the chosen solution are never made explicit.

**Countermeasure:**

> Valid alternatives are those a competent and reasonable engineer could defend. If you cannot write a convincing paragraph for an alternative, it is not a real alternative.

---

## AP-08: Absence of Observability ("Deploy and Pray")

**Symptom:**
The design doc does not mention SLIs, SLOs, metrics, structured logs or alerts. There is no measurable success criterion for the rollout.

**Why it's dangerous:**

- Impossible to know if the system is working after deploy.
- No basis to decide when to advance rollout phases.
- Incidents are detected by users, not alerts.
- Post-mortems cannot reconstruct the incident timeline.

**Countermeasure:**

> Before approving rollout, define:
>
> - At least 1 SLI per critical flow (latency, error, availability).
> - Numeric SLO associated with the SLI.
> - Alert configured that fires when SLO is at risk.
> - Dashboard or query that evidences production behavior.

---

## AP-09: Dead Condition Guard (`|| true`)

**Symptom:** A CI job `if:` expression contains `|| true` — the condition is always satisfied
regardless of what precedes it. The original intent (run only when a file changes) is
completely negated.

**Real antipattern example:**

```yaml
if: |
  contains(github.event.pull_request.changed_files, 'tooling/package.json') ||
  true
```

**Why it's dangerous:**

- The job runs on every PR unconditionally — wasting CI minutes.
- The comment above says "runs only when X changes" — a direct lie to future maintainers.
- `contains(pr.changed_files, path)` does not work in GitHub Actions (changed_files is a
  count, not a list) — the real check was broken before `|| true` was added as a workaround,
  compounding the confusion.

**Countermeasure:**

> Use `paths:` in the workflow trigger to filter by changed files, or use
> `dorny/paths-filter` action for per-job path filtering. Never patch a broken condition
> with `|| true`.

---

## AP-10: Missing `.gitattributes` in Cross-Platform Repos

**Symptom:** Merge conflicts appear in files where no logical change was made — only
whitespace differences (CRLF vs LF). `git diff` shows thousands of lines changed in
`package-lock.json` or test files between Windows and Linux contributors.

**Why it's dangerous:**

- Merge conflicts on every cross-platform PR unrelated to actual code changes.
- `git blame` becomes unreliable — whole-file normalisation commits obscure real authorship.
- CI diffs are unreadable; reviewers approve changes they cannot meaningfully review.
- Lock file divergence can mask real dependency changes inside the noise.

**Countermeasure:**

> Add `.gitattributes` with `* text=auto eol=lf` in the first commit of every repo.
> Re-normalise existing repos with `git rm --cached -r . && git add .` followed by a
> dedicated normalisation commit. Mark binary files explicitly to prevent corruption.

---

## AP-11: Agent Analysis Without Falsification Mode

**Symptom:** An AI agent reports "no issues found" after reviewing documentation,
architecture, or compliance — without declaring what was checked, at what depth, or
applying adversarial probing. The report is a positive assertion with no falsification
attempt.

**Why it's dangerous:**

- Gaps are missed because the agent looked for confirmation, not failure.
- "No issues" gives false confidence and blocks real audit.
- The same agent will contradict itself if explicitly asked to falsify the same artefact.
- Cross-agent handoffs inherit the gap without knowing it exists.

**Countermeasure:**

> Require falsification mode for all analysis turns: assume gaps exist, probe operational
> completeness, rate every finding 🔴/🟡/🟢, declare scope checked. Announce mode at
> start of turn (`> Mode: doc-falsify`). Never conflate construction mode with audit mode.

---

## Summary: Antipattern Risk Map

| #         | Antipattern              | Primary Risk               | Manifestation Phase |
| --------- | ------------------------ | -------------------------- | ------------------- |
| **AP-01** | Showcase Doc             | Review without real value  | Code Review         |
| **AP-02** | Infinite Scope           | Scope creep, no done       | Implementation      |
| **AP-03** | Security Footnote        | Production vulnerabilities | Go-live / Incident  |
| **AP-04** | Ghost Rollback           | Data corruption            | Incident            |
| **AP-05** | Magic Diagram            | Cascading failures         | Production          |
| **AP-06** | Mausoleum Document       | Obsolete decisions         | Maintenance         |
| **AP-07** | Strawman Alternatives    | Lack of rationality        | Code Review         |
| **AP-08** | Absence of Observability | Silent incidents           | Operation           |
| **AP-C1** | O(N) Slot Scan           | Frame/request stutter      | Runtime             |
| **AP-C2** | Partial Malloc           | NULL-deref on OOM          | Runtime             |
| **AP-C3** | Unchecked fread          | Partial state restore      | Runtime             |
| **AP-C4** | Explicit Euler           | Energy divergence          | Runtime             |
| **AP-C5** | Naming Inconsistency     | Cognitive load, missed bugs | Maintenance        |
| **AP-C6** | Non-volatile Loop Flag   | Infinite loop at -O2       | Release Build       |
| **AP-C7** | system() Shell Injection | Arbitrary code execution   | Runtime / Security  |
| **AP-C8** | Fixed Sleep in Loop      | CPU waste / latency budget | Runtime             |

---

## Part 2 — Systems Programming Antipatterns (AP-C)

> Language-neutral antipatterns for low-level systems code.
> Code examples use C syntax — adapt to `typescript` equivalents.

---

### AP-C1: O(N) Slot Scan for Pool Allocation

**Symptom:** Object spawn iterates over every slot searching for an inactive entry.
With N = 256 and 50% occupancy, average cost is 128 iterations per spawn — measurable
stutter at > 64 concurrent spawns per frame/request.

**Real antipattern example:**
```c
/* typescript: O(N) — WRONG */
int pool_alloc(void) {
    for (int i = 0; i < MAX; i++)
        if (!pool_active[i]) return i;
    return -1;
}
```

**Why it's dangerous:**
- Multi-condition check (multiple `active` fields per slot) means a partially-initialised
  entry is treated as free — ID collision on next alloc overwrites a live object.
- Degrades silently with fill factor — invisible at low load, spikes under stress.

**Countermeasure:** use an intrusive free-list (PT-C1) — O(1) pop/push with a single
authoritative `active` flag.

---

### AP-C2: Partial Malloc — Silent Null Pointer Use

**Symptom:** A constructor allocates multiple fields separately. If a later allocation
fails after earlier ones succeed, the returned object has some pointers non-NULL. The
caller checks only the first pointer and proceeds — NULL-deref at first use of a
later field.

**Why it's dangerous:**
- Failure is silent — the callsite receives a "valid-looking" object.
- OOM on large allocations (constrained targets, large buffers) is a realistic scenario.

**Countermeasure (PT-C2):** on any allocation failure, free all allocations, zero the
struct, return a sentinel. Callers check the primary pointer before use.

---

### AP-C3: Unchecked fread — Partial State Restore

**Symptom:** `load_state` reads arrays without checking the return value. A truncated
file (interrupted write, disk full, corruption) silently restores partial state —
some fields from file, others zero-initialised garbage. Internal indexes point into a
corrupted data structure.

**Why it's dangerous:**
- No error is returned — the caller assumes load succeeded.
- Version check absent means loading a stale file silently corrupts state.
- Internal index structures are not serialised — partial load leaves them inconsistent.

**Countermeasure (PT-C3):** check every read. Read into temporaries; commit to shared
state only after all reads succeed. Verify magic and version before any data read.

---

### AP-C4: Explicit Euler in Physics Hot-Path

**Symptom:** Position updated with old velocity (`p += v_old * dt`). No acceleration
currently means no visible bug — but adding a constant force later produces energy
divergence without any change at the force callsite.

**Real antipattern example:**
```c
/* typescript: Explicit Euler — WRONG structure for systems with forces */
position += velocity * dt;   /* uses v_old */
velocity += force    * dt;   /* updated after — too late */
```

**Why it's dangerous:**
- Bug is latent — invisible until forces are added. By then the structure is relied upon.
- Energy diverges +1114% over 1000 steps at dt=0.05 (Millington §2.1).

**Countermeasure (PT-C4):** Symplectic Euler — update velocity before position.

---

### AP-C5: Inconsistent Pool/Module Naming Across the Codebase

**Symptom:** Multiple modules implement the same pattern (free-list, pool, queue) but
use different identifier names for the same logical concept across modules.

**Why it's dangerous:**
- A reviewer reading one module cannot recognise the pattern in another — higher
  cognitive load, higher chance of incorrect modification.
- Cross-module bugs (e.g., missing a double-free guard) are caught in one module
  but missed in others because the code looks different.

**Countermeasure:** standardise naming: `{module}_free_head`, `{module}_next[]`,
`{module}_active[]`. Document the naming convention in `CLASS_MAP.md`.

---

### AP-C6: Loop-Exit Flag Not Declared Volatile

**Symptom:** The loop never exits after a callback sets the exit flag. Invisible at
debug builds (`-O0`/`-O1`); only manifests at release optimisation level.

**Real antipattern example:**
```c
/* typescript: NOT volatile — hoistable at -O2 */
int running;
while (running) {
    update();
    render();
    /* compiler may hoist 'running' to a register — loop never reads memory */
}
```

**Why it's dangerous:**
- Application becomes unresponsive with no crash, no log, no assert.
- Only appears in release builds — not caught by debug-mode CI.

**Countermeasure (PT-C6):** declare as `volatile`. Reserve for loop-exit flags only —
do not apply broadly.

---

### AP-C7: Shell Execution via Wrapper with User-Controlled Paths

**Symptom:** Subprocess launched via a shell wrapper (`system()`, `sh -c`, `exec sh`)
where the command string includes user-controlled or externally-sourced content.

**Real antipattern example:**
```c
/* typescript: NEVER do this with external input */
char cmd[256];
snprintf(cmd, sizeof(cmd), "player %s", path);
system(cmd);  /* path = "test.wav; rm -rf /" */
```

**Why it's dangerous:**
- Any shell metacharacter in the path executes arbitrary commands with process privileges.
- No sanitisation is reliable against all shell injection vectors.
- Shell also respects the caller's `PATH` — an attacker controlling `PATH` can
  redirect the binary.

**Countermeasure (PT-C7):** validate path against a metacharacter blocklist, then spawn
directly with an argv array — no shell is invoked.

---

### AP-C8: Fixed Sleep Regardless of Loop Body Execution Time

**Symptom:** Fixed sleep at the end of every iteration, regardless of how long the
loop body took. CPU budget wasted when the body is fast; latency added when slow.

**Real antipattern example:**
```c
/* typescript: fixed sleep — ignores body cost */
while (running) {
    update();
    render();
    sleep_ms(1);   /* fixed — no accounting for body time */
}
```

**Why it's dangerous:**
- Fast body: loop runs above target rate, burning CPU unnecessarily.
- Slow body: fixed sleep adds gratuitous extra latency on top.
- Target frame/request budget is never achieved reliably.

**Countermeasure (PT-C8):** measure body time; sleep only the remaining budget:
`sleep(max(0, target_interval - elapsed))`.

---
