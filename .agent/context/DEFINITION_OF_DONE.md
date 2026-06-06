# Definition of Done — start-project

> The DoD is the team's shared contract for "complete." A task is not done until
> every applicable item below is checked. No exceptions without explicit team approval.
>
> **Scope:** applies to every PR that changes production code, tests, or documentation.
> Infrastructure-only PRs use the Infrastructure DoD (section 5).
> Update this file when the team agrees to raise or lower the bar — date each change.

---

## 1. Code

- [ ] Implementation matches the acceptance criteria in the ticket / user story.
- [ ] No dead code, commented-out blocks, or `TODO` left without a linked issue.
- [ ] No `console.log`, debug prints, or temporary instrumentation committed.
- [ ] All public functions and non-obvious logic have a one-line comment explaining _why_, not _what_.
- [ ] No new `any` types introduced without explicit justification in the PR description (TypeScript / typed languages).
- [ ] Linter passes with zero warnings: `[npm run lint / equivalent]`.
- [ ] Type checker passes: `[tsc --noEmit / equivalent]`.

---

## 2. Tests

- [ ] New logic has unit tests covering: happy path, at least one error path, and boundary conditions.
- [ ] Integration tests cover the changed API surface or service interaction.
- [ ] No test is skipped (`it.skip`, `xtest`, `@pytest.mark.skip`) without a linked issue and expiry date.
- [ ] Test suite passes locally: `[npm test / equivalent]`.
- [ ] Coverage does not drop below the project threshold: **[≥80% statements, ≥75% branches]**.
- [ ] No new flaky tests introduced. If a flaky test is discovered, it is quarantined before merging.

---

## 3. Security

- [ ] No secrets, credentials, or PII committed — checked via `git diff` before opening PR.
- [ ] All inputs from untrusted sources (user input, external APIs, URL params) are validated and sanitized.
- [ ] New endpoints have authentication and authorization checks.
- [ ] New dependencies reviewed against `DEPENDENCY_POLICY.md` and added to dependency register.
- [ ] `npm audit` (or equivalent) passes with no high/critical vulnerabilities: `[npm audit --audit-level=high]`.
- [ ] STRIDE threat model updated in `THREAT_MODEL.md` if the attack surface changed — verify via diff: if the PR adds or modifies files under `src/api/`, `src/routes/`, `src/auth/`, or any new external integration, `THREAT_MODEL.md` must appear in the diff. The `pr-lint.yml` workflow posts a warning comment if placeholder patterns are detected but does not enforce this check automatically.
- [ ] If PR adds or modifies a public endpoint, external integration, or background job: `PRODUCTION_READINESS_REVIEW.md` checklist completed and filed in `DECISION_LOG.md` before merge approval.

---

## 4. Documentation

- [ ] `AGENTS.md` updated if a new file was added to `.agent/context/`.
- [ ] `DECISION_LOG.md` updated if a non-trivial decision was made during implementation.
- [ ] If this PR closes a multi-agent work session: handoff document produced per `.agent/context/AGENT_HANDOFF.md` and shared with the next agent/session.
- [ ] If this PR modifies `CLAUDE.md`, `GEMINI.md`, `copilot-instructions.md`, or `AGENT_HANDOFF.md`: §1 checklist of `.agent/context/AGENT_CONTRACT_REVIEW.md` completed and results documented in the PR description.
- [ ] `API_CONTRACT.md` updated if an API surface was added, changed, or deprecated.
- [ ] `DATA_MODEL.md` updated if the schema changed (migration + doc in same PR).
- [ ] `CHANGELOG.md` entry added under `[Unreleased]` describing the user-visible change.
- [ ] `CLASS_MAP.md` updated if a new service, module, or significant class was introduced.
- [ ] PR description explains _why_ the change was made, not just _what_ changed.

---

## 5. Accessibility (UI changes only)

> **Scope:** Apply this section **only** to projects with browser or native desktop UI (React, Vue, Electron, mobile). Skip entirely for CLI tools, backend services, data pipelines, and libraries.
>
> Apply this section to any PR that adds or modifies a user-facing UI component, page, or flow.

- [ ] Automated accessibility scan passes with zero critical or serious violations: `npx axe-core <url>` or `@axe-core/playwright` in the E2E suite.
- [ ] All interactive elements (buttons, links, form inputs) are keyboard-navigable (Tab order correct; Enter/Space activate controls).
- [ ] All images have descriptive `alt` text; decorative images have `alt=""`.
- [ ] Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text (WCAG 2.1 AA, Success Criterion 1.4.3).
- [ ] No information conveyed by color alone — a secondary indicator (icon, text, pattern) accompanies any color-coded state.
- [ ] Form fields have associated `<label>` elements or `aria-label`; error messages are associated via `aria-describedby`.
- [ ] Screen reader smoke test: navigate the changed flow with VoiceOver (macOS) or NVDA (Windows) and confirm all interactive states are announced.

> Failing axe-core scan or keyboard navigation failure blocks merge. Screen reader test is required but may be performed asynchronously within 24 hours of merge for low-risk changes.

---

## 7. Review

- [ ] At least **[1 / 2]** approvals from team members who did not author the PR.
- [ ] All review comments resolved or explicitly deferred with a linked follow-up issue.
- [ ] PR is rebased or merged cleanly onto the target branch — no unresolved conflicts.
- [ ] CI pipeline passes: lint, typecheck, tests, security scan.

---

## 8. Infrastructure DoD

> Applies to PRs that change `infra/`, `.github/workflows/`, `docker-compose.yml`, or deployment config.

- [ ] Change tested in a non-production environment before merging.
- [ ] Rollback procedure documented or verified (can revert the commit and re-deploy safely).
- [ ] `RUNBOOK.md` updated if operational procedures changed.
- [ ] No hardcoded secrets — all sensitive values sourced from environment or secrets manager.
- [ ] Resource limits (CPU, memory, timeout) explicitly set — no unbounded resources.

---

## 7. Release DoD

> Additional gates before tagging a release or promoting to production.

- [ ] All items above satisfied.
- [ ] `CHANGELOG.md` `[Unreleased]` section promoted to the release version with date.
- [ ] Version bumped in `package.json` (or equivalent) following semantic versioning.
- [ ] Release branch or tag created per `CONTRIBUTING.md`.
- [ ] Stakeholders notified per the rollout plan in the relevant RFC (if applicable).
- [ ] Monitoring dashboards checked for anomalies 15 minutes after deploy.

---

## Sprint Gate

> Mandatory checks before closing a sprint. Run in this order: falsify → fix → lint.

1. **falsify** (explicit human request) — run `/full-falsify` or `/code-falsify` on all delivered modules. Enumerate 🔴/🟡/🟢 findings.
2. **fix** — resolve all 🔴 findings. Prioritised 🟡 findings must be fixed or registered as a new US before the sprint is marked Done.
3. **lint** — run `npm run lint:all` (ESLint + typecheck + markdownlint). Zero errors allowed. 🟡/🟢 lint findings may be deferred with explicit notation in BACKLOG.md.

**When sprint is Done:**

- [ ] All 🔴 falsify findings resolved.
- [ ] `npm run lint:all` exits 0.
- [ ] All new `.agent/context/` files registered in `AGENTS.md`.
- [ ] `DECISION_LOG.md` updated for any non-trivial architectural decision.
- [ ] Sprint row added to velocity table in `BACKLOG.md`.

_Note: `code-falsify` requires explicit human request; `code-lint` is the default sprint-close gate._

---

## Revision History

| Date         | Change              | Author   |
| :----------- | :------------------ | :------- |
| [YYYY-MM-DD] | Initial DoD adopted | [author] |
