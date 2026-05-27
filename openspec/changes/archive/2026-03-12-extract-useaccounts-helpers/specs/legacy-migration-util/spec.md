## ADDED Requirements

### Requirement: Legacy wallet migration utility

The system SHALL provide a `migrateLegacyWallets()` function in `packages/shared/src/utils/legacy-migration.ts` that migrates v2 wallet storage format to v3 format. The function SHALL accept a callbacks parameter for React state updates (`setLocked`, `setRequiredLock`) and an optional password. It SHALL return `true` if migration succeeded or no migration was needed, `false` if password is required but not provided.

#### Scenario: No legacy data exists
- **WHEN** `migrateLegacyWallets` is called and no `STORAGE_KEYS.WALLETS` data exists in storage
- **THEN** the function SHALL return `true` without modifying any storage keys

#### Scenario: Legacy data with password protection
- **WHEN** legacy wallet data exists with `passwordRequired: true` and no password is provided
- **THEN** the function SHALL call `callbacks.setLocked(true)` and return `false`

#### Scenario: Successful migration with password
- **WHEN** legacy wallet data exists with `passwordRequired: true` and a valid password is provided
- **THEN** the function SHALL decrypt mnemonics, create v3 account structures, encrypt mnemonics with the password, persist all v3 storage keys, remove legacy storage keys (`WALLETS`, `ACTIVE`, `ENDPOINTS`), and return `true`

#### Scenario: Successful migration without password
- **WHEN** legacy wallet data exists without password protection
- **THEN** the function SHALL create v3 account structures, persist mnemonics in plain format, persist all v3 storage keys, remove legacy storage keys, and return `true`

### Requirement: Helper functions are co-located

The `invertBy()` and `getNetworks()` helper functions currently defined inside `useAccounts.ts` SHALL be moved into the same `legacy-migration.ts` file as private (non-exported) helpers.

#### Scenario: Helpers not exported
- **WHEN** a consumer imports from `legacy-migration.ts`
- **THEN** only `migrateLegacyWallets` SHALL be available; `invertBy` and `getNetworks` SHALL not be exported
