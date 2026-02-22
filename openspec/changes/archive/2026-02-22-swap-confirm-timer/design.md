## Context

The swap flow in v3 uses a shared hook (`useSwapScreenLogic` in `packages/shared/src/hooks/useSwapScreenLogic.ts`) that manages all state for both Jupiter (same-chain Solana swaps) and StealthEx (cross-chain bridges). The hook already returns `isConfirming`, `handleConfirmSwap`, `handleConfirmBridge`, and the review screens already accept a dynamic `confirmLabel` prop on `SwapReviewButtons`.

The review screens (`SwapReviewScreen`, `BridgeReviewScreen`) exist in both `apps/mobile` and `apps/extension` with mirrored structure. Both pass a hardcoded `confirmLabel` string to `SwapReviewButtons`, which already renders whatever label it receives — so no button component changes are needed.

The hook already holds refs for `onGetQuote` and `onGetBridgeEstimate` callbacks, making it straightforward to re-invoke them for quote refresh.

## Goals / Non-Goals

**Goals:**
- Prevent users from confirming with a stale quote by adding a 10-second countdown
- Provide a one-click "Refresh Quote" action when the timer expires
- Keep all timer logic in the shared hook so both platforms get it for free
- Minimize changes — reuse existing `confirmLabel` prop plumbing on `SwapReviewButtons`

**Non-Goals:**
- Auto-refresh (silently re-fetching in the background) — user should explicitly trigger refresh
- Configurable countdown duration — hardcode 10s, can be parameterized later if needed
- Visual countdown ring/progress bar — text label "(N)" is sufficient for v1
- Changes to `SwapReviewButtons` component itself — it already renders dynamic labels

## Decisions

### 1. All timer logic in `useSwapScreenLogic` (not in review screen components)

**Choice:** Countdown state, interval management, refresh handler, and label computation all live in the shared hook.

**Why:** The hook already owns the `step`, `isConfirming`, quote, and estimate state. Putting the timer here means zero duplication across mobile/extension and across Jupiter/StealthEx paths. The review screens just receive a `confirmLabel` string and an `onConfirm` callback — they don't need to know about timers.

**Alternative considered:** Timer in each review screen component. Rejected because it would require 4 implementations (2 platforms x 2 flows) and would need the screens to know how to re-fetch quotes.

### 2. `setInterval` with ref cleanup (not `setTimeout` chain)

**Choice:** Use a `setInterval` that decrements every 1s, stored in a ref, with cleanup on unmount/step change.

**Why:** Simpler than chaining `setTimeout` calls. The ref pattern is already established in the hook (`quoteTimerRef`). The interval self-stops when countdown reaches 0.

### 3. Unified `handleConfirmOrRefresh` handler

**Choice:** A single handler that delegates: if countdown > 0, call the appropriate confirm handler; if countdown === 0, call the refresh handler.

**Why:** The `SwapScreen` components currently pass `onConfirm={logic.handleConfirmSwap}` or `onConfirm={logic.handleConfirmBridge}` depending on the swap mode. With a unified handler, both paths just pass `onConfirm={logic.handleConfirmOrRefresh}` — the handler inspects `swapMode` internally.

### 4. Computed `swapConfirmLabel` string from hook

**Choice:** The hook exposes a `swapConfirmLabel` string (e.g. `"Confirm (7)"`, `"Confirm Swap (3)"`, `"Refresh Quote"`) that review screens pass through to `SwapReviewButtons`.

**Why:** The label depends on countdown state, swap mode (Jupiter uses "Confirm", StealthEx uses "Confirm Swap"), and whether the timer has expired. All this state lives in the hook, so computing the label there avoids leaking timer details to components.

### 5. Type changes: optional `confirmLabel` on shared prop interfaces

**Choice:** Add `confirmLabel?: string` to `SwapReviewScreenProps` (in `packages/shared/src/types/swap.ts`) and `BridgeReviewScreenPropsBase` (in `packages/shared/src/types/ui/bridge-screen.ts`).

**Why:** The review screen components need to receive the label from their parent. Making it optional preserves backward compatibility — existing hardcoded defaults ("Confirm", "Confirm Swap") still work as fallbacks.

### 6. Re-fetch reuses existing callback refs

**Choice:** `handleRefreshQuote` calls `onGetQuoteRef.current(...)` for Jupiter or `onGetBridgeEstimateRef.current(...)` for StealthEx using the current `inToken`, `outToken`, and `inAmount` values.

**Why:** These stabilized refs already exist in the hook for the initial quote fetch. Reusing them avoids any new dependencies or callback plumbing. The refresh is a direct re-invocation with current params.

## Risks / Trade-offs

- **Race condition on rapid refresh clicks** → Mitigated by guarding `handleRefreshQuote` with `isLoadingQuote || isLoadingEstimate` check. Button is effectively disabled while a fetch is in-flight.
- **Timer drift over long periods** → Negligible for a 10-second window. `setInterval` drift is <100ms over 10 ticks, which is imperceptible in a countdown label.
- **Stale closure in interval callback** → The interval reads `countdown` via the setter's functional form (`prev => prev - 1`) and checks the value inside the callback, so it always has the current value. The `swapMode` for label computation is read from a memo, not inside the interval.
- **No i18n on countdown labels** → The labels "Confirm", "Confirm Swap", "Refresh Quote" are currently hardcoded in the codebase already. This change follows the existing pattern. i18n for swap labels is a separate concern.
