## 1. Search & Reuse Audit

- [x] 1.1 Verify `changeAccount`, `editAccount`, `removeAccount`, `addAccount`, `checkPassword` actions exist in `packages/shared/src/hooks/useAccounts.ts`
- [x] 1.2 Verify `validatePassword` exists in `packages/shared/src/crypto/password.ts`
- [x] 1.3 Verify `validateMnemonic`, `normalizeMnemonic` exist in `packages/shared/src/crypto/mnemonic.ts`
- [x] 1.4 Verify `scanDerivedAccounts` and `DerivedAccountInfo` exist in `packages/shared/src/utils/derived-accounts.ts`
- [x] 1.5 Verify `getShortAddress` exists in `packages/shared/src/utils/address.ts`
- [x] 1.6 Verify `getRandomAvatar` exists in `packages/shared/src/utils/avatar.ts`
- [x] 1.7 Verify `Account`, `StoredAccount`, `EditAccountParams`, `RestoreAccountOptions` exist in `packages/shared/src/types/account.ts`
- [x] 1.8 Verify `AccountListItemPropsBase`, `WalletSwitcherSheetPropsBase` exist in `packages/shared/src/types/ui/wallet-switcher-sheet.ts`
- [x] 1.9 Verify `PasswordInput` component exists in both `apps/mobile/src/components/PasswordInput/` and `apps/extension/src/components/PasswordInput/`
- [x] 1.10 Verify `SeedPhrase` component exists in both `apps/mobile/src/components/SeedPhrase/` and `apps/extension/src/components/SeedPhrase/`
- [x] 1.11 Verify `DerivedAccountCard` component exists in both `apps/mobile/src/components/DerivedAccountCard/` and `apps/extension/src/components/DerivedAccountCard/`
- [x] 1.12 Verify `useBiometricAuth` hook exists in `apps/mobile/hooks/useBiometricAuth.ts`
- [x] 1.13 Verify `PageShell` component exists in `apps/extension/src/components/PageShell/`
- [x] 1.14 Verify no `changePassword` action exists yet in `useAccounts` (confirm it must be created)
- [x] 1.15 Audit all references to `EditAccountDialog` in extension to plan removal — check `apps/extension/src/components/EditAccountDialog/` and its imports

## 2. Shared Types (`packages/shared`)

- [x] 2.1 Create `packages/shared/src/types/ui/accounts-page.ts` with `AccountsPagePropsBase` (accounts list, activeAccountId, onSelectAccount, onEditAccount, onDeleteAccount, onAddAccount callbacks)
- [x] 2.2 Create `packages/shared/src/types/ui/account-edit-page.ts` with `AccountEditPagePropsBase` (accountId, account data, onEditName, onEditAvatar, onBackupSeed, onExportPrivateKey, onBack)
- [x] 2.3 Create `packages/shared/src/types/ui/account-add.ts` with `AccountAddPagePropsBase` (step state type, onDeriveAccount, onImportSeed, onBack)
- [x] 2.4 Create `packages/shared/src/types/ui/security-page.ts` with `SecurityPagePropsBase` (onChangePassword, onBack) and mobile-extended `SecurityPagePropsMobile` (biometric state/toggle)
- [x] 2.5 Add all 4 new type files to barrel export in `packages/shared/src/types/ui/index.ts`
- [x] 2.6 Add all 4 new type files to barrel export in `packages/shared/src/types/index.ts` (if UI types are re-exported there)

## 3. Shared Logic (`packages/shared`)

- [x] 3.1 Add `changePassword(oldPassword: string, newPassword: string): Promise<boolean>` action to `packages/shared/src/hooks/useAccounts.ts` — decrypt vault with old password, re-encrypt with new password, update storage, clear stash caches
- [x] 3.2 Export `changePassword` in the `UseAccountsActions` interface in `packages/shared/src/hooks/useAccounts.ts`

## 4. i18n Keys (`packages/shared`)

- [x] 4.1 Add account management i18n keys to `packages/shared/src/locales/en/translation.json`: `accounts.title`, `accounts.add_account`, `accounts.delete_confirm`, `accounts.delete_title`, `accounts.switch_account`, `accounts.no_delete_last`
- [x] 4.2 Add account edit i18n keys to `packages/shared/src/locales/en/translation.json`: `account_edit.title`, `account_edit.name`, `account_edit.avatar`, `account_edit.backup_seed`, `account_edit.export_key`, `account_edit.name_placeholder`, `account_edit.name_empty_error`, `account_edit.name_disclaimer`
- [x] 4.3 Add account add i18n keys to `packages/shared/src/locales/en/translation.json`: `account_add.title`, `account_add.create_new`, `account_add.create_new_description`, `account_add.import_seed`, `account_add.import_seed_description`, `account_add.set_name`, `account_add.default_name`, `account_add.scanning`, `account_add.confirm`
- [x] 4.4 Add security i18n keys to `packages/shared/src/locales/en/translation.json`: `security.title`, `security.change_password`, `security.current_password`, `security.new_password`, `security.confirm_password`, `security.password_mismatch`, `security.password_changed`, `security.wrong_password`, `security.biometric_unlock`, `security.biometric_description`
- [x] 4.5 Add all equivalent keys from 4.1–4.4 translated to Spanish in `packages/shared/src/locales/es/translation.json`

## 5. Mobile — AccountsPage

- [x] 5.1 Create route file `apps/mobile/app/(app)/(tabs)/settings/accounts.tsx` that renders the AccountsPage component
- [x] 5.2 Create component directory `apps/mobile/src/components/AccountsPage/` with `AccountsPage.tsx`, `types.ts`, `index.ts`
- [x] 5.3 Implement `AccountsPage` — FlatList of accounts using `AccountListItem` pattern (avatar, name, `getShortAddress`, active indicator, edit/delete buttons), "Add Account" button as ListFooterComponent
- [x] 5.4 Wire delete confirmation via `Alert.alert()` — call `removeAccount(targetId)` on confirm, hide delete for last account
- [x] 5.5 Wire `onSelectAccount` to call `changeAccount(targetId)` from `useAccountsContext()`
- [x] 5.6 Wire navigation from `SettingsSheet` to the new accounts route

## 6. Extension — AccountsPage

- [x] 6.1 Replace stub in `apps/extension/src/pages/settings/AccountsPage.tsx` with full implementation using `PageShell` wrapper
- [x] 6.2 Implementation in page file directly (follows existing extension pattern — no separate component directory needed)
- [x] 6.3 Implement `AccountsPage` — MUI List of accounts (avatar, name, `getShortAddress`, active indicator, edit/delete icon buttons), "Add Account" button at bottom
- [x] 6.4 Wire delete confirmation via `ConfirmDialog` (existing BaseDialog pattern) — call `removeAccount(targetId)` on confirm, hide delete for last account
- [x] 6.5 Wire `onSelectAccount` to call `changeAccount(targetId)` from `useAccountsContext()`
- [x] 6.6 Wire navigation from settings page and `WalletSwitcherSheet` to AccountsPage

## 7. Mobile — AccountEditPage

- [x] 7.1 Replace stub in `apps/mobile/app/(app)/(tabs)/settings/account-edit.tsx` with full implementation
- [x] 7.2 Create component directory `apps/mobile/src/components/AccountEditPage/` with `AccountEditPage.tsx`, `types.ts`, `index.ts`
- [x] 7.3 Implement `AccountEditPage` — sections list: Name (current name, chevron), Avatar (current avatar preview, chevron), Backup Seed Phrase (chevron, password-gated), Export Private Key (chevron, password-gated)
- [x] 7.4 Wire Name section to navigate to `settings/account-name`
- [x] 7.5 Wire Avatar section to navigate to `settings/avatar` with account ID param
- [x] 7.6 Wire Backup/Key sections to navigate to existing `settings/backup` and `settings/privateKey` routes with password verification

## 8. Extension — AccountEditPage

- [x] 8.1 Replace stub in `apps/extension/src/pages/settings/AccountEditPage.tsx` with full implementation using `PageShell`
- [x] 8.2 Implementation in page file directly (follows existing extension pattern)
- [x] 8.3 Implement `AccountEditPage` — settings-style list: Name, Avatar, Backup Seed Phrase, Export Private Key sections with icons and chevrons
- [x] 8.4 Wire Name section to navigate to `AccountNamePage`
- [x] 8.5 Wire Avatar section to navigate to existing `AccountAvatarPage` with account ID
- [x] 8.6 Wire Backup/Key sections to existing pages with password verification

## 9. Mobile — AccountNamePage

- [x] 9.1 Create route file `apps/mobile/app/(app)/(tabs)/settings/account-name.tsx`
- [x] 9.2 Create component directory `apps/mobile/src/components/AccountNamePage/` with `AccountNamePage.tsx`, `types.ts`, `index.ts`
- [x] 9.3 Implement `AccountNamePage` — TextInput pre-filled with current name, save button, empty validation error, disclaimer text. Call `editAccount(accountId, { name })` on save.

## 10. Extension — AccountNamePage

- [x] 10.1 Replace stub in `apps/extension/src/pages/settings/AccountNamePage.tsx` with full implementation using `PageShell`
- [x] 10.2 Implementation in page file directly (follows existing extension pattern)
- [x] 10.3 Implement `AccountNamePage` — MUI TextField pre-filled with current name, save button, empty validation error, disclaimer text. Call `editAccount(accountId, { name })` on save.

## 11. Mobile — AccountAddPage

- [x] 11.1 Create route file `apps/mobile/app/(app)/(tabs)/settings/account-add.tsx`
- [x] 11.2 Create component directory `apps/mobile/src/components/AccountAddPage/` with `AccountAddPage.tsx`, `types.ts`, `index.ts`
- [x] 11.3 Implement step `select-method` — two option cards: "Create New Account" (derive) and "Import Seed Phrase"
- [x] 11.4 Implement step `derive-scan` — call `scanDerivedAccounts()`, show loading, display results using existing `DerivedAccountCard` component
- [x] 11.5 Implement step `import-seed` — reuse existing `SeedPhrase` component for mnemonic input, validate with `validateMnemonic()`
- [x] 11.6 Implement step `set-name` — TextInput for account name, default to "Account N" using accounts count from `useAccountsContext()`
- [x] 11.7 Wire confirm to call `addAccount()` with derived or imported account, navigate back to accounts list

## 12. Extension — AccountAddPage

- [x] 12.1 Create page file `apps/extension/src/pages/settings/AccountAddPage.tsx`
- [x] 12.2 Implementation in page file directly (follows existing extension pattern)
- [x] 12.3 Implement step `select-method` — two option cards with `PageShell` wrapper
- [x] 12.4 Implement step `derive-scan` — call `scanDerivedAccounts()`, show loading, display results using existing `DerivedAccountCard` component
- [x] 12.5 Implement step `import-seed` — reuse existing `SeedPhrase` component, validate with `validateMnemonic()`
- [x] 12.6 Implement step `set-name` — MUI TextField for account name, default to "Account N"
- [x] 12.7 Wire confirm to call `addAccount()` with derived or imported account, navigate back

## 13. Mobile — SecurityPage

- [x] 13.1 Replace stub in `apps/mobile/app/(app)/(tabs)/settings/security.tsx` with full implementation
- [x] 13.2 Create component directory `apps/mobile/src/components/SecurityPage/` with `SecurityPage.tsx`, `types.ts`, `index.ts`
- [x] 13.3 Implement change password section — current password input, new password input, confirm password input, strength indicator using `validatePassword()`, submit calls `changePassword()`
- [x] 13.4 Implement biometric toggle — use `useBiometricAuth` hook, show toggle only if `isAvailable && isEnrolled`, call `setEnableBiometric()` on toggle
- [x] 13.5 After successful password change with biometric enabled, call `storeKeyForBiometric()` with new derived key

## 14. Extension — SecurityPage

- [x] 14.1 Replace stub in `apps/extension/src/pages/settings/SecurityPage.tsx` with full implementation using `PageShell`
- [x] 14.2 Implementation in page file directly (follows existing extension pattern)
- [x] 14.3 Implement change password section — reuse `PasswordInput` component, strength indicator using `validatePassword()`, submit calls `changePassword()`
- [x] 14.4 No biometric toggle for extension (browser extensions do not support device biometrics)

## 15. Cleanup & Navigation Wiring

- [x] 15.1 Remove `apps/extension/src/components/EditAccountDialog/` directory entirely
- [x] 15.2 Remove all imports/references to `EditAccountDialog` from extension codebase (HomePage, WalletSwitcherSheet, etc.) and replace with navigation to `AccountEditPage`
- [x] 15.3 Wire mobile `WalletSwitcherSheet` `onEditAccount` callback to navigate to `settings/account-edit` with account ID
- [x] 15.4 Wire mobile `WalletSwitcherSheet` `onAddAccount` callback to navigate to `settings/account-add`
- [x] 15.5 Wire extension `WalletSwitcherSheet` `onEditAccount` callback to navigate to `AccountEditPage`
- [x] 15.6 Wire extension `WalletSwitcherSheet` `onAddAccount` callback to navigate to `AccountAddPage`
- [x] 15.7 Add "Accounts" entry to mobile `SettingsSheet` options list, navigating to `settings/accounts`
- [x] 15.8 Add "Accounts" entry to extension settings page, navigating to `AccountsPage`
