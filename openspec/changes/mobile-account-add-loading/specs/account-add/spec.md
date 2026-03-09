## ADDED Requirements

### Requirement: Loading overlay during mobile account creation
The mobile `AccountAddPanel` SHALL display a fullscreen `LoadingScreen` overlay while `createAccount()` and `addAccount()` are executing. The overlay SHALL use the existing `LoadingScreen` component from `apps/mobile/src/components/LoadingScreen/`. The overlay title SHALL indicate whether the account is being created (derived) or imported, using i18n keys matching the web version.

**Package:** `apps/mobile` (`src/components/AccountAddPanel/AccountAddPanel.tsx`)

#### Scenario: User confirms account creation (derive path)
- **WHEN** user taps the confirm button after selecting a derived account and entering a name
- **THEN** the system SHALL show the `LoadingScreen` overlay with title from `t('settings.account_add.confirm_create')`
- **AND** the system SHALL show subtitle from `t('general.loading')`
- **AND** the overlay SHALL remain visible until `addAccount()` completes or fails

#### Scenario: User confirms account creation (import path)
- **WHEN** user taps the confirm button after entering a seed phrase and a name
- **THEN** the system SHALL show the `LoadingScreen` overlay with title from `t('settings.account_add.confirm_import')`
- **AND** the system SHALL show subtitle from `t('general.loading')`

### Requirement: Error feedback on mobile account creation failure
The mobile `AccountAddPanel` SHALL display an error alert via `Alert.alert()` if `createAccount()` or `addAccount()` throws. The `loading` state SHALL be reset to `false` so the user can retry.

**Package:** `apps/mobile` (`src/components/AccountAddPanel/AccountAddPanel.tsx`)

#### Scenario: Account creation fails
- **WHEN** `createAccount()` or `addAccount()` throws an error during the confirm step
- **THEN** the system SHALL dismiss the `LoadingScreen` overlay
- **AND** the system SHALL show a native alert with error title from `t('general.error')` and message from `t('settings.account_add.creation_error')`
- **AND** the user SHALL remain on the set-name step and be able to retry

### Requirement: Prevent double-tap during mobile account creation
The mobile `AccountAddPanel` SHALL ignore additional taps on the confirm button while account creation is in progress.

**Package:** `apps/mobile` (`src/components/AccountAddPanel/AccountAddPanel.tsx`)

#### Scenario: User taps confirm while creation is already in progress
- **WHEN** user taps the confirm button while `loading` is `true`
- **THEN** the system SHALL not trigger another `createAccount()` call
