# Agent Handoff Protocol — start-project

> Governs context transfer between AI agent sessions: same-agent session resets,
> cross-agent handoffs (Claude → Codex, Claude → Copilot), and human-to-agent
> context bootstraps. All agents must produce and consume this format.

---

## 1. When to Trigger a Handoff

| Trigger | Threshold |
| :--- | :--- |
| Same-agent session reset | Every 15–20 messages, or when context utilization > 50% |
| Cross-agent transfer | Before switching primary agent on an active task |
| End of work session | Before closing any session with uncommitted decisions |
| Incident handoff | Any time a human or agent hands off an active incident |

---

## 2. Handoff Document Format

```markdown
## Agent Handoff — [YYYY-MM-DD HH:MM UTC]

### Outgoing Agent
- Tool: [Claude Code / Codex / Copilot / Antigravit]
- Model: [model id]
- Session length: [N messages / N tokens estimated]

### Task State
- **Objective:** [one sentence — what was being accomplished]
- **Status:** [In Progress / Blocked / Completed / Abandoned]
- **Blocker (if any):** [what is blocking, what was tried]

### Completed in This Session
- [bullet: action + outcome, not "I did X" but "X was done, result: Y"]

### Immediate Next Action
- [single next atomic step the incoming agent should take]

### Open Decisions
- [decision needing resolution + context + options considered]

### Files Modified
- [path] — [one-line summary of change]

### Do NOT Repeat
- [actions already attempted that failed — save the incoming agent from retrying]

### Context Pointers
- [links to relevant `.agent/context/` files that informed this session]
```

---

## 3. Rules for Outgoing Agent

1. Write the handoff document **before** ending the session.
2. Append to `DECISION_LOG.md` any non-trivial decision made during the session.
3. Ensure `AGENTS.md` is up-to-date if any `.agent/context/` file was added.
4. Run `[PRE_COMMIT_GATE]` (default Node.js: `npm run lint && npm run typecheck && npm test`) — report pass/fail in handoff.
5. Commit or stash all work-in-progress — never leave the repo in a dirty state at handoff.

---

## 4. Rules for Incoming Agent

1. Read this handoff document before any other action.
2. Read `AGENTS.md` to orient in the knowledge base.
3. Verify the immediate next action is still valid (file states change between sessions).
4. Do not repeat actions listed in "Do NOT Repeat."
5. If the handoff document is absent or stale (> 24h), treat the task as cold-start:
   read `ARCHITECTURE.md`, `BACKLOG.md`, and `DECISION_LOG.md` in that order.
6. **Full-scope read is mandatory before any audit, gap analysis, or review task.**
   An audit performed on a partial file set produces a partial gap list — missed gaps
   compound silently across sessions. Before reporting gaps, confirm every file in
   `.agent/context/` has been read in the current session. The guard: if the number
   of files read is less than the count registered in `AGENTS.md`, the audit is
   incomplete and must not be treated as definitive.

---

## 5. Cross-Agent Compatibility

| Receiving Agent | Reads This File As |
| :--- | :--- |
| Claude Code | Auto-loaded if in `.agent/context/` via AGENTS.md; reference with `@AGENT_HANDOFF.md` |
| Codex CLI | Pass via `--context` flag or paste into session prompt |
| Copilot Chat | Paste into chat or attach via Copilot Workspace |
| Gemini CLI | Paste into session or reference via `GEMINI.md` |
| Antigravit | Inject as system context block |

---

## 6. Agent Portability Matrix

> Which rules and features are available per agent. Rule 8 = analysis falsification default. Rule 9 = code artifact modes.

| Feature | Claude Code | Copilot Chat | Gemini CLI | Codex CLI |
| :--- | :---: | :---: | :---: | :---: |
| Rule 8 (falsification default) | ✅ Native | ✅ Via instructions | ✅ Via GEMINI.md | ✅ Via .codex/instructions.md |
| Rule 9 (code artifact modes) | ✅ Native | ✅ Text triggers | ✅ Text triggers | ✅ Text triggers |
| Slash commands (`/code-falsify` etc.) | ✅ `.claude/commands/` | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| Skills (`/lint-all`, `/full-falsify`) | ✅ FleetView skills | ❌ | ❌ | ❌ |
| Mode announcement (`> Mode: …`) | ✅ | ✅ Instructed | ✅ Instructed | ✅ Instructed |
| Token log (`token_log.jsonl`) | ✅ Via CLAUDE.md | ❌ Manual only | ❌ Manual only | ❌ Manual only |
| AGENTS.md guard | ✅ Rule 1 | ✅ Rule 1 | ✅ Rule 1 | ✅ Rule 1 |
| Pre-commit gate | ✅ | ✅ | ✅ | ✅ |
| `.agent/MEMORY.md` | ✅ Auto-memory | ❌ Manual | ❌ Manual | ❌ Manual |

**Text trigger equivalents** (for agents without slash commands):

| Slash command | Text trigger |
| :--- | :--- |
| `/code-falsify` | write "code-falsify" in the prompt |
| `/doc-falsify` | write "doc-falsify" in the prompt |
| `/map-lint` | write "map-lint" in the prompt |
| `/machine-falsify` | write "machine-falsify" in the prompt |
| `/full-falsify` | write "full-falsify" in the prompt |
| `/lint-all` | write "lint-all" in the prompt |
| `/falsify-docs` | write "falsify-docs" in the prompt |

---

## 7. Mid-Sprint Agent Switch Protocol

Use when switching the primary agent mid-sprint (e.g., Claude Code → Copilot, Claude Code → Gemini CLI).

### What persists automatically

- All committed code and documents (git).
- `AGENTS.md`, `.agent/context/`, BACKLOG.md sprint state.
- `.agent/MEMORY.md` (if the incoming agent can read it).

### What must be injected manually

The incoming agent starts cold. Before any task, paste the following context block:

```text
Active sprint: Sprint [N] — [theme]
Current task: [US-ID] — [description]
Status: [In Progress / Blocked]
Last action: [one sentence]
Files modified this sprint: [list]
Open decisions: [list or "none"]
Read first: AGENTS.md, .agent/context/BACKLOG.md, .agent/context/AGENT_HANDOFF.md
```

### What is lost on switch

| Lost | Mitigation |
| :--- | :--- |
| In-memory session context | Write handoff document before switching |
| Claude-specific skills (`/lint-all` etc.) | Use text triggers in the new agent |
| Token log automation | Append manually to `memory/token_log.jsonl` |
| Auto-memory writes | Update `.agent/MEMORY.md` manually before switch |

### Per-agent cold-start injection

**Copilot Chat:**

```text
[Paste AGENT_HANDOFF document + active sprint context block]
Read AGENTS.md and .agent/context/BACKLOG.md before proceeding.
Operating rules: .github/copilot-instructions.md
```

**Gemini CLI:**

```text
[Paste AGENT_HANDOFF document + active sprint context block]
Read AGENTS.md and .agent/context/BACKLOG.md before proceeding.
Operating rules: GEMINI.md
```

**Codex CLI:**

```text
[Pass via --context flag or paste]
[Paste AGENT_HANDOFF document + active sprint context block]
Read AGENTS.md and .agent/context/BACKLOG.md before proceeding.
Operating rules: .codex/instructions.md
```

---

## 8. Handoff Log

> Append one entry per handoff. Do not edit past entries.

| Date | From | To | Task | Status |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD] | [agent] | [agent] | [task] | [status] |

---

## See Also

- [CLAUDE.md](../../CLAUDE.md) — Claude Code runtime contract and agent operating rules
- [GEMINI.md](../../GEMINI.md) — Gemini CLI runtime contract
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) — GitHub Copilot runtime contract
