## 1. Shared Types

- [x] 1.1 Add `confirmLabel?: string` to `SwapReviewScreenProps` in `packages/shared/src/types/swap.ts`
- [x] 1.2 Add `confirmLabel?: string` to `BridgeReviewScreenPropsBase` in `packages/shared/src/types/ui/bridge-screen.ts`

## 2. Shared Hook — Core Timer Logic

- [x] 2.1 Add `QUOTE_COUNTDOWN_SECONDS = 10` constant, `countdown` state, and `countdownIntervalRef` ref to `useSwapScreenLogic` in `packages/shared/src/hooks/useSwapScreenLogic.ts`
- [x] 2.2 Add `clearCountdownInterval()` and `startCountdown()` helpers in the hook
- [x] 2.3 Add effect to start/stop countdown based on `step === 'review'` and `!isConfirming` (start on enter, pause on confirming, clear on leave)
- [x] 2.4 Add `handleRefreshQuote` callback that re-fetches quote (Jupiter) or estimate (StealthEx) using current params and restarts the countdown, guarded by `isLoadingQuote || isLoadingEstimate`
- [x] 2.5 Add `swapConfirmLabel` useMemo: `"Confirm (N)"` / `"Confirm Swap (N)"` when countdown > 0, `"Refresh Quote"` when 0
- [x] 2.6 Add `handleConfirmOrRefresh` callback: delegates to confirm handler when countdown > 0, to refresh handler when 0
- [x] 2.7 Update `UseSwapScreenLogicReturn` interface with `swapConfirmLabel: string` and `handleConfirmOrRefresh: () => Promise<void>`, and add both to the return object

## 3. Mobile Wiring

- [x] 3.1 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`: change Jupiter review `onConfirm` to `logic.handleConfirmOrRefresh` and add `confirmLabel={logic.swapConfirmLabel}`
- [x] 3.2 In `apps/mobile/src/components/SwapScreen/SwapScreen.tsx`: change StealthEx review `onConfirm` to `logic.handleConfirmOrRefresh` and add `confirmLabel={logic.swapConfirmLabel}`
- [x] 3.3 In `apps/mobile/src/components/SwapScreen/SwapReviewScreen.tsx`: destructure `confirmLabel` from props, pass `confirmLabel={confirmLabel ?? 'Confirm'}` to `SwapReviewButtons`
- [x] 3.4 In `apps/mobile/src/components/BridgeScreen/BridgeReviewScreen.tsx`: destructure `confirmLabel` from props, pass `confirmLabel={confirmLabel ?? 'Confirm Swap'}` to `SwapReviewButtons`

## 4. Extension Wiring

- [x] 4.1 In `apps/extension/src/components/SwapScreen/SwapScreen.tsx`: change Jupiter review `onConfirm` to `logic.handleConfirmOrRefresh` and add `confirmLabel={logic.swapConfirmLabel}`
- [x] 4.2 In `apps/extension/src/components/SwapScreen/SwapScreen.tsx`: change StealthEx review `onConfirm` to `logic.handleConfirmOrRefresh` and add `confirmLabel={logic.swapConfirmLabel}`
- [x] 4.3 In `apps/extension/src/components/SwapScreen/SwapReviewScreen.tsx`: destructure `confirmLabel` from props, pass `confirmLabel={confirmLabel ?? 'Confirm'}` to `SwapReviewButtons`
- [x] 4.4 In `apps/extension/src/components/BridgeScreen/BridgeReviewScreen.tsx`: destructure `confirmLabel` from props, pass `confirmLabel={confirmLabel ?? 'Confirm Swap'}` to `SwapReviewButtons`

## 5. Verification

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and confirm no type errors
