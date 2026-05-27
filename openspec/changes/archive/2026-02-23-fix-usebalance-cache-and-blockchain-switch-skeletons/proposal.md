## Why

When users switch blockchains via the carousel (arrows on extension, swipe on mobile), they see the previous blockchain's balance displayed on the new card before it eventually corrects. This happens because `useBalance`'s cache (`cacheRef`) does not key by account — it returns stale data from the wrong chain on cache hit. Additionally, `changeNetwork` in `useAccounts` never sets `switchingAccount = true`, so skeletons never appear during blockchain transitions, and stale data is never cleared.

## What Changes

- **Fix `useBalance` cache to key by account identity**: The `cacheRef` must store the account identifier alongside the cached data. When the account parameter changes, the cache must miss (not return data from a different blockchain).
- **Reset `balance` state on account change**: When `useBalance` detects a new account, it must clear the previous `balance` state to `null` to prevent stale data from rendering during the fetch.
- **Activate skeleton state during blockchain switch**: Either `changeNetwork` in `useAccounts` must set a switching flag (analogous to `switchingAccount` for account changes), or the carousel handler must set a local transitioning state that forces `loading: true` on the BalanceCard and empties the token list.
- **Add skeleton for Bitcoin TokenListItem layout**: The Bitcoin view on both platforms renders a single `TokenListItem` (not `TokenList`), so it bypasses `TokenListSkeleton`. A skeleton placeholder is needed for the Bitcoin layout during transitions.

## Capabilities

### New Capabilities
- `blockchain-switch-skeleton`: Skeleton loading states for BalanceCard (balance + 24h change) and TokenList/TokenListItem during blockchain carousel transitions, covering Solana/Ethereum and Bitcoin layouts on both mobile and extension.

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **`packages/shared/src/hooks/useBalance.ts`**: Cache invalidation logic (keying by account address/identity), state reset on account change.
- **`packages/shared/src/hooks/useAccounts.ts`**: Potentially `changeNetwork` to set a switching flag, or coordinate with a new mechanism.
- **`apps/extension/src/pages/home/HomePage.tsx`**: Wire transitioning state to BalanceCard `loading` and TokenList `loading`/`tokens` props. Handle Bitcoin skeleton view.
- **`apps/mobile/app/(app)/(tabs)/index.tsx`**: Same wiring for mobile home screen.
- **`apps/extension/src/components/TokenList/`**: Possible Bitcoin skeleton variant.
- **`apps/mobile/src/components/TokenList/`**: Possible Bitcoin skeleton variant.
- **No backend changes required** — the bug is entirely client-side.
- **No breaking changes** — all fixes are internal behavioral corrections.
