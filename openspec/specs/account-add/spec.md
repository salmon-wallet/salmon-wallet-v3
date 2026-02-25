## MODIFIED Requirements

### Requirement: Derive new account from existing mnemonic
The system SHALL allow creating a new account by deriving it from the active account's mnemonic with an incremented account index. The new account SHALL automatically scan for existing balances across supported networks. The system SHALL call `addAccount()` from `useAccountsContext()` with the derived account data. The scan SHALL only include networks belonging to blockchains listed in `ENABLED_BLOCKCHAINS`.

**Package:** `packages/shared` (action already exists, derivation in `utils/derived-accounts.ts`), `apps/mobile`, `apps/extension`

#### Scenario: User creates a derived account
- **WHEN** user selects "Create New Account"
- **THEN** the system derives a new account from the current mnemonic with the next available index
- **THEN** the system scans for balances only on enabled networks (e.g., Solana and Bitcoin when Ethereum is disabled)
- **THEN** the system shows a summary with the new account's addresses
- **WHEN** user confirms
- **THEN** the system calls `addAccount(newAccount)`
- **THEN** the new account appears in the accounts list
- **THEN** the system optionally switches to the new account

#### Scenario: Derivation path scanning shows existing balances
- **WHEN** the system scans derived addresses
- **THEN** addresses with existing balances are flagged for the user's awareness

#### Scenario: Disabled blockchains are excluded from scanning
- **WHEN** the system scans derived addresses
- **AND** Ethereum is not in `ENABLED_BLOCKCHAINS`
- **THEN** no Ethereum networks appear in the scan results
- **AND** no Ethereum accounts are derived
