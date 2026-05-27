## MODIFIED Requirements

### Requirement: Biometric authentication toggle (mobile only)
The system SHALL allow mobile users to enable or disable biometric unlock (Face ID / Touch ID) if the device supports it. When enabled, the system caches the derived key so the user can unlock without typing the password. When disabled, the cached key is cleared. When a user who skipped onboarding enrollment enables biometric, the derived key SHALL be stored on the next successful password unlock.

**Package:** `apps/mobile` (uses `useBiometricAuth` hook and `localAuthentication` utils), `packages/shared` (key caching via `DerivedKeyCache`)

#### Scenario: User enables biometric unlock (skipped during onboarding)
- **WHEN** user toggles biometric unlock ON in SecurityPanel AND no biometric key exists
- **THEN** `setEnableBiometric(true)` SHALL be called
- **THEN** the preference SHALL be persisted in SecureStore
- **THEN** on the next password unlock in LockScreenOverlay, the derived key SHALL be stored via `storeKeyForBiometric()`
- **THEN** subsequent app opens SHALL auto-prompt Face ID/Touch ID

#### Scenario: User disables biometric unlock
- **WHEN** user toggles biometric unlock OFF
- **THEN** the system SHALL clear the cached derived key from secure storage
- **THEN** the system SHALL clear the plain existence flag (`salmon_biometric_key_exists`)
- **THEN** the lock screen SHALL require password entry only

#### Scenario: Device does not support biometrics
- **WHEN** the device does not support biometric authentication
- **THEN** the biometric toggle SHALL be hidden from the security page

#### Scenario: Extension does not show biometric option
- **WHEN** the security page is rendered in the browser extension
- **THEN** the biometric toggle SHALL NOT be shown

#### Scenario: SecurityPanel mount does not trigger Face ID
- **WHEN** SecurityPanel mounts with `useBiometricAuth` hook
- **THEN** no Face ID prompt SHALL appear
- **THEN** `checkBiometricCapabilities()` SHALL read only the plain flag, not the protected key
