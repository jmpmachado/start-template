# Adoption Guide

> Choose a profile, run the wizard, review required files, start Sprint 00.
> Full knowledge base index: `AGENTS.md`. Wizard: `python3 infra/scripts/wizard.py`.

---

## Profiles

| Profile | Who | Est. time to first sprint |
| :--- | :--- | :---: |
| **`founder`** | 1–3 people + AI agents, no public users — framework maturation phase | 30 min |
| **`team`** | 2–8 people + AI agents, real users onboarded | 1 h |
| **`public`** | Any size, external contributors or public API — full profile, no omissions | 1.5 h |

Upgrade path: `founder → team → public`. Adopt the next profile before onboarding external users or opening the API.

---

## Required vs. Optional per Profile

| File | `founder` | `team` | `public` | Notes |
| :--- | :---: | :---: | :---: | :--- |
| `AGENTS.md` | ✅ | ✅ | ✅ | Master index — never omit |
| `CLAUDE.md` / agent contracts | ✅ | ✅ | ✅ | |
| `ARCHITECTURE.md` | ✅ | ✅ | ✅ | |
| `CLASS_MAP.md` | ✅ | ✅ | ✅ | |
| `STATE_MACHINE.md` | ✅ | ✅ | ✅ | |
| `DATA_MODEL.md` | ✅ | ✅ | ✅ | |
| `BEST_PRACTICES.md` + `PATTERNS.md` | ✅ | ✅ | ✅ | |
| `TEST_STRATEGY.md` | ✅ | ✅ | ✅ | |
| `SECURITY.md` + `THREAT_MODEL.md` | ✅ | ✅ | ✅ | |
| `DECISION_LOG.md` | ✅ | ✅ | ✅ | |
| `CI_CD.md` + `RUNBOOK.md` | ✅ | ✅ | ✅ | |
| `DEPENDENCY_POLICY.md` | ✅ | ✅ | ✅ | |
| `BACKLOG.md` | ✅ | ✅ | ✅ | |
| `API_CONTRACT.md` | — | ✅ | ✅ | Required once real users exist |
| `DATA_PRIVACY.md` | — | ✅ | ✅ | Required once user data is processed |
| `INCIDENT_RUNBOOK.md` | — | ✅ | ✅ | |
| `DISASTER_RECOVERY.md` | — | ✅ | ✅ | |
| `OBSERVABILITY.md` | — | ✅ | ✅ | |
| `SUPPLY_CHAIN.md` | — | — | ✅ | Required for public/OSS |
| `GOVERNANCE.md` | — | — | ✅ | |
| `COMPLIANCE_TESTING.md` | — | — | ✅ | |
| `AUDIT_REPORT.md` | — | — | ✅ | |
| `ARCHITECTURE_MAP.md` | — | — | ✅ | |
| `E2E_TESTING.md` | — | ✅ | ✅ | |
| `LOAD_TESTING_FRAMEWORK.md` | — | — | ✅ | |

Legend: ✅ required · — omit for this profile (wizard removes it automatically)

---

## Node.js tooling (optional)

Node is only needed if your project uses it as a runtime or you want the JS test suite:

```bash
cd tooling && npm install && npm test
```

Set `TOOLING_NODE=false` in `CONFIGURE.md` to skip Node checks entirely.

---

## See Also

- `START_HERE.md` — 4-step path from clone to first sprint
- `AGENTS.md` — full context file index
- `infra/scripts/profiles.yaml` — machine-readable profile definitions consumed by the wizard
