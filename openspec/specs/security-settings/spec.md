## Purpose

Security settings page grouping password management, biometric authentication, and trusted dApp management for the wallet.

## Requirements

### Requirement: Security settings page
The system SHALL provide a `SecurityPage` in settings that groups security-related options: change password and biometric authentication toggle. The page SHALL be accessible from the main settings menu in both platforms.

**Package:** `apps/mobile`, `apps/extension`, `packages/shared` (types)

#### Scenario: User opens security settings
- **WHEN** user navigates to Settings > Security
- **THEN** the system displays security options: "Change Password" and "Biometric Unlock" (mobile only if device supports it)

### Requirement: Change password
The system SHALL allow the user to change their wallet password. The flow SHALL require entering the current password for verification, then entering and confirming a new password. The system SHALL use the existing `checkPassword()` action to verify the current password and re-encrypt all account data with the new password.

**Package:** `packages/shared` (actions already exist: `checkPassword`, re-encryption logic), `apps/mobile`, `apps/extension`

#### Scenario: User changes password successfully
- **WHEN** user enters the correct current password
- **THEN** the system validates it via `checkPassword()`
- **WHEN** user enters a new password and confirms it (both fields match)
- **THEN** the system re-encrypts all stored accounts with the new password
- **THEN** the system shows a success confirmation
- **THEN** the user remains unlocked with the new password active

#### Scenario: Current password is incorrect
- **WHEN** user enters an incorrect current password
- **THEN** the system shows an error message
- **THEN** the new password fields remain disabled or hidden

#### Scenario: New password confirmation does not match
- **WHEN** user enters a new password and a different confirmation
- **THEN** the system shows a mismatch validation error
- **THEN** the save action is disabled

### Requirement: Biometric authentication toggle (mobile only)
The system SHALL allow mobile users to enable or disable biometric unlock (Face ID / Touch ID) if the device supports it. When enabled, the system caches the derived key so the user can unlock without typing the password. When disabled, the cached key is cleared.

**Package:** `apps/mobile` (uses `useBiometricAuth` hook and `localAuthentication` utils), `packages/shared` (key caching via `DerivedKeyCache`)

#### Scenario: User enables biometric unlock
- **WHEN** user toggles biometric unlock ON
- **THEN** the system prompts for biometric verification (Face ID / Touch ID)
- **WHEN** biometric verification succeeds
- **THEN** the system caches the derived key in secure storage
- **THEN** the lock screen offers biometric unlock as an option

#### Scenario: User disables biometric unlock
- **WHEN** user toggles biometric unlock OFF
- **THEN** the system clears the cached derived key from secure storage
- **THEN** the lock screen requires password entry only

#### Scenario: Device does not support biometrics
- **WHEN** the device does not support biometric authentication
- **THEN** the biometric toggle is hidden from the security page

#### Scenario: Extension does not show biometric option
- **WHEN** the security page is rendered in the browser extension
- **THEN** the biometric toggle is not shown (browser extensions do not support device biometrics)

### Requirement: Shared UI prop types for security page
The system SHALL define shared prop types in `packages/shared/src/types/ui/` for SecurityPage, following the established base props pattern.

**Package:** `packages/shared`

#### Scenario: Both platforms consume shared prop types
- **WHEN** mobile and extension implement SecurityPage
- **THEN** both import base prop types from `@salmon/shared`
- **THEN** mobile extends with biometric-specific props

### Requirement: Extension TrustedAppsPage implementation
The extension `TrustedAppsPage` SHALL render the existing `TrustedAppsSelector` component connected to `useAccountsContext()` state. It SHALL display all trusted apps for the current network and allow the user to revoke any app. This page is used in the standalone popup context (separate from the side panel where it already works via `HomePage`).

**Package:** `apps/extension`

#### Scenario: User views trusted apps in popup settings
- **WHEN** user navigates to the Trusted Apps page in the popup
- **THEN** the system renders `TrustedAppsSelector` with `activeTrustedApps` mapped to `TrustedAppItem[]`
- **THEN** each trusted app shows its name (or domain if no name), icon, and a revoke button

#### Scenario: User revokes a trusted app
- **WHEN** user clicks the revoke button on a trusted app
- **THEN** the system calls `removeTrustedApp(domain)` from the accounts context
- **THEN** the app disappears from the list

#### Scenario: No trusted apps exist
- **WHEN** the trusted apps list for the current network is empty
- **THEN** the system shows an empty state message via the `TrustedAppsSelector` component
