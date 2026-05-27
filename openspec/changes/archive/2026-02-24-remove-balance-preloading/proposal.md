## Why

The BalanceCard carousel preloads balance data for adjacent blockchains (prev/next) on mount, but the preloaded data is never reused. Each `useBalance` hook instance has its own isolated `cacheRef`, so when the user swipes to a preloaded blockchain, the active hook fetches again from scratch. This wastes API calls (2x per blockchain visit) and provides zero UX benefit.

## What Changes

- **Remove adjacent balance preloading**: Eliminate the two extra `useBalance` calls for prev/next networks in both extension `HomePage` and mobile `HomeScreen`
- **Remove `useAdjacentBalances` hook**: Delete the hook entirely since it only existed to support preloading
- **Simplify `blockchainBalances` memo**: Only populate balance data for the active network; adjacent networks show `undefined` (already handled gracefully by BalanceCardCarousel)
- Clean up related imports and barrel exports

## Capabilities

### New Capabilities

_None — this is a removal/simplification change._

### Modified Capabilities

- `blockchain-switch-skeleton`: The balance loading behavior changes — instead of preloaded data being available (but wasted), adjacent cards will show loading state when swiped to. The skeleton/loading UX on switch remains unchanged.

## Impact

- **`packages/shared/src/hooks/useAdjacentBalances.ts`**: Delete entirely
- **`packages/shared/src/hooks/index.ts`**: Remove `useAdjacentBalances` export
- **`apps/extension/src/pages/home/HomePage.tsx`**: Remove 2 `useBalance` calls, `useAdjacentBalances` usage, and simplify `blockchainBalances` memo
- **`apps/mobile/app/(app)/(tabs)/index.tsx`**: Same changes as extension
- **API calls reduced**: From 2-3 calls on mount/swipe to exactly 1 call per blockchain view
- **No breaking changes**: BalanceCardCarousel already handles `undefined` balance data for non-active networks
