## Agent Handoff — Sprint 18 — Agent Portability (Rule 8/9)

> **Self-contained prompt** — paste this entire file as the system prompt (or first user message)
> for any agent session: Gemini, Copilot, Codex, or a new Claude Code session.
> No prior context required.

---

### Outgoing Agent
- Tool: Claude Code / claude-sonnet-4-6
- Session: context-window exhausted; handoff triggered per AGENT_HANDOFF.md §1
- Repo: `design-first-template` — language-agnostic engineering template

---

### Task State
- **Objective:** Implement Sprint 18 — port Rule 8 and Rule 9 from `CLAUDE.md` to Copilot, Gemini, and Codex instruction files, and document agent portability matrix.
- **Status:** Not started — sprint defined, not executed.
- **Blocker:** None — all dependencies available in repo.

---

### What You Need to Know (Rule 8 and Rule 9)

These two rules govern how the AI agent behaves when analyzing vs. building artifacts.

**Rule 8 — Analysis defaults to falsification:**
> When performing any analysis, review, audit, or verification of documentation, compliance, or architecture — assume gaps exist, probe whether coverage is operationally complete, rate findings 🔴/🟡/🟢, declare scope checked. Do not report "no gaps found" without explicit scope declaration. Announce `> Mode: doc-falsify [Rule 8]` at the start of the turn.
> **Exception:** Rule 9 overrides Rule 8 when the primary artifact is a code file (`*.ts`, `*.js`, `*.py`, `*.go`, `*.rs`).

**Rule 9 — Code artifact modes, explicit trigger only:**
> For code files, docstrings, class maps, and state machines: default is **construct mode** (build/edit, no audit). Modes activate only on explicit user instruction. Announce `> Mode: <mode>` at the start of every turn.
>
> Three levels per domain:
> - `*-construct` — build or edit. No audit. **Default.**
> - `*-lint` — conformance check: naming, format, mandatory fields, obvious omissions.
> - `*-falsify` — assume failure exists. Enumerate breaking inputs, unprotected invariants, contract violations. Emit findings with severity 🔴/🟡/🟢.
>
> Four domains: `code-*` (implementation), `doc-*` (docstrings), `map-*` (CLASS_MAP/ARCHITECTURE), `machine-*` (STATE_MACHINE).
>
> Text triggers: "audit this function" → `code-falsify`. "review the docstring" → `doc-falsify`. "check the class map" → `map-falsify`. "analyse the state machine" → `machine-falsify`. Absent explicit trigger → `*-construct`.

---

### Sprint 18 — User Stories

Execute in order (each is independent):

#### US-V2-06 — Copilot Rule 8/9
**File:** `.github/copilot-instructions.md`
**Task:** Add a section "Analysis & Code Artifact Modes" with:
- Rule 8: falsification default for analysis/audit/review requests. Announce mode at start of response.
- Rule 9: code files default to construct mode; lint/falsify require explicit trigger. Table of text triggers.
- Note: Copilot has no slash commands — text triggers only.
- Note: `.github/copilot-instructions.md` already exists in repo — append section, do not overwrite.

**Acceptance:** Section present; covers Rule 8 + Rule 9; no slash command references; CI `docs-integrity` passes.

#### US-V2-07 — Gemini Rule 8/9
**File:** `GEMINI.md`
**Task:** Add a section "Analysis & Code Artifact Modes" with same content as US-V2-06 but adapted for Gemini CLI:
- Gemini supports `/` commands via `gemini.md` directives — if the file format supports it, add command aliases. If not, text triggers only.
- Include mode announcement format: `> Mode: <mode> [Rule 8/9]`

**Acceptance:** Section present in GEMINI.md; covers both rules; mode announcement documented.

#### US-V2-08 — Codex instructions file
**File:** `.codex/instructions.md` (create if not exists)
**Task:**
- Create `.codex/` directory and `instructions.md`.
- Add Rule 8 + Rule 9 adapted for OpenAI Codex (text triggers only, no slash commands).
- Register the new file in `AGENTS.md` under the appropriate section.
- CI `docs-integrity` test checks `AGENTS.md` bidirectional consistency — verify test passes.

**Acceptance:** File created; registered in AGENTS.md; `npm test` passes 17/17.

#### US-V2-09 — Agent portability matrix
**Files:** `AGENT_HANDOFF.md`, `USER_GUIDE.md §7`
**Task:** Add table "Agent Portability — Rule 8/9 Feature Matrix":

| Feature | Claude Code | Copilot | Gemini | Codex |
|---|---|---|---|---|
| Rule 8 (falsification default) | ✅ Native | ✅ Via instructions | ✅ Via GEMINI.md | ✅ Via instructions |
| Rule 9 (code modes) | ✅ Native | ✅ Text triggers | ✅ Text triggers | ✅ Text triggers |
| Slash commands | ✅ `.claude/commands/` | ❌ | Partial (check Gemini CLI docs) | ❌ |
| Skills | ✅ `.agent/skills/` | ❌ | ❌ | ❌ |
| Token log | ✅ Auto (memory/) | ❌ Manual | ❌ Manual | ❌ Manual |
| AGENT_HANDOFF.md | ✅ | ✅ Manual inject | ✅ Manual inject | ✅ Manual inject |

Add this table to both files. In USER_GUIDE.md, place it in §7 (Working with AI Agents) after the existing skills table.

**Acceptance:** Table present in both files; accurate per current agent capabilities.

#### US-V2-10 — Cross-agent handoff protocol
**File:** `AGENT_HANDOFF.md`
**Task:** Add section "Cross-Agent Handoff — Mid-Sprint Switch":
- What persists: committed files, BACKLOG.md, DECISION_LOG.md
- What is lost: agent memory, slash commands, skills, token log automation
- What to inject manually: AGILE_CONFIG.md + AGILE_GUIDE.md + last AGENT_HANDOFF.md + Rules 8/9 (paste text from CLAUDE.md §Rule 8-9)
- Checklist for each target agent (Copilot, Gemini, Codex): 3 items max per agent

**Acceptance:** Section covers 3 target agents; checklist present; cross-referenced from USER_GUIDE.md §7.

---

### Completed in Prior Sessions (do not redo)
- Rules 8 and 9 fully implemented in `CLAUDE.md`
- 15 slash commands created in `.claude/commands/`
- Rules 8/9 documented in `CLAUDE_TOKEN_OPTIMIZATION.md`, `AGILE_GUIDE.md §5.4`, `USER_GUIDE.md §7`
- Sprint 18 US definitions registered in `BACKLOG.md`

---

### Pre-commit Gate
Before each commit:
```bash
npm run lint && npm run typecheck && npm test
```
All 17 tests must pass. `docs-integrity` test enforces `AGENTS.md` bidirectional consistency.

### AGENTS.md Guard
Any new file in `.agent/context/` must be registered in `AGENTS.md` in the same commit.
`.codex/instructions.md` goes in a new section "Codex Instructions" — not in `.agent/context/`.

### Repository location
`e:\Users\jmpma\Documents\project-template` (Windows) or clone from GitHub remote.

---

*Generated by Claude Code claude-sonnet-4-6 — 2026-05-24*
*Outgoing session: design-first-template / v2.0 roadmap implementation*
