# Branch Map — design-first-template

> Read this file first if you are an AI agent (Gemini, Codex, Copilot, Claude) joining this repository.
> It describes what each branch contains, what decision it is testing, and how to contribute to it.

---

## Active branches

### `master`
Stable baseline. All governance, CI, and documentation changes land here first.
Do not run experimental wizard implementations on this branch.

---

### `feat/cookiecutter-b1-hybrid`
**Decision under test:** B1 — cookiecutter as optional accelerator, standalone Python fallback preserved.

| Item | Detail |
|---|---|
| **Hypothesis** | A project adopter should be able to run the wizard with or without `cookiecutter` installed. If `cookiecutter` is present, it handles `[CONFIGURE]` parametrisation. If absent, `wizard.py --standalone` applies placeholder replacement directly. |
| **Key files** | `cookiecutter.json`, `infra/scripts/wizard.py`, `infra/scripts/install_check.py` |
| **Discriminator** | Does the standalone fallback (`python3 infra/scripts/wizard.py --standalone`) produce a valid `AGILE_CONFIG.md` in an environment without `pip` or `cookiecutter`? |
| **How to test** | 1. `pip uninstall cookiecutter` (or use a container without pip). 2. `python3 infra/scripts/wizard.py --standalone`. 3. Verify `AGILE_CONFIG.md` has no `[CONFIGURE]` placeholders. 4. `python3 infra/scripts/install_check.py` → should exit 0 (cookiecutter marked optional). |
| **Merge condition** | Standalone produces valid output AND `npm test` passes 17/17 |

**Agent instruction:** check out this branch, run the discriminator test above, report result in `AGENT_HANDOFF.md`.

```bash
git checkout feat/cookiecutter-b1-hybrid
python3 infra/scripts/wizard.py --standalone
python3 infra/scripts/install_check.py
```

---

### `feat/cookiecutter-b2-pure`
**Decision under test:** B2 — cookiecutter required, no standalone fallback.

| Item | Detail |
|---|---|
| **Hypothesis** | Any adopter of this template has Python + pip available (standard in 2026). Requiring `cookiecutter` removes the need to maintain a parallel placeholder-replacement engine. Simpler codebase, smaller wizard. |
| **Key files** | `cookiecutter.json`, `infra/scripts/wizard.py` (no `--standalone` flag), `infra/scripts/install_check.py` (cookiecutter required) |
| **Discriminator** | Does `python3 infra/scripts/install_check.py` correctly block adoption in a pip-less environment (Alpine container, restricted CI runner)? |
| **How to test** | 1. `pip install cookiecutter`. 2. `cookiecutter . --no-input` (generates project in parent dir). 3. `cd ../my-project && python3 infra/scripts/wizard.py`. 4. Verify `AGILE_CONFIG.md` filled. 5. Separately: `pip uninstall cookiecutter` → `python3 infra/scripts/install_check.py` → must exit 1. |
| **Merge condition** | cookiecutter generation produces valid project AND install_check exits 1 when cookiecutter missing |

**Agent instruction:** check out this branch, run the discriminator test above, report result in `AGENT_HANDOFF.md`.

```bash
git checkout feat/cookiecutter-b2-pure
pip install cookiecutter
cookiecutter . --no-input
python3 infra/scripts/install_check.py
```

---

## Decision criteria — which branch wins?

| Scenario | B1 wins | B2 wins |
|---|---|---|
| Alpine container (no pip) | ✅ | ❌ |
| GitHub Actions ubuntu-latest | ✅ | ✅ (pip available) |
| Windows dev machine (no Python yet) | ✅ (winget → python3, no pip needed for B1 fallback) | ⚠️ (needs pip after winget) |
| Air-gapped environment | ✅ | ❌ |
| Simplicity of wizard codebase | ⚠️ (two code paths) | ✅ |
| Integration with cookiecutter ecosystem | ✅ (same) | ✅ (same) |

**Merge B1** if any adopter profile requires pip-less operation.
**Merge B2** if all adopter profiles guarantee pip (and you prefer the smaller codebase).

After decision: delete the losing branch, merge the winning branch into `master`, update `BACKLOG.md` US-V2-24/25/26 status.

---

## Sprint 18 — Agent Portability (parallel work, any branch)

Sprint 18 (Rule 8/9 portability to Copilot/Gemini/Codex) is **independent of the B1/B2 decision**.
It can be executed on `master` directly.

Self-contained prompt for any agent: `.agent/context/HANDOFF_SPRINT18_AGENT_PORTABILITY.md`
Paste that file as the system prompt — no prior context required.

---

## Local worktrees

Both branches are checked out as git worktrees on the maintainer's machine:

| Path | Branch |
|---|---|
| `e:\Users\jmpma\Documents\project-template` | `master` |
| `e:\Users\jmpma\Documents\TUI\project-template-b1` | `feat/cookiecutter-b1-hybrid` |
| `e:\Users\jmpma\Documents\TUI\project-template-b2` | `feat/cookiecutter-b2-pure` |

Worktrees share the same `.git` — a commit on B1 appears in `git log` of the monorepo immediately.
Each worktree can be opened as an independent VSCode workspace.

**Lifecycle:** after the B1/B2 decision is made, remove the losing worktree:
```bash
git worktree remove e:\Users\jmpma\Documents\TUI\project-template-b1  # or b2
git branch -d feat/cookiecutter-b1-hybrid                              # or b2
git push origin --delete feat/cookiecutter-b1-hybrid                   # or b2
```

---

## How to contribute as an external agent

1. Read this file (`BRANCHES.md`) — you are here.
2. Read `CLAUDE.md` — operating rules (Rule 8/9, mode announcement, guard rules).
3. Read `AGENTS.md` — knowledge base index.
4. Check out the branch you are assigned to (or `master` for Sprint 18).
5. Before committing: `npm test` must pass 17/17. New `.agent/context/` files must be registered in `AGENTS.md`.
6. Produce a handoff document at `.agent/context/AGENT_HANDOFF_<date>.md` when done.
