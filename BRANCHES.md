# Branch Map — start-template

> Read this file first when you join this repository.
> It describes what each branch contains, what decision it is testing, and how to contribute to it.

---

## Active branches

### `main` / `master`

Stable baseline. All governance, CI, and documentation changes land here first.

---

## How to contribute

1. Read this file (`BRANCHES.md`) — you are here.
2. Read `CONTRIBUTING.md` — workflow and review rules.
3. Check out a feature branch for your work: `git checkout -b feat/<your-feature>`.
4. Before committing: `npm test` must pass.

---

## Creating feature branches

```bash
# Start a new feature
git checkout -b feat/my-feature

# After work is done
npm test                      # must pass
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
