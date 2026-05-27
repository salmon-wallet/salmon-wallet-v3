## Context

Salmon Wallet v3 has a complete backend layer for multi-account management but the UI pages are stubs. The core hook `useAccounts()` already exposes `addAccount`, `editAccount`, `removeAccount`, `changeAccount`, and `checkPassword` actions. Account types (`Account`, `StoredAccount`, `EditAccountParams`, `RestoreAccountOptions`), mnemonic derivation (`crypto/mnemonic.ts`), BIP-44 gap scanning (`utils/derived-accounts.ts`), and password encryption (`crypto/encryption.ts`) are all implemented in `packages/shared`.

The extension has `AccountsPage`, `AccountEditPage`, `AccountNamePage`, and `SecurityPage` as stub files in `apps/extension/src/pages/settings/`. Mobile has `account-edit.tsx` and `security.tsx` as stubs in `apps/mobile/app/(app)/(tabs)/settings/`. Mobile is missing dedicated routes for account-list and account-name.

An `EditAccountDialog` exists in extension for inline name editing — this will be consolidated into the new `AccountEditPage` to avoid two code paths for the same action.

## Goals / Non-Goals

**Goals:**
- Implement all account management UI pages on both platforms with feature parity
- Reuse 100% of existing shared logic — no new hooks or utils unless proven absent
- Add a `changePassword` action to `useAccounts` (the only missing shared logic)
- Consolidate the extension's `EditAccountDialog` into `AccountEditPage`
- Add all new i18n keys to both `en` and `es` translation files

**Non-Goals:**
- Refactoring blockchain code toward chain-agnostic patterns (separate change)
- Adding derivation path index selector (v2 feature, deferred to separate change)
- Implementing tests for the new pages
- Changing the state management approach (Context stays)

## Decisions

### Decision 1: No new shared hook — extend `useAccounts` with `changePassword`

**Choice:** Add a `changePassword(oldPassword, newPassword)` action to the existing `useAccounts` hook.

**Why not a new `useAccountManagement` hook:** All CRUD actions already live in `useAccounts`. Adding a separate hook would split the API surface and create confusion about which hook to call. The password change operation needs direct access to the encrypted vault and stash keys that `useAccounts` already manages.

**Implementation:** Use the existing `unlockAndGetKey()` → `lockWithKey()` pattern from `crypto/encryption.ts`. Decrypt with old password, re-encrypt with new password, update storage, clear old cached key.

**Alternative considered:** A standalone `changePassword` utility function — rejected because it needs to update internal hook state (cached password in stash, derived key cache) which is only accessible inside `useAccounts`.

### Decision 2: Reuse existing code — no duplicates

**Existing code to reuse directly:**

| What | File | Used for |
|------|------|----------|
| `changeAccount(targetId)` | `hooks/useAccounts.ts` | Switch active account |
| `editAccount(targetId, params)` | `hooks/useAccounts.ts` | Save name/avatar changes |
| `removeAccount(targetId)` | `hooks/useAccounts.ts` | Delete account |
| `addAccount(account, password?)` | `hooks/useAccounts.ts` | Add derived/imported account |
| `checkPassword(password)` | `hooks/useAccounts.ts` | Verify current password |
| `validatePassword(password)` | `crypto/password.ts` | New password strength validation |
| `validateMnemonic(mnemonic)` | `crypto/mnemonic.ts` | Import seed phrase validation |
| `normalizeMnemonic(phrase)` | `crypto/mnemonic.ts` | Clean up user input |
| `scanDerivedAccounts(...)` | `utils/derived-accounts.ts` | Derive + scan balances |
| `getShortAddress(address)` | `utils/address.ts` | Truncate address display |
| `getRandomAvatar()` | `utils/avatar.ts` | Default avatar for new accounts |
| `Account`, `StoredAccount` | `types/account.ts` | Account data model |
| `EditAccountParams` | `types/account.ts` | Edit action params |
| `RestoreAccountOptions` | `types/account.ts` | Import account params |
| `DerivedAccountInfo` | `utils/derived-accounts.ts` | Scan results type |
| `PasswordInput` component | Both apps' `src/components/` | Password fields |
| `SeedPhrase` component | Both apps' `src/components/` | Mnemonic input |
| `DerivedAccountCard` component | Both apps' `src/components/` | Scan results display |
| `useBiometricAuth` hook | `apps/mobile/hooks/` | Biometric toggle (mobile only) |
| `WalletSwitcherSheetPropsBase` | `types/ui/wallet-switcher-sheet.ts` | Pattern for new UI prop types |

**Code that does NOT exist and must be created:**

| What | Location | Why it's new |
|------|----------|-------------|
| `changePassword` action | `packages/shared/src/hooks/useAccounts.ts` | No password change flow existed in v3 |
| `AccountsPagePropsBase` | `packages/shared/src/types/ui/accounts-page.ts` | New page, no existing type |
| `AccountEditPagePropsBase` | `packages/shared/src/types/ui/account-edit-page.ts` | New page, no existing type |
| `AccountAddPropsBase` | `packages/shared/src/types/ui/account-add.ts` | New flow, no existing type |
| `SecurityPagePropsBase` | `packages/shared/src/types/ui/security-page.ts` | New page, no existing type |
| i18n keys | `packages/shared/src/locales/{en,es}/translation.json` | New UI strings |

### Decision 3: Settings page layout pattern

**Mobile:** Each new page uses the existing Expo Router stack in `apps/mobile/app/(app)/(tabs)/settings/`. New routes:
- `settings/accounts.tsx` — AccountsPage (new file)
- `settings/account-edit.tsx` — AccountEditPage (replace stub)
- `settings/account-name.tsx` — AccountNamePage (new file)
- `settings/account-add.tsx` — AccountAddPage (new file)
- `settings/security.tsx` — SecurityPage (replace stub)

Components live in `apps/mobile/src/components/` with PascalCase directories and barrel exports.

**Extension:** Replace stub implementations in `apps/extension/src/pages/settings/`. Components in `apps/extension/src/components/`. Use `PageShell` wrapper (existing) for consistent layout with back navigation. Use `SettingsSelectorList` pattern (existing) for list items with icons and chevrons.

### Decision 4: AccountsPage reuses AccountListItem pattern from WalletSwitcherSheet

**Choice:** The AccountsPage list item mirrors the existing `AccountListItem` from `WalletSwitcherSheet` — avatar, name, truncated address, edit/delete actions. The shared base type `AccountListItemPropsBase` already exists in `types/ui/wallet-switcher-sheet.ts`.

**Why not a completely new list item:** The visual pattern is identical. Reusing the same prop contract keeps both surfaces consistent. If the component implementation can be extracted to avoid literal code duplication within each app, do so (e.g., `AccountListItem/` component directory). Otherwise, two lean implementations consuming the same props base is acceptable given the StyleSheet vs MUI difference.

### Decision 5: Add account flow as multi-step within a single page

**Choice:** The add-account flow is a single page with step state (`'select-method' | 'import-seed' | 'derive-scan' | 'set-name' | 'complete'`), following the existing `SendPage`/`SwapScreen` multi-step pattern.

**Why not separate pages per step:** The flow is short (2-3 steps) and self-contained. A single page with step state avoids creating 3-4 route files and keeps navigation simple. Both `SendPage` (extension) and `SwapScreen` (both) already use this pattern successfully.

### Decision 6: Consolidate EditAccountDialog into AccountEditPage

**Choice:** Remove `EditAccountDialog` from extension and route all name editing through `AccountEditPage` → name section. The `WalletSwitcherSheet`'s `onEditAccount` callback navigates to `AccountEditPage` instead of opening the dialog.

**Why:** Two paths for the same action (rename) creates maintenance burden and inconsistency. The `AccountEditPage` provides a richer experience (name + avatar + backup + key export) than the dialog.

### Decision 7: Password change re-encryption strategy

**Choice:** `changePassword` decrypts the mnemonic vault with the old password, re-encrypts with the new password, and writes the new vault atomically. It also clears the stash-cached password and derived key, then re-caches the new ones.

**Implementation steps inside `useAccounts`:**
1. `checkPassword(oldPassword)` — verify old password
2. `unlockAndGetKey(vault, oldPassword)` — decrypt + get old key
3. `lock(mnemonics, newPassword)` — re-encrypt with new password
4. Write new vault to `STORAGE_KEYS.MNEMONICS`
5. Update stash: `STASH_KEYS.PASSWORD` = newPassword, clear `STASH_KEYS.DERIVED_KEY`
6. If biometric enabled (mobile): re-cache new derived key via `storeKeyForBiometric()`

**Why not unlock-then-lock with cached key:** The new password needs its own fresh salt and PBKDF2 derivation. Using `lock()` with the new password ensures independent cryptographic material.

### Decision 8: Biometric re-enrollment after password change

**Choice:** On mobile, after a successful password change, if biometric was enabled, automatically re-store the new derived key via `storeKeyForBiometric()`. The user does not need to re-enroll manually.

**Why:** Changing password invalidates the old cached derived key. If we don't update it, biometric unlock silently fails on next app open, which is confusing.

## Risks / Trade-offs

**[Risk] Password change fails mid-operation** → The old vault is only overwritten after the new vault is successfully encrypted. If encryption fails, the old vault remains intact. The operation is effectively atomic at the storage write level.

**[Risk] EditAccountDialog removal breaks existing navigation** → Audit all references to `EditAccountDialog` in extension before removing. The `HomePage` and `WalletSwitcherSheet` are the only consumers — both will be rewired to navigate to `AccountEditPage`.

**[Risk] Mobile route additions require settings layout awareness** → The Expo Router stack layout at `settings/_layout.tsx` is minimal (`<Stack />`). New routes are automatically picked up. No layout changes needed.

**[Risk] Biometric key invalidation on password change** → Mitigated by Decision 8 (auto re-enrollment). If `storeKeyForBiometric()` fails after password change, biometric is silently disabled rather than leaving stale keys.

**[Trade-off] Two UI implementations per page (mobile + extension)** → Necessary due to StyleSheet vs MUI incompatibility. Mitigated by sharing prop types, hooks, and all business logic from `@salmon/shared`.

## Open Questions

- Should the "Add Account" flow support importing a private key directly (not just seed phrases)? Deferred — can be added later as a new method option.
- Should there be a maximum number of accounts? Currently no limit enforced. Monitor for performance with many accounts.
