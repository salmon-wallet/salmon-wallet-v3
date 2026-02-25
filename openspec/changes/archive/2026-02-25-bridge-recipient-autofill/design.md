## Context

The bridge recipient screen starts with an empty address field. The user's BTC address is available via `activeAccount.networksAccounts['bitcoin-mainnet'][0].getReceiveAddress()`. The `validateAddress` function in `utils/swap.ts` already validates Bitcoin addresses (regex: `/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/`). The `addressValidation` computed value already gates `handleContinueToReview`.

## Goals / Non-Goals

**Goals:**
- Pre-fill the recipient address with the user's own address for the target chain.
- Keep the field fully editable.
- Reuse existing `validateAddress` — no new validation code.

**Non-Goals:**
- Address book / contact list.
- Support for multiple addresses per chain.

## Decisions

### D1: Add `defaultRecipientAddress` prop at `SwapScreenProps` level

**Choice**: Add `defaultRecipientAddress?: string` to `SwapScreenProps`. In `useSwapScreenLogic`, initialize `recipientAddress` state with it. Each platform page resolves the user's BTC address from `activeAccount.networksAccounts` and passes it down.

**Rationale**: The hook is chain-agnostic — it just takes a default string. The platform page knows which chain the user targets and can resolve the correct address. This keeps the shared hook clean.

### D2: Resolve address from activeAccount in swap pages

**Choice**: In both `swap.tsx` (mobile) and `SwapPage.tsx` (extension), compute the user's BTC address via a `useMemo` that looks up `activeAccount.networksAccounts['bitcoin-mainnet']` and calls `getReceiveAddress()`. Pass it as `defaultRecipientAddress`.

**Rationale**: `useMultiChainTokens` already does the same lookup internally. The swap page has access to `activeAccount` from `useAccountsContext`.
