## Why

The `useBalance` hook caches balance data keyed only by `account.getReceiveAddress()`. Solana uses the same address across mainnet and devnet, so switching between them causes cache collisions: devnet balance ($0.00) overwrites the mainnet cache, and switching back shows $0.00 for mainnet because the cache key matches. The `networkId` parameter is already passed to the hook but is unused (`_networkId`).

## What Changes

- Include `networkId` in the `useBalance` cache key (`cacheRef.accountKey`) so that same-address accounts on different networks have separate cache entries
- Include `networkId` in the `prevAccountKeyRef` comparison so the hook detects network switches even when the address doesn't change
- Use `networkId` in `fetchBalance` deps so a network change triggers a fresh fetch

## Capabilities

### New Capabilities

- `balance-cache-network-key`: Cache key in useBalance includes networkId to prevent cross-network cache collisions for same-address accounts

### Modified Capabilities

_(none)_

## Impact

- **`packages/shared/src/hooks/useBalance.ts`** — Single file change. Cache key format changes from `address` to `address:networkId`. The `_networkId` parameter becomes actively used.
- No API changes, no UI changes, no other file changes needed.
