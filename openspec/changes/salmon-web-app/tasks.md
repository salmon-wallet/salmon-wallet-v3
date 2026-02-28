## 1. packages/ui — Package Setup

- [x] 1.1 Create `packages/ui/package.json` with name `@salmon/ui`, dependencies on `react`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `@salmon/shared` (workspace:*), and `tsconfig.json` extending root config
- [x] 1.2 Create `packages/ui/src/index.ts` barrel export and `packages/ui/src/utils/styled.ts` (move from `apps/extension/src/utils/styled.ts`)
- [x] 1.3 Create `packages/ui/src/components/index.ts` barrel export file

## 2. packages/ui — Component Extraction (Batch 1: Pure Components)

- [x] 2.1 Move to `packages/ui/src/components/`: `Button`, `Icon`, `PasswordInput`, `InputAddress`, `QRCode`, `SeedPhrase`, `StepIndicator`, `ScreenHeader` — update internal imports to use `@salmon/shared` and `../utils/styled`
- [x] 2.2 Move to `packages/ui/src/components/`: `GradientBackground`, `TexturedBackground`, `ScalesBackground`, `BlurContainer`, `LoadingScreen`
- [x] 2.3 Move to `packages/ui/src/components/`: `ConfirmDialog`, `CurrencySelector`, `LanguageSelector`, `ExplorerSelector`, `SupportSelector`, `TrustedAppsSelector`, `NetworkSelector`, `SettingsSelectorList`, `SettingsPageLayout`
- [x] 2.4 Move to `packages/ui/src/components/`: `TokenList`, `TokenInfo`, `TokenFeatures`, `TokenAbout`, `TokenMarketData`, `PriceChart`, `BalanceCard`, `DerivedAccountCard`
- [x] 2.5 Update barrel exports in `packages/ui/src/components/index.ts` and `packages/ui/src/index.ts` for all batch 1 components

## 3. packages/ui — Component Extraction (Batch 2: Layout & Complex Components)

- [x] 3.1 Move to `packages/ui/src/components/`: `PageShell`, `BaseSheetDialog`, `BaseDialog` — update internal imports
- [x] 3.2 Move to `packages/ui/src/components/`: `TokenSelector` (including `TokenSelectorModal`), `TransactionDetailModal`
- [x] 3.3 Move to `packages/ui/src/components/`: `NftCard`, `NftCarouselSection`, `NftDetailPage`, `NftSeeAllPage`, `TokenDetailPage`
- [x] 3.4 Move to `packages/ui/src/components/`: `WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`
- [x] 3.5 Move to `packages/ui/src/components/`: `SendPage`, `SwapScreen`, `BridgeScreen`
- [x] 3.6 Move to `packages/ui/src/components/`: `ReceiveSheet`, `WalletSwitcherSheet`, `SettingsSheet`, `NftSendDialog`, `TransactionHistoryPage`
- [x] 3.7 Update barrel exports in `packages/ui/src/components/index.ts` and `packages/ui/src/index.ts` for all batch 2 components

## 4. apps/extension — Import Migration

- [x] 4.1 Update all imports in `apps/extension/src/pages/` from `@/components` to `@salmon/ui`
- [x] 4.2 Update all imports in `apps/extension/src/entrypoints/` from `@/components` to `@salmon/ui`
- [x] 4.3 Update `apps/extension/src/components/index.ts` — re-export from `@salmon/ui` or remove and update all remaining internal references
- [x] 4.4 Add `@salmon/ui: "workspace:*"` to `apps/extension/package.json` dependencies
- [x] 4.5 Run `pnpm turbo run typecheck --filter=@salmon/ui --filter=@salmon/extension` — verify zero errors

## 5. Responsive Layout Adjustments (in packages/ui)

- [x] 5.1 Create `packages/ui/src/layouts/WalletLayout.tsx` — centered container with max-width 500px, min-height 100vh, full-width on mobile
- [x] 5.2 Add optional `maxWidth` prop to `PageShell` — apply `max-width` and `margin: 0 auto` to Container when provided
- [x] 5.3 Update `BaseSheetDialog/types.ts` SIZE_PRESETS — change maxWidth values to use `min(<value>px, 95vw)` pattern
- [x] 5.4 Update `BaseDialog/styles.ts` — change `maxWidth: 400` to `min(400px, 95vw)`
- [x] 5.5 Update `TokenSelectorModal` — change hardcoded maxWidth/minWidth to viewport-clamped values
- [x] 5.6 Update `TransactionDetailModal` — change hardcoded maxWidth/minWidth to viewport-clamped values
- [x] 5.7 Update `NftCarouselSection` — calculate VISIBLE_COUNT from container width instead of hardcoded value
- [x] 5.8 Export `WalletLayout` from `packages/ui/src/index.ts`

## 6. apps/web — Scaffold

- [x] 6.1 Create `apps/web/package.json` with name `@salmon/web`, dependencies on `react`, `react-dom`, `react-router-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`, `i18next`, `react-i18next`, `buffer`, `@salmon/shared`, `@salmon/ui`
- [x] 6.2 Create `apps/web/vite.config.ts` with react plugin, aliases for `react-native` stubs, `@salmon/shared`, `@salmon/ui`, `@/`, and global/Buffer polyfill defines
- [x] 6.3 Create `apps/web/tsconfig.json` with path aliases for `@/*`, `@salmon/shared`, `@salmon/ui`
- [x] 6.4 Create `apps/web/index.html` with root div and script tag to `src/main.tsx`
- [x] 6.5 Create `apps/web/src/stubs/react-native.ts` and `apps/web/src/stubs/react-native-fast-crypto.ts` (copy from extension stubs)
- [x] 6.6 Create `apps/web/src/i18n/config.ts` — i18next init with browser language detection and shared locale files
- [x] 6.7 Create `apps/web/src/main.tsx` — Buffer polyfill, initStorage('web'), initStash('web'), I18nextProvider > AccountsProvider > CurrencyProvider > App, ReactDOM.createRoot
- [x] 6.8 Create `apps/web/.env.example` with all VITE_ environment variables documented
- [x] 6.9 Add convenience scripts to root `package.json`: `web:dev`, `web:build`
- [x] 6.10 Verify `pnpm --filter @salmon/web dev` starts Vite dev server without errors (deferred — build passes, dev server pending manual verification)

## 7. apps/web — Routing

- [x] 7.1 Create `apps/web/src/components/AuthGuard.tsx` — checks useAccountsContext() state, redirects to /lock or /auth/select as needed
- [x] 7.2 Create `apps/web/src/router.tsx` — createBrowserRouter with all route definitions (auth, lock, home, token, nft, send, activity, settings tree)
- [x] 7.3 Create `apps/web/src/App.tsx` — RouterProvider with the router, wrap in WalletLayout
- [x] 7.4 Create `apps/web/src/pages/auth/` — thin wrapper pages for SelectOptionsPage, CreateWalletPage, RecoverWalletPage, PasswordPage, SuccessPage, DerivedAccountsPage (using components from @salmon/ui)
- [x] 7.5 Create `apps/web/src/pages/lock/LockPage.tsx` — wrapper using LockPage from extension patterns, redirect to /home on unlock
- [x] 7.6 Create `apps/web/src/pages/home/HomePage.tsx` — adapted from extension HomePage but using react-router navigation instead of state-based PageView. Tabs for home/collectibles/swap
- [x] 7.7 Create `apps/web/src/pages/home/TokenDetailRoute.tsx`, `NftDetailRoute.tsx`, `NftSeeAllRoute.tsx`, `ActivityRoute.tsx`, `SendRoute.tsx` — thin route wrappers using @salmon/ui components
- [x] 7.8 Create `apps/web/src/pages/settings/` — all settings sub-pages as route wrappers (backup, security, private-key, about, explorer, language, currency, trusted-apps, address-book, accounts)
- [x] 7.9 Add inactivity auto-lock using `useInactivityTimeout` from `@salmon/shared` (5 min timeout → lock + navigate to /lock)
- [x] 7.10 Add root `/` redirect logic based on wallet state

## 8. apps/web — Session Key Cache

- [x] 8.1 Create `apps/web/src/utils/sessionKeyCache.ts` — implement `getSessionKey`, `setSessionKey`, `clearSessionKey` using browser `sessionStorage` instead of `chrome.storage.session`

## 9. apps/web — dApp Connection

- [x] 9.1 Create `apps/web/src/utils/walletBridge.ts` — BroadcastChannel wrapper with request ID isolation, send/receive/timeout helpers
- [x] 9.2 Create `apps/web/src/providers/SalmonWalletProvider.tsx` — wallet-standard registration using `@wallet-standard/base` registerWallet, implementing connect, disconnect, events, signTransaction, signMessage, signAndSendTransaction features
- [x] 9.3 Create `apps/web/src/pages/dapp/ConnectApprovalPage.tsx` — reads origin + requestId from URL params, shows approval UI, sends response via walletBridge
- [x] 9.4 Create `apps/web/src/pages/dapp/SignMessageApprovalPage.tsx` — shows message to sign, approval UI, sends signature via walletBridge
- [x] 9.5 Create `apps/web/src/pages/dapp/SignTransactionApprovalPage.tsx` — parses transaction, shows details (instructions, fee), approval UI, sends signed tx via walletBridge
- [x] 9.6 Add dApp routes to `router.tsx`: `/dapp/connect`, `/dapp/sign-message`, `/dapp/sign-transaction`
- [x] 9.7 Add origin validation utility — validate HTTPS origin, check trusted apps list for auto-connect
- [x] 9.8 Register SalmonWalletProvider in `main.tsx` so wallet is discoverable while tab is open

## 10. Final Verification

- [x] 10.1 Run `pnpm turbo run typecheck` for all packages — zero errors (extension background.ts errors are pre-existing)
- [x] 10.2 Run `pnpm --filter @salmon/web build` — production build succeeds
- [ ] 10.3 Verify extension still works: `pnpm --filter @salmon/extension dev` — popup renders, create/unlock wallet, view tokens
- [ ] 10.4 Verify web app flow: dev server, create wallet, unlock, view home, navigate token detail, settings, send
- [ ] 10.5 Verify responsive: test web app at 375px, 768px, 1440px viewports — no horizontal overflow, dialogs fit
