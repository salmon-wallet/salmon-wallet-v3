## 1. HomePage — Core wiring

- [x] 1.1 Rewrite `apps/web/src/pages/home/HomePage.tsx`: import and wire `useAccountsContext`, `useBalance`, `useAvailableNetworks`, `useUserConfig`, `useCurrencyContext`, `useRefreshOnFocus` from `@salmon/shared`. Set up local state for `activeTab` ('home'|'collectibles'|'swap'), `activeBlockchainIndex`, sheet visibility (`settingsVisible`, `walletSwitcherVisible`, `receiveSheetVisible`). Build `blockchainBalances` array from `useBalance` + `allNetworks` (same pattern as `apps/extension/src/pages/home/HomePage.tsx` lines 448-486). Render `WalletHeader`, `BalanceCardCarousel`, `ActionButtonRow`, `TokenList` from `@salmon/ui` in the home tab. Use `useNavigate` for Send→`/send`, Activity→`/activity`, Token press→`/token/{address}`. Copy styled components (Container, Main, TabBar, TabButton, TokenSection, etc.) from extension HomePage.
- [x] 1.2 Add `ReceiveSheet` overlay to HomePage: render `ReceiveSheet` from `@salmon/ui` with `visible={receiveSheetVisible}`, `address={activeBlockchainAccount?.getReceiveAddress()}`, `onClose` and `onCopy` (clipboard). Trigger from ActionButtonRow's `onReceivePress`.
- [x] 1.3 Add `WalletSwitcherSheet` overlay to HomePage: render with `accounts`, `activeAccountId`, `onSelectAccount` calling `actions.changeAccount()`, `onAddAccount` navigating to `/auth/create`. Trigger from WalletHeader's `onWalletPress`.
- [x] 1.4 Add `SettingsSheet` overlay to HomePage: render with `onNavigate` mapping SettingsScreen values to `navigate('/settings/...')` routes (same mapping as extension lines 548-561 but using router paths), `developerNetworksEnabled` from `useUserConfig`, `onRemoveWallet`/`onRemoveAllWallets` opening ConfirmDialogs. Trigger from WalletHeader's `onSettingsPress`.
- [x] 1.5 Add remove wallet ConfirmDialogs to HomePage: two `ConfirmDialog` instances for remove-current and remove-all, with `onConfirm` calling `actions.removeAccount()` / `actions.removeAllAccounts()`.

## 2. HomePage — Collectibles tab

- [x] 2.1 Create `apps/web/src/pages/home/CollectiblesTab.tsx`: replicate logic from `apps/extension/src/pages/collectibles/CollectiblesPage.tsx`. For each blockchain in `activeAccount.networksAccounts`, fetch NFTs via `account.getNfts()` (each BlockchainAccount has this method). Render one `NftCarouselSection` from `@salmon/ui` per blockchain. Pass `onNftPress` navigating to `/nft/{mint}` with NftData in location state, `onSeeAllPress` navigating to `/nft/all` with `{ blockchain, nfts, title }` in location state. Handle loading and empty states.
- [x] 2.2 Integrate CollectiblesTab into HomePage: import and render `CollectiblesTab` when `activeTab === 'collectibles'`, passing `activeAccount` and `developerNetworks`.

## 3. HomePage — Swap tab

- [x] 3.1 Create `apps/web/src/pages/home/SwapTab.tsx`: replicate logic from `apps/extension/src/pages/swap/SwapPage.tsx`. Wire `SwapScreen` from `@salmon/ui` with `useSwap()` for `onGetQuote`/`onSwap`, `useBalance().tokens` formatted as `SwapToken[]`, `useBridge()` for bridge props. Pass `onNavigateHome` that switches tab to 'home' and calls `refresh()`. Reference extension SwapPage for exact prop wiring.
- [x] 3.2 Integrate SwapTab into HomePage: import and render `SwapTab` when `activeTab === 'swap'`, passing `activeBlockchainAccount`, `networkId`, `tokens`, `refresh`.

## 4. TokenDetailRoute — Full wiring

- [x] 4.1 Rewrite `apps/web/src/pages/home/TokenDetailRoute.tsx`: use `useParams` to get `:address`, find token in `useBalance().tokens` by address. Add state for `chartData`, `chartPeriod`, `coinInfo`, `marketData`, `loading`. Fetch chart via `getMarketChart(coingeckoId, PERIOD_TO_DAYS[period], currency)` and coin info via `getCoinInfo(coingeckoId, currency)` + `coinInfoToMarketData()` (all from `@salmon/shared`). Render `TokenDetailPage` from `@salmon/ui` with all props. `onBack` navigates to `/home`. Reference extension HomePage lines 428-434 and 700-750 for the fetch pattern.

## 5. ActivityRoute — Full wiring

- [x] 5.1 Rewrite `apps/web/src/pages/home/ActivityRoute.tsx`: use `useAccountsContext` + `useTransactions` with `account` and `networkId`. Render `TransactionHistoryPage` from `@salmon/ui` with `transactions`, `loading`, `loadingMore`, `hasMore`, `onLoadMore`, `error`, `onRetry`, `hiddenBalance` (from `useBalance`). Add `selectedTransaction` state and render `TransactionDetailModal` from `@salmon/ui` when a transaction is clicked. `onBack` navigates to `/home`.

## 6. NFT routes — Full wiring

- [x] 6.1 Rewrite `apps/web/src/pages/home/NftDetailRoute.tsx`: read `NftData` from `useLocation().state`. If state is null (deep link), show fallback message with link to `/home`. Otherwise render `NftDetailPage` from `@salmon/ui` with `nft`, `onBack` (`navigate(-1)`), `onSendPress` opening `NftSendDialog`, `onBurnPress` opening burn `ConfirmDialog`. Add `NftSendDialog` and burn confirm as overlays.
- [x] 6.2 Rewrite `apps/web/src/pages/home/NftSeeAllRoute.tsx`: read `{ title, blockchain, nfts }` from `useLocation().state`. If state is null, show fallback. Otherwise render `NftSeeAllPage` from `@salmon/ui` with `onNftPress` navigating to `/nft/{mint}` with NftData in state, `onBack` (`navigate(-1)`).

## 7. SendRoute — Full wiring

- [x] 7.1 Rewrite `apps/web/src/pages/home/SendRoute.tsx`: use `useAccountsContext` + `useBalance` + `useUserConfig`. Render `SendPage` from `@salmon/ui` with `tokens` formatted as `SendToken[]`, `blockchain` from `getBlockchainFromNetworkId(networkId)`, `account` (activeBlockchainAccount), `onBack` navigating to `/home`, `onSuccess` navigating to `/home`, `showUnverifiedTokens` from `developerNetworks`.

## 8. Typecheck

- [x] 8.1 Run `pnpm turbo run typecheck --filter=@salmon/web` — fix all type errors until zero errors
- [x] 8.2 Run `pnpm --filter @salmon/web build` — production build succeeds
