---
name: salmon-monorepo-safe-change
description: Safely modify or clean salmon-wallet-v3 without breaking active shared contracts. Use this skill for shared hook changes, API-service changes, frontend cleanup, platform-boundary audits, or consumer-sensitive refactors that require verification across apps and backend contracts.
---

Operational workflow for safe changes in Salmon Wallet V3.

## Mandatory stance

- Preserve stable shared exports unless the task explicitly allows breakage.
- Check actual consumers before removing shared code.
- If backend-facing behavior changes, inspect sibling repo `../salmon-api`.
- Prefer focused shared logic tests before broader UI coverage.

## Workflow

1. Build context
   - inspect shared exports, app consumers, and package ownership
2. Establish baseline
   - run the smallest relevant tests before refactoring when practical
3. Change conservatively
   - prefer internal cleanup over contract changes
4. Verify after change
   - rerun targeted tests in the touched package or app
   - if backend contract is involved, cross-check the related API service usage
5. Report residual risk
   - say what was verified and what was intentionally preserved

## Special rules

- shared hooks, blockchain logic, and API services are high-sensitivity areas
- mobile-only UI should not leak into shared DOM layers
- DOM-only UI should not leak into mobile

## What this skill should produce

- a conservative implementation plan
- explicit verification steps
- a final summary of changed contracts, tests run, and residual risk
