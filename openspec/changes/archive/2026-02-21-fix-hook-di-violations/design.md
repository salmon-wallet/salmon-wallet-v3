## Context

The DI refactor gave each Account class injected functions for balance, prices, transactions. However, three hooks still bypass this by importing API services directly. The fix adds the missing DI functions to the account interfaces and rewires the hooks.

### Existing code that already works and can be reused

- `BitcoinAccount` already has `getRecentTransactions(paging)` backed by DI
- `SolanaAccount` already has `getRecentTransactions(paging)` backed by DI (via `transactions.ts` service wrapper)
- `fetchUtxos` and `broadcastTransaction` already exist in `api/services/bitcoin.ts` with correct signatures matching `FetchUtxosFn` / `BroadcastTransactionFn` from `types/transfer.ts`
- `getSolanaNfts` already exists in `api/services/solana-nft.ts`
- `getAll` (getAllNfts) in `blockchain/solana/nft.ts` already accepts a `FetchNftsFromBackendFn` parameter — it's already DI-ready
- `bitcoinApiFunctions` and `solanaApiFunctions` are the DI adapter objects wired in factories

## Goals / Non-Goals

**Goals:**
- Route all hook data fetching through account DI methods
- Add `fetchUtxos` / `broadcastTransaction` to Bitcoin DI interface
- Add `fetchNfts` to Solana DI interface
- Keep the same runtime behavior — hooks produce identical results

**Non-Goals:**
- Changing the hook public API (params/return types) — callers should not need changes
- Refactoring the transfer functions themselves (`sendBitcoin`, `getUtxos`, etc.)
- Changing Ethereum hooks (they already use DI correctly)

## Decisions

### Decision 1: Add `fetchUtxos` and `broadcastTransaction` to `BitcoinAccountApiFunctions`

**Approach**: Extend the DI interface with two new optional-turned-required fields. Wire them in `bitcoinApiFunctions`. Expose as `BitcoinAccount.getUtxos()` and `BitcoinAccount.broadcast()`.

**Why**: `useSendTransaction` currently imports these directly from `api/services/bitcoin`. By adding them to the account, the hook can call `btcAccount.getUtxos()` instead, following the same pattern as `getBalance()` and `getRecentTransactions()`.

**Trade-off**: Expands the `BitcoinAccountApiFunctions` interface. Acceptable because these are core Bitcoin operations that belong on the account.

### Decision 2: Add `fetchNfts` to `SolanaAccountApiFunctions`

**Approach**: Add `fetchNfts` to the DI interface. Replace `SolanaAccount.getAllNfts()` stub (currently throws `method_not_supported`) with a real implementation that calls `getAll()` from `nft.ts` passing the injected `fetchNfts` function.

**Why**: `useAvatarNfts` currently imports `getSolanaNfts` directly and passes it to `getAllNfts()`. The account should own this.

### Decision 3: Refactor `useTransactions` to use account instance

**Approach**: Change hook params to accept a `BlockchainAccount` instance instead of raw `address` + `networkId`. Use `account.getRecentTransactions(paging)` which is already DI-backed for all three blockchains.

**Why**: The hook currently imports `getSolanaTransactions` and `getMultichainTransactions` directly. Both `SolanaAccount` and `BitcoinAccount` already have `getRecentTransactions()` methods that do the same thing via DI.

**Important**: This changes the hook's public interface. Callers pass `account` instead of `address`/`networkId`. Since `useTransactions` is consumed by the app layer, the callers must be updated too.

### Decision 4: Refactor `useSendTransaction` minimally — replace only the direct imports

**Approach**: Instead of restructuring `sendBitcoin()`, just replace `fetchUtxos` and `broadcastTransaction` imports with calls to `btcAccount.getUtxos()` and `btcAccount.broadcast()`. The `sendBitcoin()` and `getUtxos()` transfer functions still accept DI params — we just source them from the account now.

**Why**: Minimal change, same behavior. The transfer functions are DI-ready (they accept functions as params), we just need to get those functions from the account instead of importing them directly.

## Risks / Trade-offs

**[useTransactions public API change]** → Callers need to pass `account` instead of `address`/`networkId`. Mitigation: the callers already have the account available (they get it from `useAccountsContext`). The address and networkId can be derived from the account.

**[BitcoinAccount interface expansion]** → Two new required fields. Mitigation: only `bitcoinApiFunctions` creates these, and both functions already exist in the same file.
