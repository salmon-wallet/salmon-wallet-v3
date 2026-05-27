# balance-cache-network-key Specification

## Purpose

Define the cache-key contract for `useBalance` so balances stay correctly partitioned per network. The hook keys its cache by `${address}:${networkId}` and invalidates the fetch effect when `networkId` changes, preventing stale mainnet data from leaking into devnet (and vice versa) when the same address is reused across networks.

## Requirements

### Requirement: useBalance cache MUST include networkId in cache key

The `useBalance` hook (`packages/shared/src/hooks/useBalance.ts`) SHALL use a composite key of `${address}:${networkId}` for both the cache ref (`cacheRef.accountKey`) and the account change detection ref (`prevAccountKeyRef`). The `networkId` parameter SHALL be actively used (not prefixed with underscore).

#### Scenario: Solana mainnet and devnet with same address

- **WHEN** the user switches from Solana mainnet to Solana devnet (same address `9mpJyg...`)
- **THEN** the cache key changes from `9mpJyg...:solana-mainnet` to `9mpJyg...:solana-devnet`
- **AND** the hook SHALL clear stale mainnet data and fetch fresh devnet balance

#### Scenario: Return to mainnet after visiting devnet

- **WHEN** the user switches from Solana devnet back to Solana mainnet (same address)
- **THEN** the cache key changes to `9mpJyg...:solana-mainnet`
- **AND** the hook SHALL either serve valid mainnet cache or fetch fresh mainnet balance
- **AND** the mainnet balance SHALL NOT show devnet's $0.00

#### Scenario: Bitcoin mainnet to testnet (different addresses)

- **WHEN** the user switches from Bitcoin mainnet (`18cHd...`) to Bitcoin testnet (`mo8Ev...`)
- **THEN** the cache key changes due to both address AND networkId changing
- **AND** existing behavior is preserved (no regression)

#### Scenario: fetchBalance re-triggers on network change

- **WHEN** `networkId` changes (even if `account` object reference is stable)
- **THEN** `fetchBalance` SHALL be recreated and the fetch effect SHALL fire
