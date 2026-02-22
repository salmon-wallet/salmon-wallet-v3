## Why

Salmon Wallet v3 has all the backend logic for multi-account management (AccountsContext, useAccounts hook, types) but the UI pages are stubs. In v2 this was a complete flow (account list → edit → sub-pages). Users currently cannot view all accounts in a dedicated page, edit account names from settings, add new accounts, or manage individual accounts beyond what the WalletSwitcherSheet offers. The WalletSwitcherSheet already wires `onEditAccount`, `onDeleteAccount`, and `onAddAccount` callbacks but the destination pages are empty.

## What Changes

- **Implement AccountsPage**: Dedicated settings page listing all accounts with switch, edit, and delete actions (both platforms)
- **Implement AccountEditPage**: Per-account edit page with sections for name, avatar, seed phrase, and private key (both platforms)
- **Implement AccountNamePage**: Inline name editing with save (both platforms)
- **Implement Add Account flow**: Create a new derived account from the existing mnemonic, or import a new mnemonic (both platforms)
- **Implement SecurityPage**: Password change and biometric toggle settings (both platforms)
- **Wire navigation**: Connect WalletSwitcherSheet and SettingsSheet to the new pages

## Capabilities

### New Capabilities
- `account-list`: View all accounts, switch active account, navigate to edit/delete from a dedicated settings page
- `account-edit`: Per-account edit page aggregating name, avatar, backup, and private key sub-sections
- `account-add`: Create new derived account (same seed) or import new seed phrase, with derivation path scanning
- `security-settings`: Password management and biometric authentication toggle

### Modified Capabilities
_(No existing specs to modify — this is a greenfield specs setup)_

## Impact

- **packages/shared**: New shared types for account management UI props (`types/ui/`), possible new hooks (e.g., `useAccountManagement`). Reuse existing `EditAccountParams`, `CreateAccountOptions`, `useAccounts` actions. New i18n keys in `locales/en/` and `locales/es/`.
- **apps/mobile**: Implement `account-edit.tsx` screen (currently stub), add new routes for account-list and account-name. Wire from SettingsSheet and WalletSwitcherSheet.
- **apps/extension**: Implement `AccountsPage.tsx`, `AccountEditPage.tsx`, `AccountNamePage.tsx`, `SecurityPage.tsx` (all currently stubs). Wire from HomePage navigation.
- **Risk of duplication**: Extension HomePage already has an `EditAccountDialog` for name editing — must consolidate with the new AccountNamePage to avoid two paths doing the same thing.
- **No backend changes**: All account CRUD operations already exist in `useAccounts` hook (`addAccount`, `editAccount`, `removeAccount`, `changeAccount`).
