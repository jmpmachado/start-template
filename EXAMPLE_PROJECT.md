# Example Project: task-api

A minimal REST API for task management — demonstrates how a child project adopts this template. Stack: .NET 9 Minimal API + PostgreSQL + HTML5 Frontend (PROJECT_STACK=dotnet).

## Project identity

| Field | Value |
| :--- | :--- |
| Name | `task-api` |
| Stack | `dotnet` |
| Team size | Solo engineer |
| Template version | v1.0.0 |

## Sprint 00 — Scaffold (complete)

- Configured `AGILE_CONFIG.md` manually, filling all placeholders.
- Replaced `start-project` → `task-api` across AGENTS.md, CLAUDE.md, ONBOARDING.md.
- Added task domain entity and database context in backend.
- `dotnet test` and `npm test` — all tests passing.

## Sprint 01 — First feature (planned)

- US-01: `POST /tasks` endpoint with input validation and EF Core persistence.
- US-02: DORA baseline — measure deploy frequency from first PR merge.

## Lessons learned

- `AGILE_CONFIG.md` must be filled out before running `check-drift` or it reports unfilled placeholders.
