## 1. Fix react-hooks/refs errors in useRefreshOnFocus variants

- [ ] 1.1 In `packages/shared/src/hooks/useRefreshOnFocus.ts`, replace bare `onFocusRef.current = onFocus` (line 40) and `lastUpdatedRef.current = lastUpdated` (line 43) with `useEffect` wrappers
- [ ] 1.2 In `packages/shared/src/hooks/useRefreshOnFocus.native.ts`, same fix: wrap `onFocusRef.current = onFocus` (line 19) and `lastUpdatedRef.current = lastUpdated` (line 22) in `useEffect`
- [ ] 1.3 In `packages/shared/src/hooks/useRefreshOnFocus.web.ts`, same fix: wrap `onFocusRef.current = onFocus` (line 17) and `lastUpdatedRef.current = lastUpdated` (line 20) in `useEffect`

## 2. Fix warnings in useSwapScreenLogic

- [ ] 2.1 In `packages/shared/src/hooks/useSwapScreenLogic.ts` line 144, prefix `onBridgeInitiated` with `_` → `_onBridgeInitiated`
- [ ] 2.2 In `packages/shared/src/hooks/useSwapScreenLogic.ts` line 543, remove `swapMode` from the `useMemo` dependency array → `[countdown]`

## 3. Fix warning in useSendContacts

- [ ] 3.1 In `packages/shared/src/hooks/useSendContacts.ts` line 33, remove `activeBlockchainAccount` from the destructuring of `accountState`

## 4. Verify

- [ ] 4.1 Run `pnpm turbo run typecheck` and confirm zero errors
- [ ] 4.2 Run `pnpm turbo run lint` on `@salmon/shared` and confirm zero errors, zero warnings in the fixed files
