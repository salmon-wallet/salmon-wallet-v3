## 1. Extract mnemonic encryption helper

- [ ] 1.1 Create `packages/shared/src/crypto/encrypt-mnemonics.ts` with `encryptMnemonics()` function that handles the full encryption decision tree (cached key → stashed password → plain). Return type: `{ vault: LockedVault & { isEncrypted: true } | Record<string, string>, requiredLock: boolean }`. Include stash read/write for derived key and password.
- [ ] 1.2 Export `encryptMnemonics` from `packages/shared/src/crypto/index.ts` barrel (if exists) or ensure it's importable.
- [ ] 1.3 Replace duplicated encryption logic in `addAccount` (lines 1028-1063) with call to `encryptMnemonics(newMnemonics, password)`, using `result.vault` for storage and `result.requiredLock` for state.
- [ ] 1.4 Replace duplicated encryption logic in `removeAccount` (lines 1164-1199) with call to `encryptMnemonics(newMnemonics, password)`, using same pattern.

## 2. Extract legacy migration utility

- [ ] 2.1 Create `packages/shared/src/utils/legacy-migration.ts` with `migrateLegacyWallets()` function. Move `invertBy()` and `getNetworks()` as non-exported helpers. The function accepts `callbacks: { setLocked, setRequiredLock }` and optional `password?: string`, returns `Promise<boolean>`.
- [ ] 2.2 Move the `LegacyWallets` interface and all migration logic (lines 388-589 of useAccounts.ts) into the new file. Ensure all imports (`restoreAccount`, `formatAccountForStorage`, `getPathIndex`, storage, crypto) are resolved.
- [ ] 2.3 Replace `runUpgrades` useCallback in `useAccounts.ts` with a thin wrapper that calls `migrateLegacyWallets()` and applies returned state.

## 3. Verify equivalence

- [ ] 3.1 Run typecheck: `pnpm turbo run typecheck --filter=@salmon/shared`
- [ ] 3.2 Verify `useAccounts` hook return type is unchanged — no modifications to `UseAccountsState` or `UseAccountsActions` interfaces.
