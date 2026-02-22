## Why

10 utility functions are duplicated across `apps/mobile/` and `apps/extension/`, totaling 20+ occurrences with no shared equivalent in `packages/shared/src/utils/`. Additionally, 1 function (`getBlockchainFromNetwork`) re-implements logic that already exists in shared (`getBlockchainFromNetworkId`). This violates the Code Organization Rules, inflates bundle size, and creates drift risk when one copy is updated but the others are not.

## What Changes

- Create 10 new shared utility functions in `packages/shared/src/utils/` and export them via barrel files
- Delete all 20+ local duplicates across both apps and replace with imports from `@salmon/shared`
- Fix 1 import violation where `getBlockchainFromNetwork` should use existing `getBlockchainFromNetworkId`
- No new behavior is introduced — all functions already exist in the codebase, just scattered

## Capabilities

### New Capabilities

_None — this change creates shared utilities from existing local implementations. No new behavior._

### Modified Capabilities

_None — no spec-level behavior changes. Functions being centralized are functionally identical to their local counterparts._

## Impact

- `packages/shared/src/utils/account.ts`: add `getAccountAddress`, `getNetworkLabel`
- `packages/shared/src/utils/transactions.ts`: add `getTransactionDescription`
- `packages/shared/src/utils/swap.ts`: add `mapToSwapToken`, `unifiedToSwapToken`
- `packages/shared/src/utils/formatting.ts`: add `getSeverity`, `isPositivePerformance`
- `packages/shared/src/utils/url.ts`: add `formatOrigin`
- `packages/shared/src/utils/tokens.ts`: add `getFeatureColor`
- `packages/shared/src/theme/`: add `getScalesColorForBlockchain`
- `packages/shared/src/utils/index.ts`: add barrel exports for all new functions
- `apps/extension/src/`: 10 files modified (delete local functions, add imports)
- `apps/mobile/`: 8 files modified (delete local functions, add imports)
