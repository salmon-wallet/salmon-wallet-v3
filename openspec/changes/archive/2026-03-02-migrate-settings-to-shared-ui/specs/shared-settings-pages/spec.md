## ADDED Requirements

### Requirement: AccountsPage shared component
The system SHALL provide an `AccountsPage` component in `packages/ui/src/components/AccountsPage/` that displays all stored accounts in a scrollable list. The component SHALL accept callback props for navigation (`onBack`, `onEditAccount`, `onAddAccount`) and consume account state internally via `useAccountsContext()`. It SHALL use `SettingsPageLayout` as its layout wrapper.

**Package:** `packages/ui`

#### Scenario: Component renders account list
- **WHEN** `AccountsPage` is rendered
- **THEN** it calls `useAccountsContext()` to get all accounts and the active account ID
- **THEN** it displays each account with avatar, name, and truncated address
- **THEN** the active account is visually distinguished

#### Scenario: Component delegates navigation via callbacks
- **WHEN** user clicks an edit button on an account
- **THEN** the component calls `onEditAccount(accountId)` without performing navigation itself
- **WHEN** user clicks "Add Account"
- **THEN** the component calls `onAddAccount()` without performing navigation itself

### Requirement: AccountEditPage shared component
The system SHALL provide an `AccountEditPage` component in `packages/ui/src/components/AccountEditPage/` that displays editable sections for a specific account: name, avatar, backup seed phrase, and export private key. The component SHALL accept an `accountId` prop and callback props for each sub-navigation (`onEditName`, `onEditAvatar`, `onBackupSeed`, `onExportPrivateKey`, `onBack`).

**Package:** `packages/ui`

#### Scenario: Component renders edit sections
- **WHEN** `AccountEditPage` is rendered with an `accountId`
- **THEN** it displays sections for Name, Avatar, Backup Seed Phrase, and Export Private Key
- **THEN** each section shows the current value or summary for that account

#### Scenario: Component delegates sub-navigation via callbacks
- **WHEN** user clicks "Edit Name"
- **THEN** the component calls `onEditName(accountId)`
- **WHEN** user clicks "Edit Avatar"
- **THEN** the component calls `onEditAvatar()`

### Requirement: AccountNamePage shared component
The system SHALL provide an `AccountNamePage` component in `packages/ui/src/components/AccountNamePage/` that allows editing an account's name. It SHALL accept `accountId` and `onBack` props, consume `useAccountsContext()` internally, validate that the name is not empty (max 32 characters), and call `editAccount(accountId, { name })` on save.

**Package:** `packages/ui`

#### Scenario: User saves a valid name
- **WHEN** user enters a non-empty name within 32 characters and saves
- **THEN** the component calls `editAccount(accountId, { name: newName })`
- **THEN** the component calls `onBack()`

#### Scenario: User submits invalid name
- **WHEN** user clears the input or exceeds 32 characters
- **THEN** the save button is disabled
- **THEN** a validation error is shown

### Requirement: AccountAvatarPage shared component
The system SHALL provide an `AccountAvatarPage` component in `packages/ui/src/components/AccountAvatarPage/` with a tabbed interface: Presets tab (grid of preset avatars) and NFTs tab (grid of user's NFT collectibles). It SHALL accept `accountId` and `onBack` props, and call `editAccount(accountId, { avatar })` on selection.

**Package:** `packages/ui`

#### Scenario: User selects a preset avatar
- **WHEN** user selects a preset avatar from the grid
- **THEN** the component calls `editAccount(accountId, { avatar: presetUrl })`
- **THEN** the component calls `onBack()`

#### Scenario: User selects an NFT avatar
- **WHEN** user selects an NFT from the NFTs tab
- **THEN** the component calls `editAccount(accountId, { avatar: nftImageUrl })`
- **THEN** the component calls `onBack()`

### Requirement: AccountAddPage shared component
The system SHALL provide an `AccountAddPage` component in `packages/ui/src/components/AccountAddPage/` that implements the multi-step account addition flow: method selection (derive or import), account derivation/import, and name assignment. It SHALL accept `onBack` and `onComplete` callback props.

**Package:** `packages/ui`

#### Scenario: User derives a new account
- **WHEN** user selects "Create New Account"
- **THEN** the component derives from the active mnemonic with the next index
- **THEN** it scans for balances on enabled networks
- **WHEN** user confirms
- **THEN** the component calls `addAccount()` from `useAccountsContext()`
- **THEN** the component calls `onComplete()`

#### Scenario: User imports via seed phrase
- **WHEN** user selects "Import Account" and enters a valid mnemonic
- **THEN** the component validates via `validateMnemonic()`
- **WHEN** user assigns a name and confirms
- **THEN** the component calls `addAccount()` and `onComplete()`

### Requirement: SecurityPage shared component
The system SHALL provide a `SecurityPage` component in `packages/ui/src/components/SecurityPage/` with a change password form: current password, new password, confirm password. It SHALL accept an `onBack` prop, consume `useAccountsContext()` internally for `changePassword()`, and use the shared `PasswordInput` and `PasswordStrengthBar` components.

**Package:** `packages/ui`

#### Scenario: Component renders change password form
- **WHEN** `SecurityPage` is rendered
- **THEN** it displays three password inputs (current, new, confirm) and a password strength indicator
- **THEN** the biometric toggle is NOT shown (DOM-only component, biometrics is mobile-only)

#### Scenario: User changes password successfully
- **WHEN** user enters correct current password and matching new password
- **THEN** the component calls `changePassword()` from account context
- **THEN** a success alert is displayed

### Requirement: BackupPage shared component
The system SHALL provide a `BackupPage` component in `packages/ui/src/components/BackupPage/` that displays the active account's seed phrase in a word grid. It SHALL accept an `onBack` prop, include a click-to-reveal overlay, copy-to-clipboard functionality, and a security warning.

**Package:** `packages/ui`

#### Scenario: Seed phrase is hidden by default
- **WHEN** `BackupPage` is rendered
- **THEN** the seed phrase words are hidden behind a reveal overlay

#### Scenario: User reveals seed phrase
- **WHEN** user clicks the reveal button
- **THEN** the seed phrase is displayed in a word grid

#### Scenario: User copies seed phrase
- **WHEN** user clicks the copy button while seed phrase is visible
- **THEN** the full seed phrase is copied to clipboard
- **THEN** a visual confirmation is shown

### Requirement: PrivateKeyPage shared component
The system SHALL provide a `PrivateKeyPage` component in `packages/ui/src/components/PrivateKeyPage/` that displays private keys for the active account's networks. It SHALL accept an `onBack` prop, show network selection when multiple networks have keys, and include click-to-reveal and copy functionality per key.

**Package:** `packages/ui`

#### Scenario: Single network key display
- **WHEN** the active account has keys for only one network
- **THEN** the component displays the private key directly with reveal/copy controls

#### Scenario: Multiple network key display
- **WHEN** the active account has keys for multiple networks
- **THEN** the component shows a network selector
- **WHEN** user selects a network
- **THEN** the corresponding private key is displayed with reveal/copy controls

### Requirement: AddressBookPage shared component
The system SHALL provide an `AddressBookPage` component in `packages/ui/src/components/AddressBookPage/` that lists saved contacts from `useAddressbook()`. It SHALL accept `onAddContact`, `onEditContact(contact)`, and `onBack` callback props. Each contact SHALL display name, truncated address, and network.

**Package:** `packages/ui`

#### Scenario: Component renders contact list
- **WHEN** `AddressBookPage` is rendered with saved contacts
- **THEN** each contact shows its label, truncated address, and network
- **THEN** edit and delete actions are available per contact

#### Scenario: Empty address book
- **WHEN** no contacts are saved
- **THEN** an empty state message is shown with an "Add New Address" button

### Requirement: AddressAddPage shared component
The system SHALL provide an `AddressAddPage` component in `packages/ui/src/components/AddressAddPage/` with a form to create a new contact: label input, address input with validation, and network display. It SHALL accept `onBack` and `onSave` callback props, and use `useAddressBookForm()` from `@salmon/shared`.

**Package:** `packages/ui`

#### Scenario: User adds a valid contact
- **WHEN** user enters a valid label and a valid address
- **THEN** the save button is enabled
- **WHEN** user saves
- **THEN** the contact is added to the address book
- **THEN** the component calls `onSave()`

#### Scenario: User enters invalid address
- **WHEN** user enters an address that fails validation
- **THEN** a validation error is shown
- **THEN** the save button is disabled

### Requirement: AddressEditPage shared component
The system SHALL provide an `AddressEditPage` component in `packages/ui/src/components/AddressEditPage/` with a form pre-filled with the existing contact's data. It SHALL accept `contact`, `onBack`, and `onSave` callback props.

**Package:** `packages/ui`

#### Scenario: User edits an existing contact
- **WHEN** `AddressEditPage` is rendered with a contact
- **THEN** the label and address fields are pre-filled
- **WHEN** user modifies the label and saves
- **THEN** the contact is updated in the address book

### Requirement: AboutPage shared component
The system SHALL provide an `AboutPage` component in `packages/ui/src/components/AboutPage/` that displays app information (version), and link sections: General (Website, Docs), Legal (Terms, Privacy), Social (GitHub, Twitter, Telegram). It SHALL accept an `onBack` prop.

**Package:** `packages/ui`

#### Scenario: Component renders app info and links
- **WHEN** `AboutPage` is rendered
- **THEN** the app version is displayed
- **THEN** links are organized in General, Legal, and Social sections
- **THEN** each link opens in a new tab via `window.open()`

### Requirement: All shared settings components use $-prefix transient props
All styled components within the shared settings pages SHALL use the `$` prefix convention for transient props (e.g., `$isActive` instead of `isActive`) to prevent DOM forwarding, consistent with the convention established across `packages/ui`.

**Package:** `packages/ui`

#### Scenario: No React DOM warnings from transient props
- **WHEN** any shared settings page component is rendered
- **THEN** no console warnings about unknown DOM attributes are emitted
- **THEN** all custom styled props use the `$` prefix

### Requirement: All shared settings components are exported from packages/ui barrel
Every shared settings page component SHALL be exported from `packages/ui/src/components/index.ts` with named exports, following the existing barrel export pattern.

**Package:** `packages/ui`

#### Scenario: Components are importable from @salmon/ui
- **WHEN** an app imports `{ AccountsPage, SecurityPage, BackupPage }` from `@salmon/ui`
- **THEN** the imports resolve correctly
- **THEN** typecheck passes
