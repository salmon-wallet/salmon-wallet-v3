## Context

The wallet carousel (`BalanceCardCarousel`) and the token list are driven by two independent pieces of state:
- `activeBlockchainIndex` — local `useState(0)` in each HomePage, controls which card is visually shown.
- `networkId` — global state from `useAccountsContext`, restored from localStorage on mount.

On first load, the carousel always shows card index 0 while `networkId` may point to a different network (e.g., `bitcoin-mainnet`). This desync causes the token list, header address, and balance data to show data for a network that doesn't match the visible card.

Additionally, `getBalance()` in all three blockchain account classes (`SolanaAccount`, `BitcoinAccount`, `EthereumAccount`) returns `{ items }` without `usdTotal` when price APIs return no data (devnet/testnet), leaving the BalanceCard with `undefined` values.

## Goals / Non-Goals

**Goals:**
- Carousel index syncs with `networkId` on mount and on external network changes across all three apps (web, extension, mobile).
- Devnet/testnet balance cards display `$0.00` instead of undefined when prices are unavailable.
- Token list always reflects the currently selected network's data.

**Non-Goals:**
- Pre-fetching balance for non-active networks.
- Adding Jupiter/CoinGecko price support for devnet tokens.
- Changing how devnet accounts are derived or created (account creation already includes devnet via `MIRROR_NETWORKS`).

## Decisions

### 1. Add a carousel-to-networkId sync effect in each HomePage

**Approach:** Add a `useEffect` that runs when `networkId` or `allNetworks` changes. It finds the index of `networkId` in `allNetworks` and updates `activeBlockchainIndex` if they differ.

```typescript
useEffect(() => {
  if (!networkId || allNetworks.length === 0) return;
  const idx = allNetworks.findIndex((n) => n.id === networkId);
  if (idx >= 0 && idx !== activeBlockchainIndex) {
    setActiveBlockchainIndex(idx);
  }
}, [networkId, allNetworks]);
```

**Why not initialize `useState` with the correct index?** `networkId` and `allNetworks` are not available synchronously at first render — `networkId` comes from async storage, and `allNetworks` depends on `useAvailableNetworks` and the account data. A sync effect is the simplest correct approach.

**Affected files:**
- `apps/web/src/pages/home/HomePage.tsx` (line ~260, after existing allNetworks reset effect)
- `apps/extension/src/pages/home/HomePage.tsx` (line ~457, after existing allNetworks reset effect)
- `apps/mobile/app/(app)/(tabs)/index.tsx` (after the equivalent allNetworks reset effect)

### 2. Return `usdTotal: 0` when price data is unavailable

**Approach:** In the `getBalance()` method of all three account classes, change the fallback return from `{ items: balances }` to `{ usdTotal: 0, last24HoursChange: 0, items: balances }`.

**Why 0 instead of undefined?** The BalanceCard's `formatValue()` can format `0` as `$0.00`. Leaving it `undefined` causes the display to break or show nothing. The value is semantically correct: devnet tokens have $0 market value.

**Affected files:**
- `packages/shared/src/blockchain/solana/SolanaAccount.ts` — line 294: `return { items: balances }` → `return { usdTotal: 0, last24HoursChange: 0, items: balances }`
- `packages/shared/src/blockchain/bitcoin/BitcoinAccount.ts` — line 367: same change
- `packages/shared/src/blockchain/ethereum/EthereumAccount.ts` — line 287: same change

### 3. No changes to account creation or useBalance hook

The existing `useBalance` hook already handles account switching correctly (cache keyed by address, clears stale data on account change — per the `blockchain-switch-skeleton` spec). The bug is purely that the carousel index doesn't match the network, so `activeBlockchainAccount` resolves correctly but the visual is wrong.

Account creation already derives devnet accounts via `MIRROR_NETWORKS` in `derived-accounts.ts`. No changes needed there.

## Risks / Trade-offs

- **[Risk] Effect runs on every `networkId` change** → Minimal: the `findIndex` is O(n) on a 6-element array, and the effect exits early if index already matches. No performance concern.
- **[Risk] Mobile carousel animation may jump on mount** → The carousel will snap to the correct index on mount. This is the correct behavior since the user expects to see the network they last used. If a smooth scroll is desired later, it can be added separately.
- **[Trade-off] `usdTotal: 0` is returned even when balance items exist on devnet** → Acceptable. Devnet tokens have no real dollar value. Showing `$0.00` is more informative than showing nothing or a loading skeleton.
