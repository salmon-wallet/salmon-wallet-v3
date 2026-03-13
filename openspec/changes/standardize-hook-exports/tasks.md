## 1. Remove default exports

- [x] 1.1 Remove `export default useRuntime` from `useRuntime.ts`, `useRuntime.native.ts`, `useRuntime.web.ts`. Update JSDoc comments that reference default import syntax.
- [x] 1.2 Remove `export default useRefreshOnFocus` from `useRefreshOnFocus.ts`, `useRefreshOnFocus.native.ts`, `useRefreshOnFocus.web.ts`.

## 2. Remove backward-compatibility type re-exports

- [x] 2.1 Remove re-exports from `useBalance.ts` (`BlockchainAccount`, `NetworkId`)
- [x] 2.2 Remove re-exports from `useSwap.ts` (`SwapStatus`, `GetQuoteParams`, `ParsedQuoteInfo`)
- [x] 2.3 Remove re-exports from `useBridge.ts` (`BridgeOperationStatus`, `BridgeEstimate`)
- [x] 2.4 Remove re-exports from `useUserConfig.ts` (`UserConfig`, `ActiveBlockchainAccount`)
- [x] 2.5 Remove re-exports from `useSendTransaction.ts` (`SendTokenInfo`, `SendTransactionParams`, `FeeEstimateResult`, `SendTransactionStatus`)
- [x] 2.6 Remove re-exports from `useAvailableNetworks.ts` (`AnyNetwork`, `NetworksByBlockchain`)
- [x] 2.7 Remove re-exports from `useTokenSearch.ts` (`TokenSelectorToken`, `UseTokenSearchResult`)
- [x] 2.8 Remove re-exports from `useAddressValidation.ts` (`ValidationState`, `ValidationCallbackResult`)
- [x] 2.9 Remove re-exports and function re-exports from `useMultiChainTokens.ts` (`ChainType`, `UnifiedToken`, `getChainFromNetworkId`, `isSameChain`). Verify functions are exported from their canonical location in `utils/` first.
- [x] 2.10 Update test files that import types from hook files to import from canonical `types/` locations instead.

## 3. Standardize hook input type naming to Params

- [x] 3.1 Rename `UseBalanceOptions` → `UseBalanceParams` in `useBalance.ts` and all consumers
- [x] 3.2 Rename `UseTokenOptions` → `UseTokenParams` in `useToken.ts` and all consumers
- [x] 3.3 Rename `UseInactivityTimeoutOptions` → `UseInactivityTimeoutParams` in `useInactivityTimeout.ts` and all consumers
- [x] 3.4 Rename `UseTransactionsOptions` → `UseTransactionsParams` in `useTransactions.ts` and all consumers
- [x] 3.5 Rename `UseRefreshOnFocusOptions` → `UseRefreshOnFocusParams` in `useRefreshOnFocus.shared.ts`, `.ts`, `.native.ts`, `.web.ts` and all consumers
- [x] 3.6 Update `packages/shared/src/hooks/index.ts` barrel to export the renamed types

## 4. Extract WalletLayout types

- [x] 4.1 Create `packages/ui/src/layouts/types.ts` with `WalletLayoutProps` interface
- [x] 4.2 Update `WalletLayout.tsx` to import `WalletLayoutProps` from `./types`
- [x] 4.3 Update `packages/ui/src/layouts/index.ts` to re-export type from `./types`

## 5. Verification

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui` and verify zero errors
