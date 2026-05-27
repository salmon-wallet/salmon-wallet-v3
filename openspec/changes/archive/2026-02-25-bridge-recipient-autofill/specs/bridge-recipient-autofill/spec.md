## ADDED Requirements

### Requirement: Recipient address pre-filled with user's own address
When the bridge recipient screen opens, the address input SHALL be pre-populated with the user's own address for the target chain.

#### Scenario: User swaps Solana token to BTC
- **WHEN** the user selects BTC as the output token and proceeds to the recipient step
- **THEN** the recipient address field SHALL contain the user's Bitcoin address from `activeAccount.networksAccounts['bitcoin-mainnet']`
- **AND** the field SHALL remain editable (the user can clear it and type a different address)

### Requirement: Address validation gates the Review button
The existing `validateAddress()` from `utils/swap.ts` SHALL gate the Review button. No new validation functions shall be created.

#### Scenario: Valid pre-filled address
- **WHEN** the user's own BTC address is pre-filled
- **THEN** `validateAddress(address, 'bitcoin')` SHALL return `{ valid: true }`
- **AND** the Review button SHALL be enabled

#### Scenario: Invalid or empty address
- **WHEN** the address is empty or invalid
- **THEN** the Review button SHALL be disabled
