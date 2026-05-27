## Why

`useSwapScreenLogic` (836 lines) is a screen-level orchestration hook that works correctly but has three self-contained sub-concerns that would benefit from extraction into internal hooks: a countdown timer (lines 218-412), debounced quote management (lines 314-375), and token synchronization effects (lines 275-306, 643-694). Extracting these would improve readability without changing the hook's public API.

## What Changes

- Extract countdown timer logic into `useCountdownTimer()` internal hook within the same file or a co-located file
- Extract debounced quote fetching into `useQuoteManager()` internal hook
- Extract token synchronization effects into `useTokenSync()` internal hook
- `useSwapScreenLogic` becomes an orchestrator that composes these sub-hooks
- No changes to `UseSwapScreenLogicReturn` interface or any consumer code

## Capabilities

### New Capabilities

- `swap-internal-hooks`: Internal sub-hooks extracted from useSwapScreenLogic (countdown timer, quote manager, token sync) — not exported from @salmon/shared, only used internally by useSwapScreenLogic

### Modified Capabilities

_(none)_

## Impact

- **Affected code**: `packages/shared/src/hooks/useSwapScreenLogic.ts` only
- **No consumer changes**: The hook's return type and behavior remain identical
- **Risk**: Low — pure internal refactoring with no API changes
- **Apps affected**: None
