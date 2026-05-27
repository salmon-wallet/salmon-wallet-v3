## Why

When the bridge recipient screen appears, the address field is empty and the user must manually type or paste their Bitcoin address. Since the wallet already knows the user's BTC address, it should pre-fill it for better UX. The field must remain editable. Additionally, the existing `validateAddress` function from `utils/swap.ts` already validates per-chain addresses — this should gate the Review button.

## What Changes

- Add `defaultRecipientAddress?: string` prop to `SwapScreenProps` and accept it in `useSwapScreenLogic` to pre-populate `recipientAddress` state.
- In both platform swap pages (`swap.tsx`, `SwapPage.tsx`), resolve the user's BTC address from `activeAccount.networksAccounts['bitcoin-mainnet']` and pass it as `defaultRecipientAddress`.
- Validation already works: `validateAddress(recipientAddress, targetChain)` computes `addressValidation` which gates `handleContinueToReview`. No new validation code needed.

## Capabilities

### New Capabilities

- `bridge-recipient-autofill`: Pre-fill the bridge recipient address with the user's own address for the target chain.

### Modified Capabilities

_(none)_

## Impact

- **`packages/shared/src/types/swap.ts`** — Add `defaultRecipientAddress?: string` to `SwapScreenProps`
- **`packages/shared/src/hooks/useSwapScreenLogic.ts`** — Initialize `recipientAddress` from `defaultRecipientAddress` prop
- **`apps/mobile/app/(app)/(tabs)/swap.tsx`** — Resolve user's BTC address, pass as prop
- **`apps/extension/src/pages/swap/SwapPage.tsx`** — Same
