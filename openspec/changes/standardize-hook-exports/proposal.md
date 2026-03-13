## Why

The `packages/shared` hooks have accumulated inconsistencies over multiple refactoring rounds: residual default exports (violating the named-export-only convention), backward-compatibility type re-exports that create ambiguous canonical locations, mixed `Params`/`Options` naming for hook input types, and one layout component that missed the types-extraction refactoring. These inconsistencies make the codebase harder to navigate and create confusion about where types should be imported from.

## What Changes

- **Remove default exports** from `useRuntime` (3 platform files) and `useRefreshOnFocus` (3 platform files). No consumers use the default import form.
- **Remove backward-compatibility type re-exports** from 9 hooks (`useBalance`, `useSwap`, `useBridge`, `useUserConfig`, `useSendTransaction`, `useAvailableNetworks`, `useTokenSearch`, `useAddressValidation`, `useMultiChainTokens`). All re-exported types are already available via their canonical `types/` barrel exports.
- **Standardize hook input type naming** from `Use*Options` to `Use*Params` in 5 hooks (`useBalance`, `useToken`, `useInactivityTimeout`, `useTransactions`, `useRefreshOnFocus`). `Params` is used by 11 hooks (majority); `Options` by 5.
- **Extract `WalletLayoutProps`** from `WalletLayout.tsx` to a `types.ts` file, matching the pattern applied to all `packages/ui/src/components/` directories.

## Capabilities

### New Capabilities

_None — this is a consistency refactoring with no new behavior._

### Modified Capabilities

- `shared-ui-package`: Export conventions are being tightened (no default exports, no duplicate re-exports, standardized naming).

## Impact

- **`packages/shared`**: 15 hook files modified (6 for default exports, 9 for re-exports, 5 for naming). Hook barrel `index.ts` updated for renamed types.
- **`packages/ui`**: `WalletLayout.tsx` split into component + `types.ts`. `layouts/index.ts` updated.
- **`apps/mobile`**, **`apps/extension`**, **`apps/web`**: Any imports of renamed types (`UseBalanceOptions` → `UseBalanceParams`, etc.) must be updated. All type imports from `@salmon/shared` barrel remain valid.
- **No runtime behavior changes.** Purely type-level and export-structure refactoring.
