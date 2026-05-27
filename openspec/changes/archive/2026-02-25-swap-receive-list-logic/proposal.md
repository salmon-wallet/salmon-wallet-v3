## Why

When the user sends a Solana token, the receive list should show the full Jupiter token catalog (thousands of Solana tokens, same-chain, faster) plus only cross-chain bridge tokens like BTC from StealthEx. Currently it only shows user-held Solana balance tokens and mixes in redundant StealthEx Solana SPL tokens that Jupiter already covers better.

## What Changes

- **Load the full Jupiter verified token list** for the output token selector when the input is a Solana token. Use the existing `getTokenList()` + `mapToSwapToken()` from `@salmon/shared`.
- **Filter bridge tokens to cross-chain only** when input is Solana: exclude StealthEx tokens where `chain === 'solana'` since Jupiter handles those.
- **Keep current behavior for non-Solana input**: only StealthEx tokens (e.g., BTC → shows Solana tokens via StealthEx).

## Capabilities

### New Capabilities

- `swap-receive-jupiter-catalog`: When send token is Solana, load the full Jupiter verified token catalog as receive options and restrict StealthEx to cross-chain tokens only.

### Modified Capabilities

_(none)_

## Impact

- **`packages/shared/src/hooks/useSwapScreenLogic.ts`** — New optional prop for Jupiter tokens; updated `outputTokens` memo logic.
- **`apps/mobile/app/(app)/(tabs)/swap.tsx`** — Load Jupiter token list and pass to SwapScreen.
- **`apps/extension/src/pages/swap/SwapPage.tsx`** — Same change for feature parity.
- **`packages/shared/src/types/swap.ts`** — Add optional prop to `SwapScreenProps`.
