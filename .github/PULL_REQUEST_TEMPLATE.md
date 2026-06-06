<!--
PR Template — fill in every section. AI agents must produce all sections
verbatim; placeholders not removed should be caught in code review (PR-lint automation is not yet wired — planned in Sprint 03).
Keep the PR small (target: < 200 LoC diff, single concern). See
.agent/context/CODE_REVIEW_GUIDE.md for size limits and review SLAs.
-->

## Summary

<!-- 1–3 sentences. WHAT changed and WHY. No mechanical restatement of the diff. -->

## Type of change

<!-- Check all that apply -->

- [ ] Bug fix (non-breaking change that fixes a defect)
- [ ] Feature (non-breaking change that adds capability)
- [ ] Breaking change (fix or feature that changes existing behavior in incompatible ways)
- [ ] Refactor (no functional change)
- [ ] Performance
- [ ] Documentation only
- [ ] Build / CI / tooling
- [ ] Dependency update

## Motivation & Context

<!-- Why is this change required? Link to the issue/ticket it resolves. -->

Closes #

## Implementation Notes

<!-- Anything reviewers should know to make sense of the diff:
     - Non-obvious design decisions
     - Trade-offs considered and rejected
     - Areas of uncertainty where you want focused review -->

## How Has This Been Tested?

<!-- Concrete steps. "I ran the tests" is not enough.
     - Which test suites were added/modified?
     - Manual test scenarios?
     - Environments exercised (local / staging)? -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if user-facing)
- [ ] Manually exercised in: <!-- environment -->

## Risk Assessment

| Dimension | Level | Notes |
|---|---|---|
| Blast radius | Low / Medium / High | <!-- which surfaces / users / services affected? --> |
| Reversibility | Easy / Hard / Irreversible | <!-- migration? feature-flagged? --> |
| Data impact | None / Read-only / Mutation / Schema | <!-- if schema/migration, link plan --> |
| Performance impact | None / Measured / Unknown | <!-- benchmarks or rationale --> |
| Security impact | None / Reviewed / Needs review | <!-- if Needs review: tag @org/security --> |

## Rollout & Rollback

- [ ] Feature-flagged (flag name: ` `)
- [ ] Behind environment toggle (env var: ` `)
- [ ] Standard release (no special handling)
- [ ] Requires migration / data backfill — plan linked above
- [ ] Requires coordinated deploy — coordination doc linked above

**Rollback plan**: <!-- 1–2 lines. Even "revert this PR" is acceptable if true. -->

## Pre-merge Checklist

<!-- Mirrors .agent/context/DEFINITION_OF_DONE.md. AI agents: do not check
     a box you have not actually verified. -->

- [ ] Code follows the conventions in `.agent/context/BEST_PRACTICES.md`
- [ ] Self-reviewed the diff line-by-line
- [ ] Tests pass locally (`<test command>`)
- [ ] Lint passes locally (`<lint command>`)
- [ ] Type-check passes locally (`<type-check command>`)
- [ ] No new dependencies introduced (or: new dep documented in `DEPENDENCY_POLICY.md` and approved per `SUPPLY_CHAIN.md` §9)
- [ ] No secrets/credentials in diff
- [ ] Documentation updated where behavior changed
- [ ] CHANGELOG entry added (user-facing changes only)
- [ ] PR size within guidelines (target < 200 LoC; see `CODE_REVIEW_GUIDE.md §8` for size classes and justification process)

## Screenshots / Recordings

<!-- For UI changes. Before/after pairs preferred. Delete this section if N/A. -->

## Related Work

<!-- Link related PRs, RFCs, issues, ADRs (DECISION_LOG.md entries). -->

---

<!--
For AI agents: do not add humor, emoji, or self-congratulatory closing lines.
Keep the PR description fact-based and reviewer-oriented.
-->
