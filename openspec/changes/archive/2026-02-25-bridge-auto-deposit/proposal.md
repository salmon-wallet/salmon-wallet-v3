## Why

After creating a StealthEx bridge exchange, the wallet shows a success screen with the deposit address but never actually sends the funds. The user sees "Bridge Initiated" and their balance unchanged. StealthEx is non-custodial — the client must send funds to the `payinAddress` after exchange creation. Without this automatic transfer, the bridge feature is non-functional.

## What Changes

- After `onCreateBridgeExchange` succeeds and returns the exchange (including `depositAddress`), the wallet automatically sends the input tokens from the user's account to the `depositAddress` using the existing `BlockchainAccount.transfer()` infrastructure.
- The bridge confirmation flow becomes: create exchange → sign & send deposit transaction → show success with txId.
- If the deposit transfer fails, the exchange is discarded and an error is shown (StealthEx exchanges without deposits simply expire).
- The success screen shows both the exchange ID and the deposit transaction ID.

## Capabilities

### New Capabilities
- `bridge-auto-deposit`: After creating a StealthEx exchange, the wallet automatically transfers the input tokens to the deposit address using the existing blockchain transfer infrastructure. Covers the transfer execution, error handling, and UI state updates.

### Modified Capabilities
_(none)_

## Impact

- **Frontend shared** (`@salmon/shared`): `hooks/useSwapScreenLogic.ts` (execute transfer after exchange creation), `types/swap.ts` (add `onSendDeposit` callback to `SwapScreenProps`), `types/ui/transaction-success-screen.ts` (add deposit txId)
- **Frontend apps**: `SwapPage.tsx` (extension + mobile) — wire `onSendDeposit` using `activeBlockchainAccount.transfer()`
- **Frontend components**: `TransactionSuccessScreen` (extension + mobile) — show deposit txId
- **Backend**: No changes needed — StealthEx detects on-chain deposits automatically
- **Existing infra reused**: `SolanaAccount.transfer()` from `packages/shared/src/blockchain/solana/transfer.ts`, `BlockchainAccount` interface
