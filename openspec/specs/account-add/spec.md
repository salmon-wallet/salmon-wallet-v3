# account-add Specification

## Purpose

Define how the wallet adds a new account by deriving from the active mnemonic. The derivation flow scans for existing balances across the networks the backend currently reports as enabled, then persists the new account through the standard `addAccount()` action exposed by `useAccountsContext()`.

## Requirements

### Requirement: Derive new account from existing mnemonic

The system SHALL allow creating a new account by deriving it from the active account's mnemonic with an incremented account index. The new account SHALL automatically scan for existing balances across supported networks. The system SHALL call `addAccount()` from `useAccountsContext()` with the derived account data.

The scan SHALL include only networks returned by the async helper `getScanNetworks()` in `packages/shared/src/utils/derived-accounts.ts`. That helper consults the backend network catalog through `getEnabledNetworkIds()` and is the canonical filter for "which networks should be scanned right now". Callers MUST NOT inline a local static blockchain list as the filter.

**Package:** `packages/shared` (derivation in `utils/derived-accounts.ts`), `apps/mobile`, `apps/extension`

#### Scenario: User creates a derived account

- **WHEN** the user selects "Create New Account"
- **THEN** the system derives a new account from the current mnemonic with the next available index
- **THEN** the system scans for balances only on the networks returned by `await getScanNetworks()`
- **THEN** the system shows a summary with the new account's addresses
- **WHEN** the user confirms
- **THEN** the system calls `addAccount(newAccount)`
- **THEN** the new account appears in the accounts list
- **THEN** the system optionally switches to the new account

#### Scenario: Derivation path scanning shows existing balances

- **WHEN** the system scans derived addresses
- **THEN** addresses with existing balances are flagged for the user's awareness

#### Scenario: Backend-disabled blockchains are excluded from scanning

- **WHEN** the system scans derived addresses
- **AND** the backend network catalog does not return any Ethereum network as enabled
- **THEN** `await getScanNetworks()` does not include any Ethereum network ID
- **THEN** no Ethereum networks appear in the scan results
- **AND** no Ethereum accounts are derived
