## Why

Multiple utility functions in `apps/mobile/src/` and `apps/extension/src/` re-implement logic that already exists in `packages/shared/src/utils/`. This violates the Code Organization Rules, inflates bundle size, and creates drift risk when the shared version is updated but local copies are not.

## What Changes

- Delete 11 local re-implementations of shared utility functions across both apps
- Replace with imports from `@salmon/shared`
- No new code is created — this is pure cleanup of existing duplicates

## Capabilities

### New Capabilities

_None — this change removes code, it does not introduce new behavior._

### Modified Capabilities

_None — no spec-level behavior changes. The functions being replaced are functionally identical to their shared counterparts._

## Impact

- `apps/extension/src/components/TransactionDetailModal/TransactionDetailModal.tsx`: remove local `truncateHash`, `formatAmount`
- `apps/extension/src/components/TransactionHistoryPage/SwapRouteVisualization.tsx`: remove local `truncateHash`, `formatAmount`
- `apps/extension/src/components/TransactionHistoryPage/TransactionItem.tsx`: remove local `formatAmount`, `formatTimestamp`
- `apps/extension/src/components/TransactionHistoryPage/ConversionRateDisplay.tsx`: remove local `formatRate`
- `apps/extension/src/components/PriceChart/PriceChart.tsx`: remove local `isPositivePerformance`
- `apps/extension/src/pages/dapp/DAppConnectPage.tsx`: remove inline address slice, use `getShortAddress`
- `apps/mobile/app/(app)/(tabs)/collectibles.tsx`: remove local `SECTION_TO_NETWORK`, `solanaNftToNftData`, `getSectionTitle`
