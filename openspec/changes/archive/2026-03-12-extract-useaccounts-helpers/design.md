## Context

`useAccounts.ts` (1,306 lines) contains two extractable code blocks:
1. `runUpgrades()` (lines 388-589): A legacy v2→v3 migration that runs once on mount. It uses helper functions `invertBy()` and `getNetworks()` that are only needed for migration.
2. Mnemonic encryption pattern (lines 1028-1063 in `addAccount`, lines 1164-1199 in `removeAccount`): Nearly identical code that checks for cached derived key, falls back to stashed password, falls back to plain storage.

Both are pure functions that don't depend on React state — they receive all inputs as arguments and return results.

## Goals / Non-Goals

**Goals:**
- Extract `runUpgrades` and its helpers into `packages/shared/src/utils/legacy-migration.ts`
- Extract the duplicated encryption pattern into `packages/shared/src/crypto/encrypt-mnemonics.ts`
- Reduce `useAccounts.ts` by ~250 lines without changing any behavior
- Keep the hook's public API (`UseAccountsState`, `UseAccountsActions`) identical

**Non-Goals:**
- Splitting useAccounts into multiple hooks (coupling is justified)
- Changing the encryption algorithm or storage schema
- Modifying any consumer code (apps/mobile, apps/web, apps/extension)
- Adding tests (can be done separately)

## Decisions

### 1. Extract `runUpgrades` as a standalone async function

**Decision**: Create `migrateLegacyWallets()` in `utils/legacy-migration.ts` that takes callbacks for state updates and returns migration result.

**Rationale**: The migration function currently calls `setLocked()` and `setRequiredLock()` — React state setters. Rather than making it fully pure (which would require restructuring the caller), we pass the minimal state setters it needs as a callbacks parameter. This keeps the extraction mechanical and safe.

**Alternative considered**: Making it fully pure and returning a result object that the hook interprets. Rejected because it would require changing the flow control (the function does early returns that affect hook behavior).

### 2. Extract encryption as `encryptMnemonics()` utility

**Decision**: Create `encryptMnemonics(mnemonics, password?)` in `crypto/encrypt-mnemonics.ts` that handles the full encryption decision tree (cached key → stashed password → plain).

**Rationale**: The pattern is duplicated verbatim between `addAccount` and `removeAccount`. The function is pure async — it reads from stash, encrypts, and returns the result. The caller handles storage persistence.

**Alternative considered**: Inlining a smaller helper within useAccounts. Rejected because the function is self-contained and belongs with other crypto utilities.

### 3. Don't export from package barrel

**Decision**: These utilities are internal implementation details. Export from their module `index.ts` but consider them internal to `@salmon/shared`. They don't need to be in the root barrel export.

**Rationale**: `migrateLegacyWallets` is a one-time migration. `encryptMnemonics` is specific to the account encryption flow. Neither should be part of the public API.

## Risks / Trade-offs

- **[Risk] Subtle behavior difference after extraction** → Mitigation: The extraction is purely mechanical. Each extracted function receives exactly the same inputs and produces the same outputs. Manual verification of line-by-line equivalence.
- **[Risk] Import cycle between crypto/ and storage/] → Mitigation: `encryptMnemonics` imports from both `crypto/encryption` and `storage/` — this is the same import pattern already used in `useAccounts.ts`, so no new cycles are introduced.
