## Why

Three hooks in `packages/shared/src/hooks/` bypass the DI architecture by importing API service functions directly instead of routing through account instance methods:

1. **`useTransactions.ts`** — imports `getSolanaTransactions` and `getMultichainTransactions` from API services, calling them with raw addresses instead of using `account.getRecentTransactions()`
2. **`useSendTransaction.ts`** — imports `fetchUtxos` and `broadcastTransaction` from `api/services/bitcoin`, passing them directly to `sendBitcoin()` instead of routing through `BitcoinAccount`
3. **`useAvatarNfts.ts`** — imports `getSolanaNfts` from `api/services` and passes it to `getAllNfts()` instead of routing through the account

This makes these hooks untestable without mocking HTTP, couples them to specific API implementations, and breaks the pattern established by `useBalance` (which correctly calls `account.getBalance()`).

## What Changes

- Add `fetchUtxos` and `broadcastTransaction` to `BitcoinAccountApiFunctions` DI interface so `BitcoinAccount` can expose them
- Add `fetchNfts` to `SolanaAccountApiFunctions` DI interface so `SolanaAccount` can expose NFT fetching
- Refactor `useTransactions` to receive an account instance and call its DI-backed transaction methods
- Refactor `useSendTransaction` to use `BitcoinAccount` DI methods for UTXOs and broadcasting
- Refactor `useAvatarNfts` to use `SolanaAccount` DI method for NFT fetching

## Capabilities

### New Capabilities

_None — this is a refactor preserving existing behavior._

### Modified Capabilities

_None — no spec-level requirement changes, only implementation details._

## Impact

- `packages/shared/src/types/transfer.ts` — Add `fetchUtxos` and `broadcastTransaction` to `BitcoinAccountApiFunctions`; add `fetchNfts` to `SolanaAccountApiFunctions`
- `packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts` — Expose `getUtxos()` and `broadcast()` methods backed by DI
- `packages/shared/src/blockchain/solana/SolanaAccount.ts` — Replace `getAllNfts()` stub with real DI-backed implementation
- `packages/shared/src/api/services/bitcoin.ts` — Wire `fetchUtxos` and `broadcastTransaction` into `bitcoinApiFunctions`
- `packages/shared/src/api/services/solana.ts` — Wire `getSolanaNfts` into `solanaApiFunctions`
- `packages/shared/src/hooks/useTransactions.ts` — Replace direct API imports with account-based calls
- `packages/shared/src/hooks/useSendTransaction.ts` — Replace direct `fetchUtxos`/`broadcastTransaction` imports with account methods
- `packages/shared/src/hooks/useAvatarNfts.ts` — Replace direct `getSolanaNfts` import with account method
- No changes to mobile or extension apps — hooks maintain the same external interface
