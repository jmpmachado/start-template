# Migration Guide — Adopting the Template in an Existing Project

> Use this guide when your project **already exists** and you want to absorb the template's
> governance layer. If you are starting from zero, use `START_HERE.md` instead.

---

## When to use this guide

| Scenario | Guide |
| :--- | :--- |
| New project, blank repo | `START_HERE.md` |
| Existing project, no prior template | This file — § A (clean adoption) |
| Existing project using a proto-version of this template | This file — § B (proto-version migration) |
| Updating an already-adopted project to a newer template version | `TEMPLATE_UPGRADE_PROTOCOL.md` |

---

## § A — Clean adoption into an existing project (no prior template)

### Prerequisites

- Python ≥ 3.10, Node ≥ 22 (if your stack is Node)
- A working git repository with at least one commit
- 30–60 min uninterrupted

### Steps

1. **Add the template as a remote:**

   ```bash
   git remote add template https://github.com/jmpmachado/design-first-template.git
   git fetch template
   ```

2. **Merge with unrelated histories** — the template and your repo have no common ancestor:

   ```bash
   git merge template/master --allow-unrelated-histories --no-commit -X ours
   ```

   `-X ours` keeps your project files when both sides have the same path. Review the staged
   changes before committing — confirm no application code was overwritten.

3. **Run the wizard** to fill template placeholders with your project identity:

   ```bash
   python3 infra/scripts/wizard.py
   ```

4. **Verify:**

   ```bash
   python3 -m pytest tests/unit/ -q          # 121 tests must pass
   cd tooling && npm install && npm test      # Node projects only
   node scripts/check-drift.js               # 0 high-severity findings
   ```

5. **Commit the merge:**

   ```bash
   git add -A
   git commit -m "chore(template): adopt design-first-template governance layer"
   ```

6. **Record the decision** in `DECISION_LOG.md` — add an entry with rationale, alternatives
   considered, and the template version adopted (run `git log template/master -1 --format=%H`
   for the exact commit hash).

---

## § B — Proto-version migration (divergent git history)

Use this section when your project was bootstrapped from an earlier version of this template
and the two repos have **diverged** — different commits, possibly different branch names.

### Assess the divergence first

Before touching anything, answer these three questions:

| Question | How to check | Implication |
| :--- | :--- | :--- |
| Do the repos share a common ancestor? | `git merge-base <your-branch> <template-branch>` — exits 1 if none | No ancestor → `--allow-unrelated-histories` required |
| Which files conflict? | `git diff --name-status <template-remote>/<branch> HEAD` | Files in both sides need manual resolution |
| Which files exist only in the template? | Lines starting with `D` in the diff above | These need a conscious keep/drop decision |

### Decision framework per file category

| Category | Default decision | Rationale |
| :--- | :--- | :--- |
| `.agent/context/*.md` | **Take local** — unless template has a newer section | Your project's context is intentional |
| `.github/workflows/*.yml` | **Take template** — unless you have custom jobs | CI improvements should be inherited |
| `AGENTS.md` | **Merge manually** — both sides have legitimate entries | Guard test will catch orphans |
| `tests/unit/documentation.test.ts` | **Take template** — it only grows, never shrinks | Test coverage improves |
| `infra/scripts/*.py` | **Take template** — unless you have local modifications | Bug fixes and new features |
| `src/`, `packages/`, application code | **Always take local** | Template has stubs only |
| `.agent/memory.json` | **Take local** — it is a superset after any real work | Remote may have stale entries |
| `rfcs/*.yaml` | **Audit each file** — project-specific RFCs must not go upstream | Template neutrality rule |

### Step-by-step

1. **Add the template remote** (if not already present):

   ```bash
   git remote add template https://github.com/jmpmachado/design-first-template.git
   git fetch template
   ```

2. **Check for common ancestor:**

   ```bash
   git merge-base HEAD template/master
   # exit 1 = no common ancestor → proceed to step 3
   # exit 0 = common ancestor exists → use git merge directly, skip --allow-unrelated-histories
   ```

3. **Run the merge dry-run** to see the conflict surface:

   ```bash
   git merge template/master --allow-unrelated-histories --no-commit 2>&1 | grep CONFLICT
   ```

4. **Resolve conflicts by category** using the decision framework above.
   For files where you want to take the template version:

   ```bash
   git checkout template/master -- <path/to/file>
   ```

   For files where you want to keep your version (already staged by `-X ours`):

   ```bash
   git checkout HEAD -- <path/to/file>
   ```

5. **Validate `AGENTS.md` integrity** — the guard test will catch mismatches:

   ```bash
   cd tooling && npx vitest run ../tests/unit/documentation.test.ts
   ```

   If it fails: add any new `.agent/context/` files to `AGENTS.md` in the same commit.

6. **Remove project-specific artefacts** that should not live in the template:
   - RFCs with project/product names → `rfcs/` (move to your project notes)
   - Any `.md` in Portuguese or with product-specific names (template neutrality rule)

7. **Run full verification:**

   ```bash
   python3 -m pytest tests/unit/ -q
   cd tooling && npm test
   node scripts/check-drift.js
   npm audit --audit-level=high
   ```

8. **Commit and push** to a feature branch, open PR, let CI validate before merging to main.

9. **Record the decision** in `DECISION_LOG.md`:
   - Template version adopted (commit hash)
   - Which files were taken from template vs kept local
   - Any deviations from the default decision framework and why

---

## Known issues and mitigations

| Issue | Mitigation |
| :--- | :--- |
| `AGILE_CONFIG.md` has `[CONFIGURE]` placeholders after merge | Run `python3 infra/scripts/wizard.py` — it fills them |
| `check-drift` reports stale sprint | Fill `AGILE_CONFIG.md §5` manually or via `npm run init-agile` |
| `documentation.test.ts` fails with orphan context files | Add missing files to `AGENTS.md` in the same commit |
| `npm audit` has moderate vulnerabilities after merge | Run `npm audit fix` in root and `tooling/` |
| Merge commit is enormous (hundreds of files) | Normal for `--allow-unrelated-histories` — CI is the truth signal |

---

## See also

- `START_HERE.md` — adoption from zero
- `TEMPLATE_UPGRADE_PROTOCOL.md` — upgrading an already-adopted project
- `ADOPTION_GUIDE.md` — which files are required per profile
- `AGENT_HANDOFF.md` — context transfer protocol between agent sessions
- `DECISION_LOG.md` — where to record the migration decision
