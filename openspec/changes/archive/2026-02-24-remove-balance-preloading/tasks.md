## 1. Remove useAdjacentBalances hook

- [x] 1.1 Delete `packages/shared/src/hooks/useAdjacentBalances.ts`
- [x] 1.2 Remove the `useAdjacentBalances` export block (named + default + types) from `packages/shared/src/hooks/index.ts` (lines 84-93)

## 2. Remove preloading from extension HomePage

In `apps/extension/src/pages/home/HomePage.tsx`:

- [x] 2.1 Remove the `useAdjacentBalances` import (line 9) and its usage (lines 462-467)
- [x] 2.2 Remove the prev network `useBalance` call: the `prevNetwork` variable and the `useBalance({ account: adjacentAccounts.prevAccount ... })` block (lines 494-505)
- [x] 2.3 Remove the next network `useBalance` call: the `nextNetwork` variable and the `useBalance({ account: adjacentAccounts.nextAccount ... })` block (lines 507-518)
- [x] 2.4 Simplify the `blockchainBalances` useMemo: remove the `isPrevNetwork`/`isNextNetwork` branches (lines 815-828). Non-active networks should fall through to the `else` branch returning `{ usdTotal: undefined, changePercent: undefined, changeAmount: undefined, loading: false }`
- [x] 2.5 Remove all prev/next balance variables from the `blockchainBalances` useMemo dependency array (lines 841-842): `prevNetwork`, `prevUsdTotal`, `prevChangePercent`, `prevChangeAmount`, `prevLoading`, `nextNetwork`, `nextUsdTotal`, `nextChangePercent`, `nextChangeAmount`, `nextLoading`

## 3. Remove preloading from mobile HomeScreen

In `apps/mobile/app/(app)/(tabs)/index.tsx`:

- [x] 3.1 Remove the `useAdjacentBalances` import (line 42) and its usage (lines 234-239)
- [x] 3.2 Remove the prev network `useBalance` call: the `prevNetwork` variable and the `useBalance({ account: adjacentAccounts.prevAccount ... })` block (lines 290-302)
- [x] 3.3 Remove the next network `useBalance` call: the `nextNetwork` variable and the `useBalance({ account: adjacentAccounts.nextAccount ... })` block (lines 304-316)
- [x] 3.4 Simplify the `blockchainBalances` useMemo: remove the `isPrevNetwork`/`isNextNetwork` branches (lines 347-361). Non-active networks should fall through to the `else` branch returning `{ usdTotal: undefined, changePercent: undefined, changeAmount: undefined, loading: false }`
- [x] 3.5 Remove all prev/next balance variables from the `blockchainBalances` useMemo dependency array (lines 396-408): `prevNetwork`, `prevUsdTotal`, `prevChangePercent`, `prevChangeAmount`, `prevLoading`, `prevRefreshing`, `nextNetwork`, `nextUsdTotal`, `nextChangePercent`, `nextChangeAmount`, `nextLoading`, `nextRefreshing`
- [x] 3.6 Remove the now-unused `isPrevNetwork` and `isNextNetwork` local variables from the `blockchainBalances` mapper (lines 325-326)

## 4. Verify

- [x] 4.1 Run typecheck: `pnpm turbo run typecheck` — ensure no type errors from removed imports/variables
