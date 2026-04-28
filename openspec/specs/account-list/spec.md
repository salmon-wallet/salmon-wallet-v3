# account-list Specification

## Purpose

Define the accounts settings page (`AccountsPage`) shared by mobile and extension. It lists every stored account with avatar, name, and active-network address, marks the active account, and exposes the account-level actions: switch, edit, delete (guarded against deleting the last account), and add. The page reuses the existing `useAccountsContext()` actions (`changeAccount`, `removeAccount`) and shared base prop types so both platforms render the same surface.

## Requirements

### Requirement: Dedicated accounts page in settings
The system SHALL provide a dedicated settings page (`AccountsPage`) that displays all stored accounts in a scrollable list. Each list item SHALL show the account avatar, account name, and a truncated address. The currently active account SHALL be visually distinguished.

**Package:** `apps/mobile` (screen), `apps/extension` (page), `packages/shared` (types)

#### Scenario: User opens accounts page from settings
- **WHEN** user navigates to Settings > Accounts
- **THEN** the system displays a list of all accounts with avatar, name, and truncated address for the active network
- **THEN** the active account is visually marked (e.g., checkmark or highlight)

#### Scenario: Empty state is impossible
- **WHEN** the accounts page loads
- **THEN** there is always at least one account (the current one), so no empty state is needed

### Requirement: Switch active account from accounts page
The system SHALL allow the user to tap/click an account in the list to switch the active account. The switch SHALL call `changeAccount(targetId)` from `useAccountsContext()` and navigate back or update the UI to reflect the new active account.

**Package:** `packages/shared` (action already exists), `apps/mobile`, `apps/extension`

#### Scenario: User switches to a different account
- **WHEN** user taps a non-active account in the accounts list
- **THEN** the system calls `changeAccount(targetId)`
- **THEN** the active account indicator moves to the selected account
- **THEN** the wallet header and balance reflect the new active account

#### Scenario: User taps the already active account
- **WHEN** user taps the account that is already active
- **THEN** no action is taken (or the system navigates to edit)

### Requirement: Navigate to edit account from accounts page
The system SHALL provide an edit action per account (e.g., edit icon button) that navigates to the `AccountEditPage` for that specific account.

**Package:** `apps/mobile`, `apps/extension`

#### Scenario: User taps edit on an account
- **WHEN** user taps the edit button on an account list item
- **THEN** the system navigates to AccountEditPage with the selected account's ID

### Requirement: Delete account from accounts page
The system SHALL provide a delete action per account that removes the account after confirmation. The system SHALL NOT allow deleting the last remaining account. Deletion SHALL call `removeAccount(targetId)` from `useAccountsContext()`.

**Package:** `packages/shared` (action already exists), `apps/mobile`, `apps/extension`

#### Scenario: User deletes a non-last account
- **WHEN** user taps delete on an account that is not the only account
- **THEN** the system shows a confirmation dialog
- **WHEN** user confirms deletion
- **THEN** the system calls `removeAccount(targetId)`
- **THEN** the account is removed from the list
- **THEN** if the deleted account was active, the system switches to another account

#### Scenario: User attempts to delete the last account
- **WHEN** only one account exists
- **THEN** the delete action is hidden or disabled

### Requirement: Add account entry point from accounts page
The system SHALL provide an "Add Account" button at the bottom of the accounts list that navigates to the account-add flow.

**Package:** `apps/mobile`, `apps/extension`

#### Scenario: User taps add account
- **WHEN** user taps the "Add Account" button on the accounts page
- **THEN** the system navigates to the account-add flow

### Requirement: Shared UI prop types for accounts page
The system SHALL define shared prop types in `packages/shared/src/types/ui/` for the AccountsPage and AccountListItem components, following the existing pattern of `WalletSwitcherSheetPropsBase`.

**Package:** `packages/shared`

#### Scenario: Both platforms consume shared prop types
- **WHEN** mobile and extension implement AccountsPage
- **THEN** both import base prop types from `@salmon/shared`
- **THEN** platform-specific props extend the base type
