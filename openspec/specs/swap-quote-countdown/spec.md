# swap-quote-countdown Specification

## Purpose

Define the 10-second quote-validity countdown the swap review step shows for both Jupiter and StealthEx flows. `useSwapScreenLogic` SHALL start the countdown when the review step is entered, pause during confirmation, clear on leaving review, expose `swapConfirmLabel` and a unified `handleConfirmOrRefresh` callback, guard the refresh path against duplicate fetches, and let review screens pass an optional `confirmLabel` through to `SwapReviewButtons`.

## Requirements

### Requirement: Countdown starts when review step is entered
The `useSwapScreenLogic` hook (packages/shared) SHALL start a 10-second countdown when `step` transitions to `'review'` and `isConfirming` is false. The countdown SHALL decrement by 1 each second and stop at 0.

#### Scenario: User enters Jupiter review
- **WHEN** user navigates to the review step with a Jupiter (same-chain) quote
- **THEN** the countdown starts at 10 and decrements each second to 0

#### Scenario: User enters StealthEx bridge review
- **WHEN** user navigates to the review step with a StealthEx (cross-chain) estimate
- **THEN** the countdown starts at 10 and decrements each second to 0

### Requirement: Countdown pauses during confirmation
The hook SHALL pause (clear the interval) the countdown when `isConfirming` becomes true. The countdown value SHALL remain at its current value while paused.

#### Scenario: User clicks confirm while countdown is active
- **WHEN** user clicks the confirm button and `isConfirming` becomes true
- **THEN** the countdown interval is cleared and the countdown value freezes

### Requirement: Countdown clears when leaving review
The hook SHALL clear the countdown interval and reset the countdown value when `step` leaves `'review'` (navigating back, to success, or to error).

#### Scenario: User navigates back from review
- **WHEN** user clicks the back button from the review step
- **THEN** the countdown interval is cleared and countdown resets

#### Scenario: Swap completes and moves to success
- **WHEN** the swap succeeds and step transitions to `'success'`
- **THEN** the countdown interval is cleared and countdown resets

### Requirement: Confirm button label reflects countdown state
The hook SHALL expose a `swapConfirmLabel` string computed as follows:
- When countdown > 0 and swapMode is `'jupiter'`: `"Confirm (N)"` where N is the remaining seconds
- When countdown > 0 and swapMode is `'stealthex'`: `"Confirm Swap (N)"`
- When countdown === 0: `"Refresh Quote"` regardless of swap mode

#### Scenario: Jupiter countdown active
- **WHEN** countdown is 7 and swapMode is `'jupiter'`
- **THEN** `swapConfirmLabel` equals `"Confirm (7)"`

#### Scenario: StealthEx countdown active
- **WHEN** countdown is 3 and swapMode is `'stealthex'`
- **THEN** `swapConfirmLabel` equals `"Confirm Swap (3)"`

#### Scenario: Countdown expired
- **WHEN** countdown reaches 0
- **THEN** `swapConfirmLabel` equals `"Refresh Quote"`

### Requirement: Unified confirm-or-refresh handler
The hook SHALL expose a `handleConfirmOrRefresh` callback that:
- When countdown > 0: delegates to `handleConfirmSwap` (Jupiter) or `handleConfirmBridge` (StealthEx) based on `swapMode`
- When countdown === 0: calls the refresh handler to re-fetch the quote/estimate

#### Scenario: Confirm during active countdown (Jupiter)
- **WHEN** user clicks the button while countdown > 0 and swapMode is `'jupiter'`
- **THEN** the handler delegates to `handleConfirmSwap`

#### Scenario: Confirm during active countdown (StealthEx)
- **WHEN** user clicks the button while countdown > 0 and swapMode is `'stealthex'`
- **THEN** the handler delegates to `handleConfirmBridge`

#### Scenario: Refresh after countdown expires
- **WHEN** user clicks the button while countdown === 0
- **THEN** the handler re-fetches the quote/estimate using current parameters and restarts the countdown at 10

### Requirement: Refresh is guarded against spam
The `handleRefreshQuote` function SHALL be a no-op when `isLoadingQuote` or `isLoadingEstimate` is true.

#### Scenario: User clicks refresh while fetch is in-flight
- **WHEN** user clicks "Refresh Quote" while a quote or estimate fetch is already loading
- **THEN** no new fetch is initiated

### Requirement: Review screens pass confirmLabel through
The `SwapReviewScreen` and `BridgeReviewScreen` components (both mobile and extension) SHALL accept an optional `confirmLabel` prop and pass it to `SwapReviewButtons`. When `confirmLabel` is not provided, the default labels SHALL be `"Confirm"` (Jupiter) and `"Confirm Swap"` (StealthEx).

#### Scenario: confirmLabel provided on SwapReviewScreen
- **WHEN** `SwapReviewScreen` receives `confirmLabel="Confirm (8)"`
- **THEN** `SwapReviewButtons` renders with label `"Confirm (8)"`

#### Scenario: confirmLabel not provided on BridgeReviewScreen
- **WHEN** `BridgeReviewScreen` does not receive a `confirmLabel` prop
- **THEN** `SwapReviewButtons` renders with the default label `"Confirm Swap"`

### Requirement: Type contracts updated in shared package
`SwapReviewScreenProps` in `packages/shared/src/types/swap.ts` SHALL include an optional `confirmLabel?: string` field. `BridgeReviewScreenPropsBase` in `packages/shared/src/types/ui/bridge-screen.ts` SHALL include an optional `confirmLabel?: string` field. `UseSwapScreenLogicReturn` in `packages/shared/src/hooks/useSwapScreenLogic.ts` SHALL include `swapConfirmLabel: string` and `handleConfirmOrRefresh: () => Promise<void>`.

#### Scenario: Hook return type includes new fields
- **WHEN** consuming `useSwapScreenLogic` return value
- **THEN** `swapConfirmLabel` (string) and `handleConfirmOrRefresh` (async function) are available on the returned object
