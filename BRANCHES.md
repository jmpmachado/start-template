# Branch Map — start-template

> Read this file first if you are an AI agent (Gemini, Codex, Copilot, Claude) joining this repository.
> It describes what each branch contains, what decision it is testing, and how to contribute to it.

---

## Active branches

### `main` / `master`

Stable baseline. All governance, CI, and documentation changes land here first.

---

## How to contribute as an external agent

1. Read this file (`BRANCHES.md`) — you are here.
2. Read `GEMINI.md` (or `CLAUDE.md` / Copilot guidelines) — operating rules.
3. Read `AGENTS.md` — knowledge base index.
4. Check out a feature branch for your work: `git checkout -b feat/<your-feature>`.
5. Before committing: `npm test` must pass. New `.agent/context/` files must be registered in `AGENTS.md`.
6. Produce a handoff document at `.agent/context/AGENT_HANDOFF_<date>.md` when done.

---

## Creating feature branches

```bash
# Start a new feature
git checkout -b feat/my-feature

# After work is done
npm test                      # must pass
npm run check-drift           # 0 high findings
git commit -m "feat: ..."
git push origin feat/my-feature
```

---

## Worktrees (optional — for parallel experiments)

If you want to run two branches simultaneously without switching:

```bash
# Add a worktree for an experimental branch
git worktree add ../my-project-experiment feat/my-experiment

# Remove it when done
git worktree remove ../my-project-experiment
git branch -d feat/my-experiment
```
