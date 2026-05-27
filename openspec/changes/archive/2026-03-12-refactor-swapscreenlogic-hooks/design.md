## Context

`useSwapScreenLogic.ts` (836 lines) is a screen-level orchestration hook used by `SwapScreen` component across all platforms. It contains three self-contained sub-concerns that can be extracted as internal hooks within the same directory, reducing the main hook's complexity without affecting its API.

## Goals / Non-Goals

**Goals:**
- Extract countdown timer into `useCountdownTimer` hook
- Extract debounced quote fetching into `useQuoteManager` hook
- Extract token synchronization into `useTokenSync` hook
- Keep all hooks co-located in `packages/shared/src/hooks/` (or as local helpers in the same file)
- Maintain identical `UseSwapScreenLogicReturn` interface

**Non-Goals:**
- Exporting sub-hooks from @salmon/shared (they're internal to useSwapScreenLogic)
- Changing the swap/bridge business logic
- Modifying SwapScreen component or any consumer

## Decisions

### 1. Co-locate sub-hooks in the same file

**Decision**: Define sub-hooks as named functions above `useSwapScreenLogic` in the same file, rather than creating separate files.

**Rationale**: These hooks are only used by `useSwapScreenLogic`. Creating separate files would add import complexity without reuse benefit. Keeping them in the same file makes the extraction reversible and the dependency clear.

### 2. useCountdownTimer is the simplest extraction

**Decision**: Extract first. It takes `{ isActive: boolean }` and returns `{ countdown, startCountdown, clearCountdown }`. Zero coupling to business logic.

### 3. useQuoteManager receives callbacks via refs

**Decision**: The existing pattern uses `onGetQuoteRef` and `onGetBridgeEstimateRef` callback refs. The extracted hook accepts these refs directly, avoiding stale closure issues.

## Risks / Trade-offs

- **[Risk] Subtle timing differences** → Mitigation: The extraction is mechanical — same useEffect deps, same setTimeout/setInterval patterns, same cleanup.
- **[Risk] Increased function call overhead** → Negligible — React hooks are called synchronously in the same render cycle.
