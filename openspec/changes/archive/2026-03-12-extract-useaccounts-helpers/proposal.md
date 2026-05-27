## Why

`useAccounts` is a 1,306-line hook that mixes legacy migration, encryption helpers, and account CRUD. While the coupling is justified, two specific areas have concrete code duplication and unnecessary size: (1) `runUpgrades()` is a 200-line legacy migration that runs once at startup and could live as a standalone utility, and (2) the encryption pattern in `addAccount` and `removeAccount` is nearly identical (~35 lines each) and should be a shared helper.

## What Changes

- Extract `runUpgrades()` (lines 388-589) and its helpers (`invertBy`, `getNetworks`) into `packages/shared/src/utils/legacy-migration.ts`
- Extract the duplicated mnemonic encryption pattern from `addAccount` (lines 1028-1063) and `removeAccount` (lines 1164-1199) into `packages/shared/src/crypto/encrypt-mnemonics.ts`
- Update `useAccounts.ts` to import and call these extracted functions
- No changes to the hook's public API (`UseAccountsState`, `UseAccountsActions`)
- No changes to any consumers

## Capabilities

### New Capabilities

- `legacy-migration-util`: Standalone utility for migrating v2 wallet data to v3 format, extracted from useAccounts hook
- `mnemonic-encryption-helper`: Shared helper for encrypting/re-encrypting mnemonic collections with cached key support

### Modified Capabilities

_(none — no spec-level behavior changes, only internal refactoring)_

## Impact

- **Affected code**: `packages/shared/src/hooks/useAccounts.ts`, new files in `packages/shared/src/utils/` and `packages/shared/src/crypto/`
- **Barrel exports**: New functions added to `packages/shared/src/utils/index.ts` and `packages/shared/src/crypto/index.ts` (though they may remain internal-only)
- **Risk**: Low — pure extraction with no API changes. The hook's return type and behavior remain identical.
- **Apps affected**: None — no consumer changes required
