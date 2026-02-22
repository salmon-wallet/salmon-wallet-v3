## 1. Search & Reuse Audit

- [x] 1.1 Verify `SwapToken`, `TokenMetadata`, `UnifiedToken` types are exported from `@salmon/shared` (needed by `mapToSwapToken`, `unifiedToSwapToken`)
- [x] 1.2 Verify `TokenFeature` type is exported from `@salmon/shared` (needed by `getFeatureColor`)
- [x] 1.3 Verify `PriceDataPoint` type is exported from `@salmon/shared` (needed by `isPositivePerformance`)
- [x] 1.4 Verify `Account` type is exported from `@salmon/shared` (needed by `getAccountAddress`)
- [x] 1.5 Verify `BlockchainId` type is exported from `@salmon/shared` (needed by `getNetworkLabel`, `getScalesColorForBlockchain`)
- [x] 1.6 Verify `getShortAddress` is exported from `@salmon/shared` (used internally by `getTransactionDescription`)
- [x] 1.7 Verify `getBlockchainFromNetworkId` is exported from `@salmon/shared` (needed for Decision 5 fix)

## 2. Shared — Create Utility Functions

- [x] 2.1 In `packages/shared/src/utils/account.ts`: add `getAccountAddress(account: Account): string | undefined` — returns primary receive address (mainnet first, fallback to any network)
- [x] 2.2 In `packages/shared/src/utils/network.ts`: add `getNetworkLabel(blockchain: BlockchainId): string | null` — maps non-mainnet blockchain IDs to "Devnet"/"Testnet"/"Sepolia"/null
- [x] 2.3 In `packages/shared/src/utils/transactions.ts`: add `getTransactionDescription(type, inputs, outputs, source?, description?): string` — human-readable tx description using `getShortAddress` internally
- [x] 2.4 In `packages/shared/src/utils/swap.ts`: add `mapToSwapToken(token: TokenMetadata, balance?: number, usdPrice?: number): SwapToken` — converts TokenMetadata to SwapToken
- [x] 2.5 In `packages/shared/src/utils/swap.ts`: add `unifiedToSwapToken(token: UnifiedToken): SwapToken` — converts UnifiedToken to SwapToken
- [x] 2.6 In `packages/shared/src/utils/formatting.ts`: add `getPriceImpactSeverity(value: string): PriceImpactSeverity` (renamed from `getSeverity`), export `PriceImpactSeverity` type and `PRICE_IMPACT_THRESHOLDS` constant
- [x] 2.7 In `packages/shared/src/utils/formatting.ts`: add `isPositivePerformance(data: PriceDataPoint[]): boolean` — returns true if last price >= first price
- [x] 2.8 In `packages/shared/src/utils/url.ts`: add `formatOrigin(origin: string): string` — extracts hostname from URL string with try/catch fallback
- [x] 2.9 In `packages/shared/src/utils/tokens.ts`: add `getFeatureColor(feature: TokenFeature, index: number): string` and export `DEFAULT_FEATURE_COLORS` constant
- [x] 2.10 In `packages/shared/src/theme/colors.ts`: add `getScalesColorForBlockchain(blockchain: BlockchainId): string` — maps blockchain to rgba overlay color (15% opacity)

## 3. Shared — Barrel Exports

- [x] 3.1 In `packages/shared/src/utils/index.ts`: add barrel exports for all new functions from tasks 2.1–2.9 (`getAccountAddress`, `getNetworkLabel`, `getTransactionDescription`, `mapToSwapToken`, `unifiedToSwapToken`, `getPriceImpactSeverity`, `PriceImpactSeverity`, `PRICE_IMPACT_THRESHOLDS`, `isPositivePerformance`, `formatOrigin`, `getFeatureColor`, `DEFAULT_FEATURE_COLORS`)
- [x] 3.2 In `packages/shared/src/theme/index.ts`: add barrel export for `getScalesColorForBlockchain` from task 2.10

## 4. Extension — Replace Local Functions with Shared Imports

- [x] 4.1 In `apps/extension/src/pages/settings/AccountsPage.tsx`: delete local `getAccountAddress`, import from `@salmon/shared`
- [x] 4.2 In `apps/extension/src/pages/swap/SwapPage.tsx`: delete local `mapToSwapToken` and `unifiedToSwapToken`, import from `@salmon/shared`
- [x] 4.3 In `apps/extension/src/components/TransactionHistoryPage/PriceImpactBadge.tsx`: delete local `getSeverity` and related constants, import `getPriceImpactSeverity` from `@salmon/shared`, update all call sites
- [x] 4.4 In `apps/extension/src/components/BalanceCard/BalanceCard.tsx`: delete local `getScalesColorForBlockchain` and `getNetworkLabel`, import from `@salmon/shared`
- [x] 4.5 In `apps/extension/src/components/TokenFeatures/TokenFeatures.tsx`: delete local `getFeatureColor` and `DEFAULT_FEATURE_COLORS`, import from `@salmon/shared`
- [x] 4.6 In `apps/extension/src/components/PriceChart/PriceChart.tsx`: delete local `isPositivePerformance`, import from `@salmon/shared`
- [x] 4.7 In `apps/extension/src/components/TransactionHistoryPage/TransactionItem.tsx`: delete local `getDescription`, import `getTransactionDescription` from `@salmon/shared`, update call sites
- [x] 4.8 In `apps/extension/src/pages/dapp/DAppConnectPage.tsx` + `DAppTransactionApprovalPage.tsx`: delete local `formatOrigin`, import from `@salmon/shared`

## 5. Mobile — Replace Local Functions with Shared Imports

- [x] 5.1 In `apps/mobile/src/components/WalletSwitcherSheet/WalletSwitcherSheet.tsx` + `AccountsPage/AccountsPage.tsx`: delete local `getAccountAddress`, import from `@salmon/shared`
- [x] 5.2 In `apps/mobile/app/(app)/(tabs)/swap.tsx`: delete local `mapToSwapToken` and `unifiedToSwapToken`, import from `@salmon/shared`
- [x] 5.3 In `apps/mobile/src/components/TransactionHistorySheet/PriceImpactBadge.tsx`: delete local `getSeverity` and related constants, import `getPriceImpactSeverity` from `@salmon/shared`, update call sites
- [x] 5.4 In `apps/mobile/src/components/BalanceCard/BalanceCard.tsx` + `BalanceCardCarousel.tsx`: delete local `getScalesColorForBlockchain` and `getNetworkLabel`, import from `@salmon/shared`
- [x] 5.5 In `apps/mobile/src/components/TokenFeatures/TokenFeatures.tsx`: delete local `getFeatureColor` and `DEFAULT_FEATURE_COLORS`, import from `@salmon/shared`
- [x] 5.6 In `apps/mobile/src/components/PriceChart/PriceChart.tsx`: delete local `isPositivePerformance`, import from `@salmon/shared`
- [x] 5.7 In `apps/mobile/src/components/TransactionHistorySheet/TransactionItem.tsx`: delete local `getDescription`, import `getTransactionDescription` from `@salmon/shared`, update call sites
- [x] 5.8 **SKIPPED** — No `formatOrigin` found in mobile (extension-only function)

## 6. Mobile — Fix Import Violation

- [x] 6.1 In `apps/mobile/app/(app)/(tabs)/index.tsx`: delete local `getBlockchainFromNetwork(network)` function, replace calls with `getBlockchainFromNetworkId(network.id)` imported from `@salmon/shared`

## 7. Verification

- [x] 7.1 Run typecheck: `pnpm turbo run typecheck`
- [x] 7.2 Run lint: `pnpm turbo run lint`
- [x] 7.3 Run build: `pnpm turbo run build`
- [x] 7.4 Fix any errors found before marking the change as complete
