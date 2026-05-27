## 1. Fix useBalance cache and state reset (shared)

- [x] 1.1 Add `accountKey` to `cacheRef` in `packages/shared/src/hooks/useBalance.ts`. Change the cache type from `{ data: WalletBalance; timestamp: number }` to `{ data: WalletBalance; timestamp: number; accountKey: string }`. In `fetchBalance`, when writing to cache (line 380), include `accountKey: account.getReceiveAddress()`. In the cache check (lines 349-355), add `cacheRef.current.accountKey === account.getReceiveAddress()` to the condition. If the accountKey doesn't match, treat as cache miss.

- [x] 1.2 Add account-change detection and state reset in `packages/shared/src/hooks/useBalance.ts`. Add a `prevAccountKeyRef = useRef<string | undefined>(undefined)` that tracks the previous account address. Add a `useEffect` that runs when `account` changes: if the new account's `getReceiveAddress()` differs from `prevAccountKeyRef.current`, set `balance` to `null`, `loading` to `true`, and clear `cacheRef.current` to `null`. Update `prevAccountKeyRef.current` to the new address. If `account` becomes `undefined`, set `balance` to `null` and `loading` to `false`.

## 2. Add switchingNetwork flag to useAccounts (shared)

- [x] 2.1 Add `switchingNetwork: boolean` state and `clearSwitchingNetwork` action to `packages/shared/src/hooks/useAccounts.ts`. Add `const [switchingNetwork, setSwitchingNetwork] = useState(false)` alongside the existing `switchingAccount` state (line 386). Create `const clearSwitchingNetwork = useCallback(() => setSwitchingNetwork(false), [])`. In `changeNetwork` (line 982), add `setSwitchingNetwork(true)` before `setNetworkId(targetId)` — but only if `networkId !== targetId` (the early return on line 984 already guards this). Add `switchingNetwork` to the returned state object (line 1303) and `clearSwitchingNetwork` to the returned actions object (line 1306). Update the `UseAccountsState` interface (line 116 area) to include `switchingNetwork: boolean` and `UseAccountsActions` interface (line 136 area) to include `clearSwitchingNetwork: () => void`.

## 3. Wire skeleton states in extension HomePage

- [x] 3.1 Consume `switchingNetwork` and `clearSwitchingNetwork` in `apps/extension/src/pages/home/HomePage.tsx`. Destructure `switchingNetwork` from `state` (line 341) and `clearSwitchingNetwork` from `actions`. Add a `useEffect` that clears `switchingNetwork` when balance loading completes: `useEffect(() => { if (!loading && switchingNetwork) { actions.clearSwitchingNetwork(); } }, [loading, switchingNetwork, actions])` — same pattern as the existing `switchingAccount` effect on lines 470-474.

- [x] 3.2 Update the `blockchainBalances` builder in `apps/extension/src/pages/home/HomePage.tsx` (lines 794-799). In the `isActiveNetwork` branch, add `switchingNetwork` alongside `switchingAccount` in the ternary conditions: `usdTotal: (switchingAccount || switchingNetwork) ? undefined : usdTotal`, same for `changePercent`, `changeAmount`, and `loading: (switchingAccount || switchingNetwork) || (loading && usdTotal === undefined)`. Add `switchingNetwork` to the `useMemo` dependency array (line 825).

- [x] 3.3 Update the token list section in `apps/extension/src/pages/home/HomePage.tsx`. For the Solana/Ethereum branch (lines 1421-1424), add `switchingNetwork` to the conditions: `{formattedTokens.length > 0 || loading || switchingAccount || switchingNetwork ? (` and `tokens={(switchingAccount || switchingNetwork) ? [] : formattedTokens}` and `loading={(switchingAccount || switchingNetwork) || (loading && formattedTokens.length === 0)}`. For the Bitcoin branch (lines 1381-1411), wrap the `bitcoinToken && (` condition: when `switchingNetwork` is true, render `<TokenListSkeleton count={1} />` instead of the Bitcoin `TokenListItem`. Import `TokenListSkeleton` from the TokenList component (it's already exported as `TokenListSkeleton` in `TokenList.tsx:79`).

## 4. Wire skeleton states in mobile home screen

- [x] 4.1 Consume `switchingNetwork` and `clearSwitchingNetwork` in `apps/mobile/app/(app)/(tabs)/index.tsx`. Destructure `switchingNetwork` from state and `clearSwitchingNetwork` from actions. Add the same clearing `useEffect` pattern as extension: clear `switchingNetwork` when `loading` becomes `false`.

- [x] 4.2 Update the `blockchainBalances` builder in `apps/mobile/app/(app)/(tabs)/index.tsx`. Apply the same changes as task 3.2: add `switchingNetwork` to the `switchingAccount` ternary conditions in the `isActiveNetwork` branch for `usdTotal`, `changePercent`, `changeAmount`, and `loading`. Add `switchingNetwork` to the `useMemo` dependency array.

- [x] 4.3 Update the token list and Bitcoin sections in `apps/mobile/app/(app)/(tabs)/index.tsx`. For the Solana/Ethereum token list, add `switchingNetwork` to the token-clearing and loading conditions (same pattern as task 3.3). For the Bitcoin view, render `<TokenListSkeleton count={1} />` when `switchingNetwork` is true instead of the Bitcoin `TokenListItem`. Import `TokenListSkeleton` from the mobile TokenList components.

## 5. Typecheck

- [x] 5.1 Run `pnpm turbo run typecheck` to verify no type errors across `@salmon/shared`, `@salmon/extension`, and `@salmon/mobile`. Fix any type issues from the new `switchingNetwork`/`clearSwitchingNetwork` additions to the `UseAccountsState`/`UseAccountsActions` interfaces.
