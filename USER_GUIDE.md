# User Guide — Engineering Template

> Language-agnostic engineering framework for AI-assisted projects.
> For bilingual (PT-BR) content, see the project wiki or ask your team lead.

---

## 1. What Is This Template?

A reusable governance, documentation, and agile scaffold for projects operated by AI agents (Claude Code, Codex, Copilot) under human supervision. `src/` is intentionally empty — the value is the framework itself.

**Who it is for:** Solo engineers or small teams (1–3 people) who want AI agents working semi-autonomously without losing control of quality, debt, and delivery cadence.

---

## 2. Prerequisites

| Tool | Minimum version | Check |
| :--- | :--- | :--- |
| Python | 3.10+ | `python3 --version` |
| Node.js | 24+ (optional — only for Node projects or `npm test`) | `node --version` |
| Git | 2.40+ | `git --version` |

---

## 3. Quick Start

```bash
# 1. Run the adoption wizard
python3 infra/scripts/wizard.py

# 2. Verify (Node projects)
npm test

# 3. Verify (Python tooling)
npm run test:python
```

---

## 4. Key Documents

| Document | Purpose |
| :--- | :--- |
| [START_HERE.md](START_HERE.md) | First 4 steps from clone to first sprint |
| [ONBOARDING.md](ONBOARDING.md) | Full environment setup and first-day checklist |
| [CONFIGURE.md](CONFIGURE.md) | Profile and CI lane selection |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branch, commit, PR, and review rules |
| [AGENTS.md](AGENTS.md) | AI agent knowledge-base index |
| [CLAUDE.md](CLAUDE.md) | Claude Code runtime contract |

---

## 5. Agile Methodology

- Sprint length: configured in `.agent/context/AGILE_CONFIG.md` (default 2 weeks)
- Backlog: `.agent/context/BACKLOG.md` — MoSCoW format, ≤ 150 lines
- Definition of Done: `.agent/context/DEFINITION_OF_DONE.md`
- Velocity tracking: `.agent/context/BACKLOG.md §4`

---

## 6. CI/CD and Quality Gates

| Gate | Trigger | Blocks merge? |
| :--- | :--- | :--- |
| `ci.yml` | Every push | Yes — lint + typecheck + test |
| `docs-integrity.yml` | Changes to `.agent/context/` or `AGENTS.md` | Yes |
| `security.yml` | Push to main/master/develop | Yes — npm audit high |
| `template-drift.yml` | Weekly + push to main | No — observation only |
| `risk-check.yml` | RFC push | Yes — score ≥ 60 |

---

## 7. Troubleshooting

| Symptom | Fix |
| :--- | :--- |
| `npm test` fails with `TypeError: Cannot read properties of undefined` | Run `npm ci --prefix tooling` then retry |
| `check-drift` reports `BACKLOG.md` > 150 lines | Archive Done sprint rows to `BACKLOG_HISTORY.md` |
| `check-drift` reports `AGILE_CONFIG.md` placeholders | Run `python3 infra/scripts/wizard.py` |
| `npm run test:python` — no tests found | Ensure `pytest` and `pyyaml` are installed: `pip install pytest pyyaml` |

---

> Full history and upgrade notes: [CHANGELOG.md](CHANGELOG.md) · Upgrade protocol: [.agent/context/TEMPLATE_UPGRADE_PROTOCOL.md](.agent/context/TEMPLATE_UPGRADE_PROTOCOL.md)
