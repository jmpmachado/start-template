# State Machines — start-project

> Formal documentation of states, transitions, and side effects of all subsystems.
> Criticality level: **mission-critical** — each error state must have explicit handling.
> Update this file whenever a state machine changes in code.

---

## Notation Convention

```
[CURRENT_STATE] --EVENT--> [NEXT_STATE] | EFFECT: <description>
```

- **States in CAPITALS** — canonical identifiers
- **Events in italics** — external triggers (I/O, timer, function call)
- **EFFECT** — observable side effects: emissions, logging, cleanup, state write

**Terminal states** are marked with `(terminal)`.
**Error states** must always have at least one recovery or rejection transition.

---

## State Machine Inventory

| ID    | Subsystem              | Responsible Component | Initial State   | Terminal States   |
| :---- | :--------------------- | :-------------------- | :-------------- | :---------------- |
| SM-01 | [Session / Connection] | `[Component]`         | IDLE            | TERMINATED        |
| SM-02 | [Resource Quota]       | `[Component]`         | ACTIVE          | EXHAUSTED         |
| SM-03 | [Authentication]       | `[Component]`         | UNAUTHENTICATED | REVOKED           |
| SM-04 | [Background Job]       | `[Component]`         | QUEUED          | COMPLETED, FAILED |

> Add a row for every stateful subsystem. One row per machine.

---

## SM-01: [Session / Connection] — Template

**Responsible:** `[path/component.ts]`
**Scope:** per [session ID / request ID / user ID] — each instance is an independent machine.

```
[IDLE]
  --on_connect--> [CONNECTING] | EFFECT: allocate session, log connect event

[CONNECTING]
  --on_ready--> [ACTIVE] | EFFECT: emit "ready", register heartbeat timer
  --on_timeout--> [ERROR] | EFFECT: log timeout, emit "error"
  --on_reject--> [TERMINATED] | EFFECT: log rejection reason, cleanup

[ACTIVE]
  --on_request(data)--> [PROCESSING] | EFFECT: validate input, enqueue job
  --on_heartbeat_miss--> [STALE] | EFFECT: log missed heartbeat, start grace timer
  --on_disconnect--> [TERMINATED] | EFFECT: cleanup resources, log duration

[PROCESSING]
  --on_complete(result)--> [ACTIVE] | EFFECT: emit result, update metrics
  --on_error(err)--> [ACTIVE] | EFFECT: emit error, log with context (no crash)
  --on_timeout--> [ACTIVE] | EFFECT: emit timeout error, release job slot

[STALE]
  --on_reconnect--> [ACTIVE] | EFFECT: reset heartbeat timer
  --on_grace_expired--> [TERMINATED] | EFFECT: force-cleanup, log stale session

[ERROR]
  --on_retry (≤ MAX_RETRIES)--> [CONNECTING] | EFFECT: increment retry counter
  --on_retry (> MAX_RETRIES)--> [TERMINATED] | EFFECT: log max retries, cleanup

[TERMINATED] (terminal)
  | EFFECT: remove from session registry, release all resources
```

---

## SM-02: [Resource Quota] — Template

**Responsible:** `[path/quotaService.ts]`
**Scope:** per [user / tenant / request]

```
[ACTIVE]
  --on_consume(amount)--> [ACTIVE] | EFFECT: deduct quota, emit "quota_updated"
  --on_consume(amount) if remaining < threshold--> [WARNING] | EFFECT: emit "quota_warning"
  --on_consume(amount) if remaining <= 0--> [EXHAUSTED] | EFFECT: emit "quota_exceeded", reject request

[WARNING]
  --on_consume(amount) if remaining > threshold--> [ACTIVE] | EFFECT: clear warning flag
  --on_consume(amount) if remaining <= 0--> [EXHAUSTED] | EFFECT: emit "quota_exceeded"
  --on_reset--> [ACTIVE] | EFFECT: restore full quota, log reset

[EXHAUSTED]
  --on_reset--> [ACTIVE] | EFFECT: restore full quota, log reset
  --on_consume(amount)--> [EXHAUSTED] | EFFECT: emit "quota_exceeded" (idempotent)

[ACTIVE / WARNING / EXHAUSTED]
  --on_audit--> [same state] | EFFECT: log current usage snapshot
```

---

## SM-03: [Authentication Flow] — Template

**Responsible:** `[path/authService.ts]`
**Scope:** per credential / token lifecycle

```
[UNAUTHENTICATED]
  --on_login(credentials)--> [VALIDATING] | EFFECT: hash+compare credentials

[VALIDATING]
  --on_valid--> [AUTHENTICATED] | EFFECT: issue token, set expiry, log success
  --on_invalid--> [UNAUTHENTICATED] | EFFECT: increment failure counter, log attempt
  --on_locked--> [LOCKED] | EFFECT: emit "account_locked", log lockout

[AUTHENTICATED]
  --on_request (token valid)--> [AUTHENTICATED] | EFFECT: refresh sliding window
  --on_token_expired--> [UNAUTHENTICATED] | EFFECT: clear session
  --on_logout--> [UNAUTHENTICATED] | EFFECT: revoke token, log logout
  --on_revoke--> [REVOKED] | EFFECT: add token to denylist, log admin action

[LOCKED]
  --on_unlock (admin)--> [UNAUTHENTICATED] | EFFECT: reset failure counter, log admin unlock
  --on_lockout_expired (timer)--> [UNAUTHENTICATED] | EFFECT: auto-reset failure counter, log timeout unlock

[REVOKED] (terminal)
  | EFFECT: token permanently invalid, reject all requests with this token
```

---

## SM-REF-01: Input Poll with EINTR Recovery — Reference Pattern

> **When to use:** any subsystem that uses `select()`, `poll()`, or a blocking read to
> wait for I/O. Copy and adapt this pattern — do not invent ad-hoc EINTR handling.

**Responsible:** `[path/input_driver.c or equivalent]`
**Scope:** per polling tick — stateless between ticks, transient state within one call.

```
[IDLE]
  --poll_tick()--> [POLLING] | EFFECT: enter blocking wait (select/poll/read)

[POLLING]
  --data_ready--> [READING] | EFFECT: read bytes from fd into buffer
  --timeout--> [IDLE] | EFFECT: return KEY_NONE / no-op
  --select returns -1 && errno == EINTR--> [EINTR_FLUSH] | EFFECT: discard partial ESC buffer; errno is reset

[EINTR_FLUSH] (transient — must not block)
  --flush_complete--> [IDLE] | EFFECT: return KEY_NONE; signal handler runs on next tick

[READING]
  --decode_complete(key)--> [IDLE] | EFFECT: return decoded key event
  --decode_incomplete--> [POLLING] | EFFECT: wait for more bytes (multi-byte sequence)
  --decode_error--> [IDLE] | EFFECT: discard buffer, return KEY_NONE, log warning
```

**EINTR invariant:** the EINTR_FLUSH handler must be async-signal-safe — no heap alloc,
no stdio, no non-reentrant calls. Its only effect is resetting the partial buffer pointer.

**Platform note:** on platforms where `select()` is unavailable (e.g., bare-metal, RTOS),
replace [POLLING] with the platform's equivalent blocking primitive. If no equivalent
exists, [POLLING] transitions directly to [PLATFORM_NONE].

```
[POLLING]
  --platform has no blocking I/O primitive--> [PLATFORM_NONE] | EFFECT: return KEY_NONE
[PLATFORM_NONE] (terminal for this tick)
  | EFFECT: caller falls back to polling at next tick; log "input not supported on platform"
```

---

## SM-REF-02: Child Process / Subprocess Launch — Reference Pattern

> **When to use:** any subsystem that spawns a subprocess (`fork`/`execvp`, `CreateProcess`,
> worker thread). Copy and adapt — do not use `system()`.

**Responsible:** `[path/subprocess_driver.c or equivalent]`
**Scope:** per subprocess lifecycle.

```
[IDLE]
  --launch(cmd, args)--> [VALIDATING] | EFFECT: sanitise cmd path (blocklist metacharacters)

[VALIDATING]
  --path_safe--> [SPAWNING] | EFFECT: prepare argv[], set up pipes
  --path_unsafe--> [REJECTED] | EFFECT: log injection attempt, return error

[SPAWNING]
  --fork/CreateProcess succeeds--> [RUNNING] | EFFECT: store child PID/handle
  --fork/CreateProcess fails--> [FAILED] | EFFECT: log errno/GetLastError, return error

[RUNNING]
  --child exits (waitpid/WaitForSingleObject)--> [REAPED] | EFFECT: collect exit code, close handles
  --kill_requested--> [TERMINATING] | EFFECT: send SIGTERM / TerminateProcess

[TERMINATING]
  --child exits--> [REAPED] | EFFECT: collect exit code, close handles
  --kill_timeout--> [REAPED] | EFFECT: send SIGKILL / force-close, log forced kill

[REAPED] (terminal)
  | EFFECT: release PID/handle, log exit code

[REJECTED] (terminal)
  | EFFECT: no subprocess started; caller receives error code

[FAILED] (terminal)
  | EFFECT: no subprocess started; caller receives error code

[PLATFORM_NONE] (terminal — platform has no subprocess support)
  | EFFECT: log "subprocess not supported on platform"; caller falls back to no-op
```

**Platform note:** if `fork`/`execvp` are unavailable ([SPAWNING] cannot proceed),
transition to [PLATFORM_NONE] instead. Document the platform constraint in the inventory
table above.

---

## Adding a New State Machine

1. Add a row to the **State Machine Inventory** table above.
2. Copy the notation template and fill in states/transitions.
3. Ensure every error state has at least one outgoing transition.
4. Update the responsible component's docstring to reference this SM ID.
5. Write a unit test that exercises every transition (TDD first).
