# Start Here

4 steps from clone to first sprint for beginners.

## Step 1 — Prerequisites (2 min)

- Node ≥ 24
- Check with: `node --version`

## Step 2 — Install & Verify (2 min)

Run the test suite and drift scanner to verify the project environment is clean:

```bash
cd tooling && npm install
npm test
npm run check-drift
```

All unit, documentation, and integrity tests must pass successfully.

## Step 3 — Review operating rules (5–10 min)

Before writing any code, open and review these files:
- `CLAUDE.md` (or `GEMINI.md` / Copilot guidelines)
- `.agent/context/AGENT_GUIDELINES.md` — Core operating rules
- `AGENTS.md` — Full documentation file index

## Step 4 — Plan Sprint 01 (5–10 min)

- Open `.agent/context/BACKLOG.md`.
- Edit/Add your first user stories under Sprint `ADOPT-01`.
- Keep it lean: ≤ 3 user stories for your first sprint.
- Align with the operating guidelines during development.
