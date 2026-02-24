## 1. Shared: Types & Hook Infrastructure

- [x] 1.1 Add `onRefreshPress?: () => void` and `refreshing?: boolean` props to `WalletHeaderPropsBase` in `packages/shared/src/types/ui/wallet-header.ts`
- [x] 1.2 Create `packages/shared/src/hooks/useRefreshOnFocus.ts` with shared types/interface and export the `UseRefreshOnFocusOptions` type
- [x] 1.3 Create `packages/shared/src/hooks/useRefreshOnFocus.web.ts` — listens to `document.visibilitychange`, calls `onFocus` only if `Date.now() - lastUpdated >= cacheTtl`
- [x] 1.4 Create `packages/shared/src/hooks/useRefreshOnFocus.native.ts` — listens to React Native `AppState` changes (background/inactive → active), same throttle logic
- [x] 1.5 Export `useRefreshOnFocus` from `packages/shared/src/hooks/index.ts` barrel

## 2. Extension: Fix Post-Send Balance Refresh (CRITICAL)

- [x] 2.1 Destructure `refresh` and `refreshing` from `useBalance` in `apps/extension/src/pages/home/HomePage.tsx`
- [x] 2.2 Create `handleSendSuccess` callback that calls `refresh()` then `setCurrentPage('home')`, and wire it as `onSuccess` prop on `SendPage`
- [x] 2.3 Update `NftSendDialog` `onSuccess` to also call `refresh()` before closing

## 3. Extension: Add Refresh Button to WalletHeader

- [x] 3.1 Add refresh button (using existing `RefreshIcon`) to `ActionButtons` in `apps/extension/src/components/WalletHeader/WalletHeader.tsx`, positioned left of the settings button. Show only when `onRefreshPress` is provided.
- [x] 3.2 Add CSS spin animation via `@keyframes` on the `RefreshIcon` when `refreshing` prop is true
- [x] 3.3 Pass `onRefreshPress={refresh}` and `refreshing={refreshing}` from `HomePage.tsx` to `WalletHeader`
- [x] 3.4 Add i18n key `accessibility.refresh_balance` to `en/translation.json` and `es/translation.json` for the button's aria-label

## 4. Both Platforms: Wire Focus Refresh

- [x] 4.1 Wire `useRefreshOnFocus` in `apps/extension/src/pages/home/HomePage.tsx` with `onFocus: refresh`, `lastUpdated` from `useBalance`, `enabled: !!activeBlockchainAccount`
- [x] 4.2 Wire `useRefreshOnFocus` in `apps/mobile/app/(app)/(tabs)/index.tsx` with same params, using existing `refresh` and `lastUpdated` from `useBalance`

## 5. Typecheck

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/extension --filter=@salmon/mobile` and fix any type errors
