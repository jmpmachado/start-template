# Example Project: task-api

A minimal REST API for task management — demonstrates how a child project adopts
this template. Stack: Node.js 22 + Fastify + PostgreSQL (PROJECT_STACK=node).

## Project identity

| Field | Value |
| :--- | :--- |
| Name | `task-api` |
| Stack | `node` |
| Team size | Solo engineer |
| Template version | v1.0.0 |

## Sprint 00 — Scaffold (complete)

- Ran `python3 infra/scripts/wizard.py`, filled all `[CONFIGURE…]` placeholders.
- Replaced `start-project` → `task-api` across AGENTS.md, CLAUDE.md, ONBOARDING.md.
- Added `src/domain/task.ts` (Task entity) and `src/application/createTask.ts` (use case).
- `npm test` — 3 unit tests passing (task entity, createTask happy path, validation error).

## Sprint 01 — First feature (planned)

- US-01: `POST /tasks` endpoint with Zod validation and Drizzle ORM persistence.
- US-02: DORA baseline — measure deploy frequency from first PR merge.

## Lessons learned

- Wizard `profiles.yaml` defaults to `lean` profile — switch to `standard` for team projects.
- `AGILE_CONFIG.md` wizard output must be committed before running `check-drift` or it
  reports 29 unfilled placeholders (expected — see DL-018 notes on wizard-first workflow).
