# account-edit Specification

## Purpose

Define the account edit experience: a single page that groups the editable aspects of an account (name, avatar, seed phrase backup, private key export) and routes the user to the existing flows for each. Edits use the shared `editAccount` action from `useAccountsContext()` so name and avatar updates propagate across mobile and extension; sensitive surfaces (seed phrase, private key) remain gated behind password verification.

## Requirements

### Requirement: Account edit page with grouped sections
The system SHALL provide an `AccountEditPage` that displays editable sections for a specific account: name, avatar, seed phrase backup, and private key export. Each section SHALL navigate to its respective sub-page or reveal inline content.

**Package:** `apps/mobile`, `apps/extension`, `packages/shared` (types)

#### Scenario: User opens account edit page
- **WHEN** user navigates to AccountEditPage for a given account ID
- **THEN** the system displays sections for: Name, Avatar, Backup Seed Phrase, Export Private Key
- **THEN** each section shows the current value or a summary (e.g., current name, current avatar)

#### Scenario: User navigates from WalletSwitcherSheet edit action
- **WHEN** user taps edit on an account in WalletSwitcherSheet
- **THEN** the sheet closes and the system navigates to AccountEditPage with that account's ID

### Requirement: Edit account name
The system SHALL allow the user to edit the account name. The name input SHALL validate that it is not empty. Saving SHALL call `editAccount(targetId, { name })` from `useAccountsContext()`. The name is local-only and not stored on-chain.

**Package:** `packages/shared` (action already exists), `apps/mobile`, `apps/extension`

#### Scenario: User edits account name successfully
- **WHEN** user navigates to the name edit section
- **THEN** the system shows an input pre-filled with the current account name
- **WHEN** user enters a new non-empty name and saves
- **THEN** the system calls `editAccount(accountId, { name: newName })`
- **THEN** the name updates across all UI (header, account list, switcher)

#### Scenario: User submits empty name
- **WHEN** user clears the name input and attempts to save
- **THEN** the system shows a validation error
- **THEN** the save action is disabled

#### Scenario: Extension consolidates EditAccountDialog
- **WHEN** the AccountEditPage or AccountNamePage is implemented in extension
- **THEN** the existing `EditAccountDialog` component SHALL be removed or refactored to avoid duplicate name-editing paths

### Requirement: Edit account avatar
The system SHALL allow the user to change the account avatar. This navigates to the existing `AccountAvatarPage` (extension) or `avatar.tsx` (mobile) passing the account ID. Saving SHALL call `editAccount(targetId, { avatar })`.

**Package:** `packages/shared` (action already exists), `apps/mobile`, `apps/extension`

#### Scenario: User changes avatar
- **WHEN** user taps the avatar section on AccountEditPage
- **THEN** the system navigates to the avatar picker page with the current account ID
- **WHEN** user selects a new avatar and confirms
- **THEN** the system calls `editAccount(accountId, { avatar: newAvatarUrl })`
- **THEN** the avatar updates across all UI

### Requirement: Access seed phrase backup from account edit
The system SHALL provide a section in AccountEditPage that navigates to the existing seed phrase backup page, gated behind password verification.

**Package:** `apps/mobile`, `apps/extension`

#### Scenario: User accesses seed phrase backup
- **WHEN** user taps "Backup Seed Phrase" on AccountEditPage
- **THEN** the system requires password verification before proceeding
- **WHEN** password is verified
- **THEN** the system navigates to the existing backup/seed phrase page for that account

### Requirement: Access private key export from account edit
The system SHALL provide a section in AccountEditPage that navigates to the existing private key reveal page, gated behind password verification.

**Package:** `apps/mobile`, `apps/extension`

#### Scenario: User accesses private key export
- **WHEN** user taps "Export Private Key" on AccountEditPage
- **THEN** the system requires password verification before proceeding
- **WHEN** password is verified
- **THEN** the system navigates to the existing private key page for the active network's account

### Requirement: Shared UI prop types for account edit
The system SHALL define shared prop types in `packages/shared/src/types/ui/` for AccountEditPage, following the established base props pattern.

**Package:** `packages/shared`

#### Scenario: Both platforms consume shared prop types
- **WHEN** mobile and extension implement AccountEditPage
- **THEN** both import base prop types from `@salmon/shared`
