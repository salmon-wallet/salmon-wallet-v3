## Context

When users navigate the blockchain carousel (arrows on extension, swipe on mobile), the `useBalance` hook serves stale data from the previous blockchain because its cache (`cacheRef`) stores a single `{ data, timestamp }` entry with no account identifier. Additionally, `changeNetwork` in `useAccounts` does not set `switchingAccount = true`, so stale data is never cleared and skeletons never appear during blockchain transitions.

Three `useBalance` hook instances run in `HomePage`: active, prev, and next. When the carousel index shifts, each hook receives a new account parameter, but their internal `balance` state and `cacheRef` still hold data from the old account. The preloaded data from the "next" hook is lost because it's not transferred to the "active" hook.

### Current code locations
- `packages/shared/src/hooks/useBalance.ts` — cache logic (lines 349-355), state management
- `packages/shared/src/hooks/useAccounts.ts` — `changeNetwork` (lines 982-1000), `switchingAccount` flag
- `apps/extension/src/pages/home/HomePage.tsx` — carousel wiring, `blockchainBalances` builder (lines 780-829)
- `apps/mobile/app/(app)/(tabs)/index.tsx` — same pattern for mobile

### Existing reusable pieces
- `BlockchainAccount.getReceiveAddress()` — available on all 3 chain account types, returns unique address string. Ideal as cache key.
- `switchingAccount` flag in `useAccounts` — already used for account-switch skeletons, same pattern needed for network switch.
- `TokenListSkeleton` — exists on both platforms (extension: `TokenList.tsx:79-105`, mobile: `TokenListSkeleton.tsx`). Layout matches Solana/Ethereum `TokenListItem`.
- `BalanceCard` `loading` prop — already renders `SkeletonRect` for balance and change row.

## Goals / Non-Goals

**Goals:**
- Fix `useBalance` cache to never return data from a different account
- Reset `balance` state to `null` when the account parameter changes, preventing stale data flash
- Show skeleton loading states on BalanceCard and TokenList/TokenListItem during blockchain carousel transitions
- Support Bitcoin layout skeleton (single `TokenListItem` with Bitcoin layout, not `TokenList`)
- Apply fix to both extension and mobile (feature parity)

**Non-Goals:**
- Refactoring the 3-hook preload architecture (active + prev + next) — that pattern works, the cache is the issue
- Adding polling or auto-refresh to `useBalance`
- Changing the carousel animation timing
- Modifying any backend endpoints

## Decisions

### 1. Cache key by account address in `useBalance`

**Decision**: Change `cacheRef` from `{ data, timestamp }` to `{ data, timestamp, accountKey }` where `accountKey = account.getReceiveAddress()`. On cache check, compare the stored `accountKey` against the current account's address. Cache miss if they differ.

**Why not a Map keyed by address?** A Map would accumulate entries for every account the user visits. Since `useBalance` is per-hook-instance and typically tracks one account at a time, a single-entry cache with an identity check is simpler and avoids memory growth. The Map approach would also need eviction logic.

**Why `getReceiveAddress()` as key?** It's the only method common to all 3 `BlockchainAccount` types (`SolanaAccount:298`, `BitcoinAccount:169`, `EthereumAccount:188`). Each account instance has a unique address per chain+derivation path combination, making it a reliable identity.

### 2. Reset `balance` state on account change

**Decision**: Add a `useEffect` in `useBalance` that watches `account` and resets `balance` to `null`, `loading` to `true`, and clears `cacheRef` when the account reference changes. Use a `prevAccountRef` to track the previous account address.

**Why not rely on the cache miss alone?** The cache miss triggers a fetch, but between the render where account changes and the render where fetch completes, the stale `balance` state would still be visible. Resetting to `null` immediately ensures the consumer sees `loading: true` / `usdTotal: undefined` in that window.

### 3. Use `switchingNetwork` flag in `useAccounts` (not `switchingAccount`)

**Decision**: Add a new `switchingNetwork: boolean` state to `useAccounts`. Set it `true` at the start of `changeNetwork`, clear it in the consuming component when `loading` becomes `false` (same pattern as `switchingAccount`). Do NOT reuse `switchingAccount` because that flag is for wallet-switch transitions which may have different UX timing.

**Why a separate flag?** `switchingAccount` is set during `changeAccount` which involves heavier operations (key derivation, re-initialization). Reusing it would conflate two different transition types. A separate flag keeps the semantics clean and allows each transition to be styled independently in the future.

### 4. Bitcoin skeleton: reuse existing `TokenListSkeleton` with `count={1}`

**Decision**: When on Bitcoin and `switchingNetwork` is true, render `<TokenListSkeleton count={1} />` instead of creating a new Bitcoin-specific skeleton. The existing skeleton's layout (circle + text bars + value bars) is visually close enough to the Bitcoin `TokenListItem` layout. Both platforms already have `TokenListSkeleton`.

**Why not a Bitcoin-specific skeleton?** The Bitcoin layout differs slightly (price on left, amount on right, no token name row), but during a ~300ms transition the difference is imperceptible. Creating a dedicated skeleton would add 2 new components (one per platform) for marginal visual gain. If needed later, it can be added as a follow-up.

### 5. Wire skeleton state in HomePage (both platforms)

**Decision**: In the `blockchainBalances` builder, treat `switchingNetwork` the same way `switchingAccount` is already treated — clear `usdTotal`/`changePercent`/`changeAmount` to `undefined` and set `loading: true`. For the token list section, pass empty tokens array and `loading: true` when `switchingNetwork` is active.

This reuses the exact existing pattern from lines 796-799 (extension) and the analogous mobile code.

## Risks / Trade-offs

**[Risk] Brief double-skeleton on slow networks** — If the new network's `useBalance` fetch is slow, the user sees skeleton → data → skeleton (when cache resets) → real data.
→ Mitigation: The `balance` state reset (`null`) happens synchronously in the same render as the account change. The skeleton appears once, then real data replaces it. No double-flash.

**[Risk] Cache invalidation too aggressive** — Resetting cache on every account change means navigating back to a previously-viewed blockchain will re-fetch instead of serving cached data.
→ Mitigation: This is acceptable. The 60s TTL was already short, and showing fresh data is better than showing stale data from the wrong chain. The re-fetch is fast (blockchain RPC + price API).

**[Risk] `getReceiveAddress()` call during cache check** — Calling a method on the account object during every cache check.
→ Mitigation: All 3 implementations just return a stored string property. No computation cost.
