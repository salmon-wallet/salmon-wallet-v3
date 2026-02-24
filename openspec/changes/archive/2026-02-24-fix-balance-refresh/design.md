## Context

The wallet uses a pull-based balance architecture via `useBalance` hook (`packages/shared/src/hooks/useBalance.ts`) with a 60-second `useRef`-based cache (no React Query). The hook exposes `refresh()` to bypass cache and `lastUpdated` timestamp. Currently:

1. **Extension post-send bug:** `HomePage.tsx` passes `handleSendBack` (which only calls `setCurrentPage('home')`) as `onSuccess` to `SendPage`. Mobile correctly calls `refresh()` in its `handleSendSuccess`.
2. **No focus-based refresh:** Neither platform detects app focus events. Mobile has no `AppState` listener; extension has no `visibilitychange` listener.
3. **No manual refresh in extension:** Mobile has native pull-to-refresh via `RefreshControl`. Extension has no equivalent — only cache expiry or navigation triggers re-fetch.

**Existing platform-split pattern:** The repo uses `.native.ts` / `.web.ts` suffixes for platform-specific code (see `useRuntime.native.ts` / `useRuntime.web.ts`). The build system resolves the correct file per platform.

**Existing assets:** Extension already has a `RefreshIcon` component at `apps/extension/src/components/Icon/index.tsx:65`.

## Goals / Non-Goals

**Goals:**
- Extension refreshes balance after successful token/NFT sends (parity with mobile)
- Both platforms refresh balance when returning to foreground, throttled by cache TTL
- Extension users can manually trigger balance refresh via header button

**Non-Goals:**
- Real-time balance updates via WebSocket subscriptions (deferred, separate change)
- Changing the cache TTL value (60s is fine)
- Adding pull-to-refresh gesture to the extension (web doesn't support it natively)
- Refreshing transaction history on focus (only balance for now)

## Decisions

### 1. Extension post-send: dedicated `handleSendSuccess` callback

**Decision:** Create a `handleSendSuccess` callback in `HomePage.tsx` that calls `refresh()` then navigates home, mirroring mobile's pattern exactly.

**Why not reuse `handleSendBack`?** It's also used for the back button (no send happened), and adding refresh there would cause unnecessary fetches on simple navigation.

**Also fix NftSendDialog:** Its `onSuccess` currently just closes the dialog without refreshing. Wire it to the same `handleSendSuccess` pattern.

**Requires:** Destructure `refresh` from `useBalance` in the extension `HomePage.tsx` (currently not extracted).

### 2. Focus detection: single shared hook with platform files

**Decision:** Create `useRefreshOnFocus` as a shared hook with platform-specific implementations:
- `packages/shared/src/hooks/useRefreshOnFocus.ts` — shared types/interface only
- `packages/shared/src/hooks/useRefreshOnFocus.native.ts` — uses React Native `AppState` API
- `packages/shared/src/hooks/useRefreshOnFocus.web.ts` — uses `document.visibilitychange`

**Signature:**
```ts
function useRefreshOnFocus(options: {
  onFocus: () => void;         // callback to run (the refresh function)
  lastUpdated: number | null;  // from useBalance, for cache-aware throttling
  cacheTtl?: number;           // defaults to 60_000 (CACHE_TTL)
  enabled?: boolean;           // skip when account not ready
}): void
```

**Throttle logic:** On focus, only call `onFocus()` if `Date.now() - lastUpdated >= cacheTtl`. This prevents double-fetching if the user tabs away and back within the cache window.

**Alternative considered:** Polling with `setInterval` — rejected because it wastes API calls when the user isn't looking and doesn't solve the "just came back" latency problem.

**Alternative considered:** Putting platform detection inside a single file with `typeof document` checks — rejected because the monorepo already has the `.native.ts`/`.web.ts` pattern established (`useRuntime`), and importing `AppState` from `react-native` in a web build would fail.

### 3. Extension refresh button in WalletHeader

**Decision:** Add a `RefreshIcon` button to the left of the existing `SettingsIcon` button in the extension's `WalletHeader` component.

**Changes:**
- `packages/shared/src/types/ui/wallet-header.ts`: Add optional `onRefreshPress?: () => void` and `refreshing?: boolean` props to `WalletHeaderPropsBase`
- `apps/extension/src/components/WalletHeader/WalletHeader.tsx`: Render `RefreshIcon` inside a `HeaderButton` when `onRefreshPress` is provided. Apply CSS spin animation when `refreshing` is true.
- `apps/extension/src/pages/home/HomePage.tsx`: Pass `refresh` and `refreshing` to `WalletHeader`

**Mobile impact:** The base type gets new optional props, but mobile's `WalletHeader` doesn't need to render them — mobile already has pull-to-refresh. No mobile WalletHeader changes needed.

**Spin animation:** Use `@keyframes spin` with `animation: spin 1s linear infinite` on the icon when `refreshing` is true. No external animation library needed — pure CSS via emotion/styled.

## Risks / Trade-offs

- **[Race condition on rapid focus toggles]** → Mitigated by cache-aware throttling. Even if `visibilitychange` fires rapidly, `lastUpdated` check prevents redundant fetches.
- **[Extension popup lifecycle]** → Extension popups are destroyed on close and recreated on open. This means `useBalance`'s `useEffect` already triggers a fresh fetch on every popup open (cache is in `useRef`, lost on unmount). The focus hook adds value for the sidepanel mode which persists.
- **[Adding props to shared type]** → Both props are optional, so this is a non-breaking additive change. Mobile's WalletHeader simply ignores them.
