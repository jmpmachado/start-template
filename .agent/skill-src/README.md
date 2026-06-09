# Skill Sources — cross-harness fragments

Each `<name>.md` here is a single source of agent guidance rendered into every
harness file that opts in. A target opts in by containing the marker pair:

```
<!-- SKILLGEN:START <name> -->
<!-- SKILLGEN:END <name> -->
```

Run the generator from the repo root:

```bash
python infra/scripts/skillgen.py --list     # show sources
python infra/scripts/skillgen.py --check     # CI: fail if any target is stale
python infra/scripts/skillgen.py --write     # apply: fill the marked blocks
```

Targets: `CLAUDE.md`, `GEMINI.md`, `AGENTS.md`, `.codex/instructions.md`,
`.github/copilot-instructions.md`. Editing one shared instruction in five files by
hand is a known drift source — keep the shared part here and let `skillgen` fan it out.

> This file keeps the directory under version control until the first real source
> is added. Delete it once `<name>.md` fragments exist.
