# biometric-unlock-lifecycle Specification

## Purpose
TBD - created by archiving change fix-biometric-flow. Update Purpose after archive.
## Requirements
### Requirement: Wallet SHALL be unlocked after onboarding
After `addAccount()` completes during the create or recover flow in `apps/mobile/app/(auth)/password.tsx`, the system SHALL call `unlockAccounts(password)` so that `state.locked` is `false` before navigating to the biometric enrollment or success screen.

#### Scenario: User completes account creation with password
- **WHEN** user submits password in the onboarding flow and `addAccount()` succeeds
- **THEN** `actions.unlockAccounts(password)` is called
- **THEN** `state.locked` is `false`
- **THEN** navigation proceeds to biometric enrollment (if available) or success screen

#### Scenario: User navigates from success to main app
- **WHEN** user taps "Go to my wallet" on the success screen
- **THEN** no lock screen overlay appears
- **THEN** the main app tabs are shown immediately

### Requirement: Lock screen SHALL NOT appear during auth flow
The `LockScreenOverlay` in `apps/mobile/app/_layout.tsx` SHALL NOT render when the current route is in the `(auth)` group, regardless of `state.locked`.

#### Scenario: User is in onboarding with locked state
- **WHEN** `state.locked` is `true` AND current route segment is `(auth)`
- **THEN** `shouldShowLockScreen` is `false`
- **THEN** `LockScreenOverlay` does not render

### Requirement: Biometric key existence check SHALL NOT trigger biometric prompt
The `checkBiometricCapabilities()` function in `apps/mobile/hooks/useBiometricAuth.ts` SHALL use a plain (non-protected) SecureStore flag (`salmon_biometric_key_exists`) instead of reading the biometric-protected key to determine if a stored key exists.

#### Scenario: Hook initializes on mount
- **WHEN** `useBiometricAuth` mounts and calls `checkBiometricCapabilities()`
- **THEN** it reads `salmon_biometric_key_exists` (plain flag, no biometric prompt)
- **THEN** `state.hasStoredKey` reflects the flag value

#### Scenario: Key is stored for biometric
- **WHEN** `storeKeyForBiometric(keyJson)` succeeds
- **THEN** both the protected key (`salmon_biometric_key`) and the plain flag (`salmon_biometric_key_exists = 'true'`) are written

#### Scenario: Key is cleared
- **WHEN** `clearBiometricKey()` is called
- **THEN** both the protected key and the plain flag are deleted

### Requirement: Lock screen SHALL auto-prompt biometric exactly once per lock session
When the lock screen becomes visible and biometric is available, the system SHALL auto-prompt Face ID/Touch ID exactly once. If the prompt fails or is cancelled, the system SHALL NOT re-prompt automatically.

#### Scenario: Lock screen appears with biometric available
- **WHEN** lock screen becomes visible AND `canUseBiometric` is `true` AND biometric state has loaded
- **THEN** Face ID/Touch ID is prompted automatically after a 400ms delay
- **THEN** the auto-prompt flag is set to prevent re-triggering

#### Scenario: Biometric auto-prompt fails
- **WHEN** the auto-prompted Face ID/Touch ID fails or user cancels
- **THEN** password input is shown as fallback
- **THEN** "Use Face ID" button is visible for manual retry
- **THEN** no automatic re-prompt occurs

#### Scenario: User manually retries biometric
- **WHEN** user taps the "Use Face ID" / "Use Touch ID" button on the lock screen
- **THEN** Face ID/Touch ID is prompted again

### Requirement: Lock screen SHALL wait for biometric state before rendering UI
The `LockScreenOverlay` SHALL NOT show password input or biometric buttons until the biometric state has been determined (async loading complete).

#### Scenario: Lock screen mounts with biometric state loading
- **WHEN** lock screen becomes visible AND biometric state is still loading
- **THEN** only the logo and "Welcome back" text are shown
- **THEN** no password input, no buttons

#### Scenario: Biometric state loads — biometric available
- **WHEN** biometric state loading completes AND `canUseBiometric` is `true`
- **THEN** auto-prompt fires (per previous requirement)

#### Scenario: Biometric state loads — biometric not available
- **WHEN** biometric state loading completes AND `canUseBiometric` is `false`
- **THEN** password input and unlock button are shown immediately

### Requirement: Biometric enrollment SHALL be user-initiated only
The biometric enrollment screen (`apps/mobile/app/(auth)/biometric.tsx`) SHALL only trigger Face ID when the user explicitly taps the "Enable" button. No `useEffect` or automatic trigger SHALL exist.

#### Scenario: User views enrollment screen
- **WHEN** biometric enrollment screen mounts
- **THEN** no Face ID prompt appears
- **THEN** the screen shows the biometric icon, title, enable button, and skip button

#### Scenario: User taps Enable
- **WHEN** user taps "Enable Face ID" / "Enable Touch ID"
- **THEN** `storeKeyForBiometric()` is called (triggers Face ID to save the key)
- **THEN** if successful, `setEnableBiometric(true)` is called and user navigates to success

#### Scenario: User taps Skip
- **WHEN** user taps "Not now"
- **THEN** no Face ID prompt occurs
- **THEN** user navigates directly to success screen

### Requirement: User cancellation SHALL be handled gracefully
When the user cancels a Face ID/Touch ID prompt (enrollment or unlock), the system SHALL NOT log it as an error.

#### Scenario: User cancels biometric during enrollment
- **WHEN** user cancels Face ID during `storeKeyForBiometric()`
- **THEN** the error is logged as `console.log` (not `console.error`)
- **THEN** the enrollment screen shows an error message with option to retry or skip

#### Scenario: User cancels biometric during unlock
- **WHEN** user cancels Face ID during `authenticateWithBiometric()`
- **THEN** the error is logged as `console.log` (not `console.error`)
- **THEN** password fallback is shown

### Requirement: Biometric key invalidation SHALL clear the plain flag
When the biometric-protected key becomes invalid (system biometric change, `authenticateWithBiometric` fails with non-cancellation error), the plain flag SHALL be cleared to prevent stale state.

#### Scenario: Biometric key read fails with system error
- **WHEN** `authenticateWithBiometric()` fails with a non-cancellation error
- **THEN** `clearBiometricKey()` is called to remove both the protected key and the plain flag
- **THEN** `state.hasStoredKey` becomes `false`

