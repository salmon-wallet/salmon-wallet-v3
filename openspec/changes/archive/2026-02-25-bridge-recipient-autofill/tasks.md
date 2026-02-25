## 1. Add prop and hook support

- [x] 1.1 In `packages/shared/src/types/swap.ts`, add `defaultRecipientAddress?: string` to `SwapScreenProps`
- [x] 1.2 In `packages/shared/src/hooks/useSwapScreenLogic.ts`, destructure `defaultRecipientAddress` from props and initialize `recipientAddress` state with it

## 2. Pass user's BTC address from swap pages

- [x] 2.1 In `apps/mobile/app/(app)/(tabs)/swap.tsx`, resolve the user's BTC address from `activeAccount.networksAccounts['bitcoin-mainnet']` and pass as `defaultRecipientAddress`
- [x] 2.2 In `apps/extension/src/pages/swap/SwapPage.tsx`, same change

## 3. Verify

- [x] 3.1 Run typecheck and confirm zero errors
