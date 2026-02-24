## ADDED Requirements

### Requirement: Shared hook provides filtered contacts and own wallets for send flow
The `useSendContacts` hook in `packages/shared/src/hooks/useSendContacts.ts` SHALL compose `useAddressbook`, `useAccountsContext`, and `useAvailableNetworks` to produce two filtered lists: address book contacts matching the active network (excluding the sender) and the user's other wallet addresses on the same network (excluding the sender).

#### Scenario: Contacts filtered by active network
- **WHEN** the user has 3 saved contacts (2 on solana-mainnet, 1 on ethereum-mainnet) and the active network is solana-mainnet
- **THEN** the hook SHALL return only the 2 solana-mainnet contacts in the `contacts` array

#### Scenario: Sender address excluded from contacts
- **WHEN** the user has a saved contact whose address matches the sender's address
- **THEN** that contact SHALL NOT appear in the `contacts` array

#### Scenario: Own wallets excludes the sender
- **WHEN** the user has 3 accounts with wallet addresses on the active network
- **THEN** the hook SHALL return only the 2 wallets that are NOT the sender in the `ownWallets` array

#### Scenario: Single account means empty own wallets
- **WHEN** the user has only 1 account
- **THEN** the `ownWallets` array SHALL be empty

#### Scenario: Loading state
- **WHEN** address book data is still loading from storage
- **THEN** the hook SHALL return `isLoading: true` and empty arrays for `contacts` and `ownWallets`

---

### Requirement: StepAddressAmount displays address book contacts on mobile
The mobile `StepAddressAmount` component (`apps/mobile/src/components/SendSheet/StepAddressAmount.tsx`) SHALL render a list of address book contacts below the Recipient address input when the address input is empty and contacts are available.

#### Scenario: Contacts visible when address input is empty
- **WHEN** the address input is empty AND the hook returns 2 contacts
- **THEN** an "Address Book" section header and 2 contact rows SHALL be rendered below the address input

#### Scenario: Contact row displays name and truncated address
- **WHEN** a contact row is rendered
- **THEN** it SHALL display the contact's `name` as primary text and the address truncated via `getShortAddress` as secondary text

#### Scenario: Tapping a contact auto-fills the address input
- **WHEN** the user taps a contact row
- **THEN** the address input SHALL be set to that contact's full address, triggering address validation

#### Scenario: Contacts hidden when address input has text
- **WHEN** the user types or pastes text into the address input
- **THEN** the contacts section SHALL NOT be rendered

---

### Requirement: StepAddressAmount displays own wallets on mobile
The mobile `StepAddressAmount` component SHALL render a list of the user's other wallet addresses below the Recipient address input (above the contacts section) when the address input is empty and own wallets are available.

#### Scenario: Own wallets visible when address input is empty
- **WHEN** the address input is empty AND the hook returns 1+ own wallets
- **THEN** a "My Wallets" section header and wallet rows SHALL be rendered below the address input

#### Scenario: Wallet row displays account name and truncated address
- **WHEN** a wallet row is rendered
- **THEN** it SHALL display the account's `accountName` as primary text and the address truncated via `getShortAddress` as secondary text

#### Scenario: Tapping a wallet auto-fills the address input
- **WHEN** the user taps an own wallet row
- **THEN** the address input SHALL be set to that wallet's full address, triggering address validation

---

### Requirement: StepAddressAmount displays address book contacts on extension
The extension `StepAddressAmount` component (`apps/extension/src/components/SendPage/StepAddressAmount.tsx`) SHALL render a list of address book contacts below the Recipient address input when the address input is empty and contacts are available. Behavior SHALL match the mobile version.

#### Scenario: Contacts visible when address input is empty
- **WHEN** the address input is empty AND the hook returns 2 contacts
- **THEN** an "Address Book" section header and 2 contact rows SHALL be rendered below the address input

#### Scenario: Tapping a contact auto-fills the address input
- **WHEN** the user clicks a contact row
- **THEN** the address input SHALL be set to that contact's full address, triggering address validation

#### Scenario: Contacts hidden when address input has text
- **WHEN** the user types text into the address input
- **THEN** the contacts section SHALL NOT be rendered

---

### Requirement: StepAddressAmount displays own wallets on extension
The extension `StepAddressAmount` component SHALL render a list of the user's other wallet addresses below the Recipient address input (above the contacts section) when the address input is empty and own wallets are available. Behavior SHALL match the mobile version.

#### Scenario: Own wallets visible when address input is empty
- **WHEN** the address input is empty AND the hook returns 1+ own wallets
- **THEN** a "My Wallets" section header and wallet rows SHALL be rendered below the address input

#### Scenario: Tapping a wallet auto-fills the address input
- **WHEN** the user clicks an own wallet row
- **THEN** the address input SHALL be set to that wallet's full address, triggering address validation

---

### Requirement: i18n keys for section labels
All user-visible strings in the contact selector sections SHALL use i18n translation keys via `t()`.

#### Scenario: Translation keys exist for both languages
- **WHEN** the send contact selector is rendered
- **THEN** the "My Wallets" label SHALL use `t('send.myWallets')` and the "Address Book" label SHALL use `t('send.addressBook')`

#### Scenario: Keys present in both en and es translation files
- **WHEN** translation files are checked
- **THEN** `send.myWallets` and `send.addressBook` SHALL exist in both `packages/shared/src/locales/en/translation.json` and `packages/shared/src/locales/es/translation.json`

---

### Requirement: Shared hook exported from barrel
The `useSendContacts` hook and its result type SHALL be exported from `packages/shared/src/hooks/index.ts` and re-exported from the package root `@salmon/shared`.

#### Scenario: Importable from shared package
- **WHEN** a consumer imports `useSendContacts` from `@salmon/shared`
- **THEN** the import SHALL resolve correctly without errors
