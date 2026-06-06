# Start Here

4 steps from clone to first sprint. Estimated time: 30 min (Solo) · 1 h (Team) · 1.5 h (Data Product).

## Step 1 — Prerequisites (2 min)

- Python ≥ 3.10 (wizard + risk engine)
- Node ≥ 22 (optional — only needed if `TOOLING_NODE=true`; see `CONFIGURE.md`)
- Run: `python3 infra/scripts/install_check.py`

## Step 2 — Run the wizard (10–15 min)

```bash
python3 infra/scripts/wizard.py
```

Fills all `[PLACEHOLDER]` values, applies your profile, removes template-process files, and runs `pytest tests/unit/` as CI gate.

## Step 3 — Verify (1 min)

```bash
python3 -m pytest tests/unit/ -q   # 126 tests must pass
```

Node projects only (optional):

```bash
cd tooling && npm install && npm test
```

## Step 4 — Review required files (10–25 min)

Open `ADOPTION_GUIDE.md` — it lists which files are required for your profile.
Minimum mandatory reads: `AGENTS.md`, `CLAUDE.md` (or your agent's contract), `.agent/context/TEST_STRATEGY.md`.

## Step 5 — Write Sprint 00 user stories (5–15 min)

Follow `AGILE_GUIDE.md §I`. First sprint should have ≤ 3 USs (lean) or ≤ 5 USs (standard).
Record the sprint in `BACKLOG.md`.

---

**Primary reference:** [ONBOARDING.md](ONBOARDING.md) — full environment setup, first-day checklist, and troubleshooting.

**Secondary references** (read after wizard completes):

| File | Purpose |
| :--- | :--- |
| [CONFIGURE.md](CONFIGURE.md) | Profile selection and CI lane activation |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch naming, commit style, PR checklist |
| [CLAUDE.md](CLAUDE.md) | Claude Code agent runtime contract |
| [AGENTS.md](AGENTS.md) | Vendor-neutral knowledge-base index |
| [ADOPTION_GUIDE.md](ADOPTION_GUIDE.md) | Which files to keep, adapt, or delete per profile |
