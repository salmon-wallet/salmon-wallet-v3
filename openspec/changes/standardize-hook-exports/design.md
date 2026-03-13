## Context

After multiple refactoring rounds, `packages/shared` hooks have accumulated 4 categories of inconsistency:
1. **6 files** with residual `export default` (useRuntime x3 platforms, useRefreshOnFocus x3 platforms)
2. **9 hooks** with `// Re-export for backward compatibility` type re-exports that duplicate types already exported via `types/` barrel
3. **5 hooks** using `Use*Options` while 11 use `Use*Params` for the same concept
4. **1 layout** (`WalletLayout`) with inline types instead of extracted `types.ts`

All types flow through the `@salmon/shared` barrel via `types/index.ts`, so removing hook-level re-exports won't break external consumers. No consumer uses default imports.

## Goals / Non-Goals

**Goals:**
- Eliminate all `export default` from hooks (named-export-only codebase)
- Remove all backward-compatibility re-exports from hooks (single canonical export path per type)
- Standardize hook input type naming to `Use*Params` (majority convention)
- Extract `WalletLayoutProps` to `types.ts` (consistency with all `packages/ui` components)

**Non-Goals:**
- Standardizing hook return type patterns (tuple vs object) — `useAccounts` tuple pattern is intentional for context consumption
- Standardizing loading state patterns (boolean vs enum) — each hook has valid reasons for its pattern
- Refactoring hook internals or behavior
- Touching test files beyond updating type import paths

## Decisions

### 1. Remove default exports (not deprecate)
Direct removal since grep confirms zero consumers use `import useRuntime from` or `import useRefreshOnFocus from`. The JSDoc comments referencing default imports will be updated.

### 2. Remove backward-compat re-exports without aliases
All 9 hooks re-export types that already exist in `types/` → `types/index.ts` → `shared/index.ts`. Consumers import from `@salmon/shared` barrel, which serves both paths. Removing the hook-level re-exports has zero impact on barrel consumers.

Affected hooks and their re-exports:
- `useBalance`: `BlockchainAccount`, `NetworkId`
- `useSwap`: `SwapStatus`, `GetQuoteParams`, `ParsedQuoteInfo`
- `useBridge`: `BridgeOperationStatus`, `BridgeEstimate`
- `useUserConfig`: `UserConfig`, `ActiveBlockchainAccount`
- `useSendTransaction`: `SendTokenInfo`, `SendTransactionParams`, `FeeEstimateResult`, `SendTransactionStatus`
- `useAvailableNetworks`: `AnyNetwork`, `NetworksByBlockchain`
- `useTokenSearch`: `TokenSelectorToken`, `UseTokenSearchResult`
- `useAddressValidation`: `ValidationState`, `ValidationCallbackResult`
- `useMultiChainTokens`: `ChainType`, `UnifiedToken`, plus function re-exports `getChainFromNetworkId`, `isSameChain`

### 3. Standardize to `Params` (not `Options`)
`Params` is used by 11 hooks vs 5 for `Options`. No semantic distinction exists between the two. Renaming:
- `UseBalanceOptions` → `UseBalanceParams`
- `UseTokenOptions` → `UseTokenParams`
- `UseInactivityTimeoutOptions` → `UseInactivityTimeoutParams`
- `UseTransactionsOptions` → `UseTransactionsParams`
- `UseRefreshOnFocusOptions` → `UseRefreshOnFocusParams`

All consumers importing these types from `@salmon/shared` must be updated. The hooks barrel `index.ts` must reflect the new names.

### 4. WalletLayout types extraction follows existing component pattern
Extract `WalletLayoutProps` to `packages/ui/src/layouts/types.ts`, import in component file, update `index.ts` to re-export from `./types`.

## Risks / Trade-offs

- **[Risk] Internal test files import renamed types** → Mitigation: Update test imports in same PR. Only `useUserConfig.test.ts` and `useAvailableNetworks.test.ts` import `ActiveBlockchainAccount` from hook files.
- **[Risk] `useMultiChainTokens` re-exports functions, not just types** → Mitigation: Verify `getChainFromNetworkId` and `isSameChain` are exported from their canonical location in `utils/` before removing.
- **[Risk] Rename breakage across apps** → Mitigation: Run `pnpm turbo run typecheck` after changes to catch all breakages.
