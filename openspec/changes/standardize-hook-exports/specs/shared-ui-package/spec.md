## ADDED Requirements

### Requirement: Hooks use named exports only
All hook files in `packages/shared/src/hooks/` SHALL use named exports exclusively. No `export default` statements SHALL exist in any hook file, including platform-specific variants (`.native.ts`, `.web.ts`).

#### Scenario: No default exports in hook files
- **WHEN** searching for `export default` in `packages/shared/src/hooks/`
- **THEN** zero matches are found

#### Scenario: Named exports remain functional
- **WHEN** any app imports a hook (e.g., `import { useRuntime } from '@salmon/shared'`)
- **THEN** the import resolves correctly

### Requirement: Hook input types use Params suffix
All hook input/configuration type interfaces in `packages/shared/src/hooks/` SHALL use the `Use*Params` naming convention. The `Use*Options` naming convention SHALL NOT be used.

#### Scenario: No Options-suffixed hook input types
- **WHEN** searching for `Use*Options` interfaces in `packages/shared/src/hooks/`
- **THEN** zero matches are found (except `UseRefreshOnFocusOptions` which is defined in `.shared.ts` and renamed to `UseRefreshOnFocusParams`)

#### Scenario: Renamed types exported from barrel
- **WHEN** checking `packages/shared/src/hooks/index.ts`
- **THEN** all hook input types use the `Params` suffix (e.g., `UseBalanceParams`, `UseTokenParams`, `UseTransactionsParams`, `UseInactivityTimeoutParams`, `UseRefreshOnFocusParams`)

### Requirement: No backward-compatibility type re-exports from hooks
Hook files in `packages/shared/src/hooks/` SHALL NOT re-export domain types that are already exported from their canonical location in `packages/shared/src/types/` or `packages/shared/src/utils/`. Each type SHALL have exactly one export path through the barrel.

#### Scenario: No backward-compat comments in hook files
- **WHEN** searching for "backward compatibility" or "backwards compatibility" in `packages/shared/src/hooks/`
- **THEN** zero matches are found (excluding runtime logic comments like "Fallback for backwards compatibility")

#### Scenario: Types remain accessible from barrel
- **WHEN** importing any previously re-exported type (e.g., `BlockchainAccount`, `SwapStatus`, `ValidationState`) from `@salmon/shared`
- **THEN** the import resolves correctly via the `types/` barrel path

### Requirement: Layout components follow types extraction pattern
All layout components in `packages/ui/src/layouts/` SHALL extract their prop type interfaces to a separate `types.ts` file, consistent with the pattern used in `packages/ui/src/components/`.

#### Scenario: WalletLayout types extracted
- **WHEN** checking `packages/ui/src/layouts/`
- **THEN** `WalletLayoutProps` is defined in a `types.ts` file
- **THEN** `WalletLayout.tsx` imports `WalletLayoutProps` from `./types`
- **THEN** `index.ts` exports the type from `./types`
