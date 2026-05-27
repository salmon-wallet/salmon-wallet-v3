## Why

When developer networks are enabled and the user views Solana Devnet or Bitcoin Testnet in the carousel, the token list and header address show data from the wrong network (e.g., Bitcoin mainnet tokens and Bitcoin address while the Solana Devnet card is visually selected). Additionally, devnet/testnet accounts show undefined balance instead of $0.00 because the `getBalance()` methods skip `usdTotal` when no price data is available.

## What Changes

- **Sync carousel index with stored `networkId` on mount**: `activeBlockchainIndex` in `HomePage` starts at `0` but `networkId` is restored from localStorage. A sync effect will ensure the carousel visual matches the active network on initial load and on network changes.
- **Return `usdTotal: 0` when prices are unavailable**: `SolanaAccount.getBalance()`, `BitcoinAccount.getBalance()`, and `EthereumAccount.getBalance()` currently return `{ items }` without `usdTotal` when price APIs return no data (devnet/testnet). They will return `{ usdTotal: 0, last24HoursChange: 0, items }` instead, so the BalanceCard always has a numeric value to display.
- **Ensure devnet/testnet token list shows correct data**: With the carousel sync fix, `activeBlockchainAccount` will properly resolve to the correct devnet/testnet account, and `useBalance` will fetch tokens for the right network.

## Capabilities

### New Capabilities
- `devnet-balance-display`: Covers correct display of balances, tokens, and addresses for developer/test networks (Solana Devnet, Bitcoin Testnet, Ethereum Sepolia) including carousel sync, zero-balance handling, and proper account resolution.

### Modified Capabilities
- `blockchain-switch-skeleton`: The carousel index initialization must sync with the persisted `networkId` to prevent visual/data mismatch on page load.

## Impact

- **`packages/shared/src/blockchain/solana/SolanaAccount.ts`**: `getBalance()` — return `usdTotal: 0` fallback
- **`packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts`**: `getBalance()` — return `usdTotal: 0` fallback
- **`packages/shared/src/blockchain/ethereum/EthereumAccount.ts`**: `getBalance()` — return `usdTotal: 0` fallback
- **`apps/web/src/pages/home/HomePage.tsx`**: Add carousel index sync effect
- **`apps/extension/src/pages/home/HomePage.tsx`**: Add carousel index sync effect (feature parity)
- No API changes, no new dependencies, no breaking changes
