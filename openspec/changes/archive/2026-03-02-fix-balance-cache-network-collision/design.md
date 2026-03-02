## Problem

`useBalance` receives `networkId` but ignores it (`_networkId`). The cache key is `account.getReceiveAddress()` only. For Solana, where mainnet and devnet derive the same address from the same seed, this means:

1. Fetch mainnet balance → cache: `{key: "9mpJyg...", data: $12.46}`
2. Switch to devnet → cache expired (>60s) → fresh fetch → cache: `{key: "9mpJyg...", data: $0.00}`
3. Switch back to mainnet → cache hit (<60s) → shows $0.00 (wrong!)

## Design

### Composite cache key: `${address}:${networkId}`

Change three locations in `useBalance.ts` to use a composite key:

1. **`prevAccountKeyRef` comparison** (line 138): Use `${address}:${networkId}` instead of just `address`. This ensures the "account changed" detection fires when the network changes even if the address is the same.

2. **`cacheRef.accountKey`** (lines 131, 372, 375, 407): Store and compare the composite key `${address}:${networkId}` so each network gets its own cache slot.

3. **`fetchBalance` deps** (line 419): Add `_networkId` to the dependency array so the callback is recreated when the network changes, triggering the fetch effect.

### Why not separate the cache by network ID only?

Different blockchains have different addresses (Bitcoin mainnet vs testnet), so the existing address-based key already works for them. The composite key `address:networkId` handles both cases correctly: same-address (Solana) and different-address (Bitcoin) networks.

### Rename `_networkId` to `networkId`

Remove the underscore prefix since the parameter is now actively used.
