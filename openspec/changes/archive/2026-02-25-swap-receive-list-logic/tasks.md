## 1. Add jupiterTokens prop

- [x] 1.1 Add `jupiterTokens?: SwapToken[]` to `SwapScreenProps` in `packages/shared/src/types/swap.ts`
- [x] 1.2 Accept `jupiterTokens` in `useSwapScreenLogic` options (destructure from props)

## 2. Update outputTokens logic

- [x] 2.1 In `useSwapScreenLogic.ts` `outputTokens` memo: when `inChain === 'solana'`, use `jupiterTokens` as the Solana catalog (deduped against user balance tokens by address), and filter bridge tokens to `t.chain !== 'solana'` only

## 3. Load Jupiter tokens in both platforms

- [x] 3.1 In `apps/mobile/app/(app)/(tabs)/swap.tsx`, load Jupiter tokens via `getTokenList` + `mapToSwapToken` in a `useEffect` and pass as `jupiterTokens` prop to SwapScreen
- [x] 3.2 In `apps/extension/src/pages/swap/SwapPage.tsx`, same change for feature parity

## 4. Verify

- [x] 4.1 Run `pnpm turbo run typecheck` and confirm zero errors
