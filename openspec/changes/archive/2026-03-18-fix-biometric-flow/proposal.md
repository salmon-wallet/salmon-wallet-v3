## Why

The biometric authentication flow has three critical UX bugs: (1) Face ID triggers automatically during onboarding transitions (enrollment screen and success→app navigation) because `SecureStore.getItemAsync` on a biometric-protected key triggers the system prompt, and because `state.locked` is `true` after `addAccount()` causing the LockScreenOverlay to appear over the post-onboarding navigation; (2) the lock screen flashes the password UI before showing Face ID because `useBiometricAuth` state loads asynchronously; (3) Face ID re-triggers automatically after failure instead of waiting for user action. The wallet needs a standard biometric flow: enrollment is user-initiated, unlock only happens on app re-open, and the app stays unlocked after onboarding.

## What Changes

- Ensure the wallet is **unlocked after onboarding** — after `addAccount()` completes in `password.tsx`, the wallet must transition to an unlocked state so no lock screen appears when navigating to the main app
- Add a **`justCompletedOnboarding` guard** in the root layout to suppress the lock screen overlay during the auth→app navigation transition
- Remove the `SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE)` call from `checkBiometricCapabilities()` in `useBiometricAuth` — replace with a plain (non-protected) flag `BIOMETRIC_KEY_EXISTS_FLAG` to check key existence without triggering biometric prompts
- Fix the **LockScreenOverlay biometric-first flow**: wait for biometric state to load before rendering any UI, auto-prompt Face ID exactly once per lock session, show password only as fallback after biometric failure or user opt-in
- Ensure the **biometric enrollment screen** (`biometric.tsx`) only triggers Face ID when the user explicitly taps "Enable", never on mount or navigation

## Capabilities

### New Capabilities
- `biometric-unlock-lifecycle`: Defines when biometric prompts are allowed (only on lock screen after app re-open or inactivity timeout), when they are suppressed (during onboarding, during enrollment), and the fallback-to-password flow

### Modified Capabilities
- `security-settings`: The biometric toggle in SecurityPanel must reflect the new `BIOMETRIC_KEY_EXISTS_FLAG` pattern and work correctly with the updated `useBiometricAuth` hook
- `inactivity-lock-session-cleanup`: The AppState listener must only lock on `background` (not `inactive`) to prevent Face ID system overlays from triggering re-locks

## Impact

- **`apps/mobile/hooks/useBiometricAuth.ts`** — Replace protected key existence check with plain flag; add `BIOMETRIC_KEY_EXISTS_FLAG` constant; handle user cancellation gracefully (not as error)
- **`apps/mobile/app/_layout.tsx`** — Add onboarding transition guard to suppress lock screen; fix AppState listener to only lock on `background`
- **`apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx`** — Biometric-first flow with async readiness gate; single auto-prompt per session; password as explicit fallback
- **`apps/mobile/app/(auth)/biometric.tsx`** — Remove auto-skip useEffect; Face ID only on user tap
- **`apps/mobile/app/(auth)/password.tsx`** — Ensure wallet unlocked state after account creation before navigating forward
- **`packages/shared/src/hooks/useAccounts.ts`** — May need an `addAccountUnlocked` variant or ensure `addAccount` leaves wallet in unlocked state
- No extension/web impact — biometric auth is mobile-only (native APIs)
