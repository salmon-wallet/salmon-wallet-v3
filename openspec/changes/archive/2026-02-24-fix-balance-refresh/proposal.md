## Why

The wallet balance does not update reliably after user actions or platform events. Three issues exist: (1) the extension never calls `refresh()` after a successful send — users see stale balances until the 60s cache expires, (2) neither mobile nor extension refresh balance when the app regains focus (returning from background or switching tabs), and (3) the extension has no manual refresh mechanism at all (mobile has pull-to-refresh, extension has nothing).

## What Changes

- **Fix extension post-send refresh (CRITICAL):** `handleSendBack` in `HomePage.tsx` only navigates to `'home'` without calling `refresh()`. Create a dedicated `handleSendSuccess` that calls `refresh()` before navigating, matching mobile's existing behavior.
- **Add app-focus balance refresh (MEDIUM):** Create a shared `useRefreshOnFocus` hook in `packages/shared/src/hooks/` that accepts a `refresh` callback. On mobile, it listens to React Native `AppState` changes (background → active). On extension, it listens to `document.visibilitychange` (hidden → visible). Both trigger `refresh()` only if the balance cache TTL (60s) has elapsed since last update.
- **Add refresh button to extension header (LOW):** Add a `RefreshIcon` button to the `WalletHeader` extension component, positioned next to the existing settings button. Wire it to `refresh()` from `useBalance`. Include a spin animation while `refreshing` is true.

## Capabilities

### New Capabilities
- `balance-refresh-on-focus`: Shared hook that triggers balance refresh when the app regains focus, with platform-specific focus detection (AppState for mobile, visibilitychange for extension) and cache-aware throttling.

### Modified Capabilities
_(none — no existing spec-level requirements are changing, these are implementation fixes and new UI affordances)_

## Impact

- **packages/shared/src/hooks/**: New `useRefreshOnFocus` hook (with `.native.ts` / `.web.ts` platform files for focus detection)
- **packages/shared/src/types/ui/wallet-header.ts**: Add optional `onRefreshPress` and `refreshing` props to `WalletHeaderPropsBase`
- **apps/extension/src/pages/home/HomePage.tsx**: Fix `handleSendSuccess`, wire refresh button and focus hook
- **apps/extension/src/components/WalletHeader/WalletHeader.tsx**: Add refresh button next to settings
- **apps/mobile/app/(app)/(tabs)/index.tsx**: Wire focus hook to existing `refresh()` callback
- **No API changes, no new dependencies** — uses existing platform APIs (`AppState` from react-native, `document.visibilitychange` from DOM)
