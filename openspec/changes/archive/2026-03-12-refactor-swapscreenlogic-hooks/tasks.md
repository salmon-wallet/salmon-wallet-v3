## 1. Extract useCountdownTimer

- [ ] 1.1 Create `useCountdownTimer({ isActive }: { isActive: boolean })` function above `useSwapScreenLogic` in the same file. Move countdown state (line 219), countdownIntervalRef (line 220), clearCountdownInterval (lines 379-384), startCountdown (lines 386-399), and the controlling useEffect (lines 402-412). Return `{ countdown, startCountdown, clearCountdown }`.
- [ ] 1.2 Replace original countdown code in `useSwapScreenLogic` with a call to `useCountdownTimer({ isActive: step === 'review' && !isConfirming })`.

## 2. Extract useQuoteManager

- [ ] 2.1 Create `useQuoteManager` function above `useSwapScreenLogic` in the same file. Accept params: `{ inToken, outToken, inAmount, swapMode, onGetQuoteRef, onGetBridgeEstimateRef, quoteTimerRef }`. Move the debounced quote fetching effect (lines 314-375) and quote state (`outAmount`, `isLoadingQuote`, `isLoadingBridgeEstimate`, `quote`, `bridgeEstimate`). Return state + setters needed by the parent.
- [ ] 2.2 Replace original quote management code in `useSwapScreenLogic` with a call to `useQuoteManager(...)`.

## 3. Extract useTokenSync

- [ ] 3.1 Create `useTokenSync` function above `useSwapScreenLogic` in the same file. Accept params for tokens, inToken, outToken, initialInToken, outputTokens. Move the three token sync useEffect blocks (lines 275-306, 643-694). Return `{ inToken, outToken, setInToken, setOutToken, availableOutTokens, isLoadingOutTokens }`.
- [ ] 3.2 Replace original token sync effects in `useSwapScreenLogic` with a call to `useTokenSync(...)`.

## 4. Verify equivalence

- [ ] 4.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/shared`
- [ ] 4.2 Verify `UseSwapScreenLogicReturn` interface is unchanged.
