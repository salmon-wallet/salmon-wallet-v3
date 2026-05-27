## Why

Two hooks in `packages/shared/src/hooks/` bypass the account DI pattern by importing blockchain transfer modules directly:

1. **`useSendTransaction.ts`** -- imports `createTransfer` and `estimateFee` from `blockchain/solana/transfer`, `sendTransaction` and `estimateTransferFee` and `formatAmount` from `blockchain/ethereum/transfer`, and `sendBitcoin` and `estimateBitcoinFee` from `blockchain/bitcoin/transfer`. The hook manually extracts `connection`, `keyPair`, `wallet`, `provider`, `network`, `node` from the account and passes them to these functions, reconstructing the plumbing that the account class should own.

2. **`useNftTransfer.ts`** -- imports `createTransfer` from `blockchain/solana/transfer` and `sendTransaction` from `blockchain/ethereum/transfer`. Same pattern: extracts connection/keypair/wallet from the account, constructs transfer params manually.

The account classes already possess every resource needed for transfers (connection, keypair, wallet, network, UTXOs, broadcast). The hooks should just call `account.transfer(to, token, amount)` and `account.estimateFee(to, token, amount)`.

This violation:
- Makes hooks untestable without mocking blockchain internals (Connection, Keypair, Wallet, Provider)
- Duplicates the "which blockchain am I?" routing logic in every hook
- Breaks the DI pattern established by `getBalance()`, `getRecentTransactions()`, `getAllNfts()`, `validateDestinationAccount()`

## What Changes

- Add DI function type aliases for transfer and fee-estimation to `types/transfer.ts`
- Add `transfer()` and `estimateFee()` public methods to `SolanaAccount`, `EthereumAccount`, and `BitcoinAccount`
- Wire the transfer functions through the existing `*ApiFunctions` DI interfaces and API adapter objects
- Refactor `useSendTransaction` to call `account.transfer()` and `account.estimateFee()` instead of importing blockchain modules directly
- Refactor `useNftTransfer` to call `account.transfer()` instead of importing blockchain modules directly

## Capabilities

### New Capabilities

_None -- this is a refactor preserving existing behavior._

### Modified Capabilities

_None -- no spec-level requirement changes, only implementation details._

## Impact

- `packages/shared/src/types/transfer.ts` -- Add `CreateTransferFn`, `EstimateFeeFn` DI type aliases for Solana; `SendTransactionFn`, `EstimateTransferFeeFn` for Ethereum (Bitcoin already has what it needs via `FetchUtxosFn` / `BroadcastTransactionFn`)
- `packages/shared/src/blockchain/solana/SolanaAccount.ts` -- Add `transfer()` and `estimateFee()` methods
- `packages/shared/src/blockchain/ethereum/EthereumAccount.ts` -- Add `transfer()` and `estimateFee()` methods
- `packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts` -- Add `transfer()` and `estimateFee()` methods
- `packages/shared/src/types/transfer.ts` -- Extend `SolanaAccountApiFunctions`, `EthereumAccountApiFunctions`, `BitcoinAccountApiFunctions` with transfer DI fields
- `packages/shared/src/api/services/solana.ts` -- Wire transfer functions into `solanaApiFunctions`
- `packages/shared/src/api/services/ethereum.ts` -- Wire transfer functions into `ethereumApiFunctions`
- `packages/shared/src/api/services/bitcoin.ts` -- Wire transfer functions into `bitcoinApiFunctions` (may already be sufficient since `fetchUtxos`/`broadcastTransaction` are present)
- `packages/shared/src/hooks/useSendTransaction.ts` -- Remove all direct blockchain imports; call account methods
- `packages/shared/src/hooks/useNftTransfer.ts` -- Remove all direct blockchain imports; call account methods
- No changes to mobile or extension apps -- hooks maintain the same external interface
