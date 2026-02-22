## Why

In v2, the swap review screen has a 10-second countdown on the confirm button that protects users from confirming with a stale quote. This feature is missing in v3 — the user can sit on the review screen indefinitely and confirm with an outdated quote, risking unexpected slippage or failed transactions.

## What Changes

- Add a 10-second countdown timer to the swap confirm button on the review screen
- When the timer reaches 0, the button label changes to "Refresh Quote" and clicking it re-fetches the current quote/estimate, then restarts the countdown
- Clicking confirm while the countdown is active executes the swap/bridge as normal
- Timer pauses while a swap is being confirmed (`isConfirming`) and clears when leaving the review step
- Works for both Jupiter (same-chain) and StealthEx (cross-chain bridge) flows

## Capabilities

### New Capabilities
- `swap-quote-countdown`: 10-second countdown timer on swap/bridge review screens that prevents confirming stale quotes, with automatic refresh-and-restart behavior

### Modified Capabilities
<!-- No existing specs are affected at the requirement level -->

## Impact

- **packages/shared**: `useSwapScreenLogic` hook gains countdown state, interval management, refresh handler, computed label, and unified confirm-or-refresh handler. `SwapReviewScreenProps` and `BridgeReviewScreenPropsBase` types gain optional `confirmLabel` prop.
- **apps/mobile**: `SwapScreen`, `SwapReviewScreen`, and `BridgeReviewScreen` wire the new props through
- **apps/extension**: Same changes mirrored for feature parity
- **No new dependencies** — uses standard `setInterval`/`clearInterval` via React refs
