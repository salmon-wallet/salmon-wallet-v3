## ADDED Requirements

### Requirement: Add account flow with two options
The system SHALL provide an account creation flow accessible from the AccountsPage "Add Account" button and the WalletSwitcherSheet "Add Account" button. The flow SHALL offer two options: derive a new account from the existing mnemonic, or import a wallet from a new seed phrase.

**Package:** `apps/mobile`, `apps/extension`, `packages/shared` (types, hooks)

#### Scenario: User enters add account flow
- **WHEN** user taps "Add Account" from AccountsPage or WalletSwitcherSheet
- **THEN** the system presents two options: "Create New Account" (derive) and "Import Seed Phrase" (restore)

### Requirement: Derive new account from existing mnemonic
The system SHALL allow creating a new account by deriving it from the active account's mnemonic with an incremented account index. The new account SHALL automatically scan for existing balances across supported networks. The system SHALL call `addAccount()` from `useAccountsContext()` with the derived account data.

**Package:** `packages/shared` (action already exists, derivation in `utils/derived-accounts.ts`), `apps/mobile`, `apps/extension`

#### Scenario: User creates a derived account
- **WHEN** user selects "Create New Account"
- **THEN** the system derives a new account from the current mnemonic with the next available index
- **THEN** the system scans for balances on all supported networks (Solana, Ethereum, Bitcoin)
- **THEN** the system shows a summary with the new account's addresses
- **WHEN** user confirms
- **THEN** the system calls `addAccount(newAccount)`
- **THEN** the new account appears in the accounts list
- **THEN** the system optionally switches to the new account

#### Scenario: Derivation path scanning shows existing balances
- **WHEN** the system scans derived addresses
- **THEN** addresses with existing balances are flagged for the user's awareness

### Requirement: Import wallet from new seed phrase
The system SHALL allow importing an account from a new seed phrase (12 or 24 words). The system SHALL validate the mnemonic using BIP39 validation. Upon valid import, the system SHALL call `addAccount()` with a `RestoreAccountOptions` object.

**Package:** `packages/shared` (mnemonic validation in `crypto/mnemonic.ts`, action exists), `apps/mobile`, `apps/extension`

#### Scenario: User imports a valid seed phrase
- **WHEN** user selects "Import Seed Phrase"
- **THEN** the system shows a seed phrase input (12 or 24 words)
- **WHEN** user enters a valid BIP39 mnemonic
- **THEN** the system allows the user to set a name for the imported account
- **WHEN** user confirms
- **THEN** the system calls `addAccount()` with the imported mnemonic
- **THEN** the new account appears in the accounts list

#### Scenario: User enters an invalid seed phrase
- **WHEN** user enters an invalid mnemonic
- **THEN** the system shows a validation error
- **THEN** the confirm/import action is disabled

### Requirement: Reuse existing SeedPhrase component for import input
The system SHALL reuse the existing `SeedPhrase` component (available in both `apps/mobile/src/components/SeedPhrase/` and `apps/extension/src/components/SeedPhrase/`) for the mnemonic input UI during import.

**Package:** `apps/mobile`, `apps/extension`

#### Scenario: Seed phrase input uses existing component
- **WHEN** the import flow shows the mnemonic input
- **THEN** it uses the existing SeedPhrase component, not a new implementation

### Requirement: Account name assignment during creation
The system SHALL allow the user to set a custom name for the new account during creation. If no name is provided, the system SHALL generate a default name (e.g., "Account 2", "Account 3" based on the total account count).

**Package:** `packages/shared` (naming logic), `apps/mobile`, `apps/extension`

#### Scenario: User provides a custom name
- **WHEN** user enters a name during account creation
- **THEN** the new account is created with that name

#### Scenario: User skips naming
- **WHEN** user does not enter a name
- **THEN** the system assigns a default name based on account count
