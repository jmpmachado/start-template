# Adoption Guide

> Choose a profile, configure AGILE_CONFIG.md manually, review required files, then define Sprint 00.
> Full knowledge base index: `AGENTS.md`.

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

Legend: ✅ required · — optional for this profile

---

## Tooling Execution

To install dependencies and run tests:

```bash
cd tooling && npm install && npm test
```

For .NET backend tests:

```bash
dotnet test
```

---

## See Also

- `START_HERE.md` — 5-step path from clone to first sprint
- `AGENTS.md` — full context file index
