## Context

The codebase has 11 instances where utility functions in `apps/mobile/` and `apps/extension/` re-implement logic that already exists in `packages/shared/src/utils/`. These were identified through a cross-reference audit of all shared exports against local function definitions in both apps.

No new code needs to be written. Every local function has a direct or near-direct equivalent already exported from `@salmon/shared`.

## Goals / Non-Goals

**Goals:**
- Eliminate all exact-name and functional-duplicate utility re-implementations
- Reduce code drift risk between local copies and shared versions
- Enforce the existing Code Organization Rules retroactively

**Non-Goals:**
- Creating new shared utilities (that's Change 2: `centralize-orphan-utils`)
- Modifying any shared utility signatures or behavior
- Touching types, hooks, or components beyond the import changes
- Adding tests

## Decisions

### Decision 1: Direct replacement strategy

Each local function maps to an existing shared export. The replacement mapping:

| Local function | File(s) | Shared replacement | Notes |
|---|---|---|---|
| `truncateHash()` | TransactionDetailModal.tsx, SwapRouteVisualization.tsx | `truncateHash(hash, chars)` from `@salmon/shared` | TransactionDetailModal uses chars=8, pass as parameter |
| `formatAmount()` | TransactionItem.tsx, TransactionDetailModal.tsx, SwapRouteVisualization.tsx | `formatRawAmount()` from `@salmon/shared` | Functionally identical, shared version is more robust |
| `formatTimestamp()` | TransactionItem.tsx (extension) | `formatRelativeTimeCompact()` from `@salmon/shared` | Same logic and thresholds |
| `formatRate()` | ConversionRateDisplay.tsx | `formatConversionRate()` from `@salmon/shared` | Character-for-character identical |
| `isPositivePerformance()` | PriceChart.tsx (extension) | `isPositive()` from `@salmon/shared` | Same boolean check |
| inline address slice | DAppConnectPage.tsx | `getShortAddress(address, 4)` from `@salmon/shared` | Replace inline template literal |
| `SECTION_TO_NETWORK` | collectibles.tsx (mobile) | `SECTION_TO_NETWORK` from `@salmon/shared` | Local is a subset, shared has all blockchains |
| `solanaNftToNftData()` | collectibles.tsx (mobile) | `canonicalNftToSolanaNftData()` from `@salmon/shared` | Shared returns superset type |
| `getSectionTitle()` | collectibles.tsx (mobile) | `getNftSectionTitle()` from `@salmon/shared` | Shared handles all blockchains |

**Rationale:** No wrappers or adapters needed — direct import replacement minimizes change surface and risk.

### Decision 2: Verify parameter compatibility before each replacement

Before replacing, confirm the shared function accepts the same parameters the local version uses. Two cases require attention:
- `truncateHash` in TransactionDetailModal uses `chars=8` — shared version accepts `chars` as second param, compatible.
- `formatAmount` local versions use a `minThreshold` — shared `formatRawAmount` accepts `minThreshold` param, compatible.

### Decision 3: Remove dead code completely

After replacing imports, delete the entire local function definition. Do not leave commented-out code or TODO markers.

## Risks / Trade-offs

- **[Behavioral drift]** → Low risk. The audit confirmed functional equivalence for all 11 replacements. The shared versions are equal or more robust.
- **[Import path changes]** → Each file gains a new `@salmon/shared` import. Existing imports from `@salmon/shared` in the same file should be extended, not duplicated.
- **[PriceChart `isPositivePerformance` vs `isPositive`]** → The local version checks `performance > 0`, shared `isPositive` checks `parseFloat(value) > 0`. If PriceChart passes a number directly (not string), may need `String(value)` wrapper. Verify at implementation time.
