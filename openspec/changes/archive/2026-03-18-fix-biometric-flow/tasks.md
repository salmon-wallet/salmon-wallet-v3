## 1. Fix useBiometricAuth hook — plain flag for key existence

- [x] 1.1 `apps/mobile/hooks/useBiometricAuth.ts` — Add `BIOMETRIC_KEY_EXISTS_FLAG = 'salmon_biometric_key_exists'` constant
- [x] 1.2 `apps/mobile/hooks/useBiometricAuth.ts` — In `checkBiometricCapabilities()`, replace `SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE)` with `SecureStore.getItemAsync(BIOMETRIC_KEY_EXISTS_FLAG)` (plain read, no biometric prompt)
- [x] 1.3 `apps/mobile/hooks/useBiometricAuth.ts` — In `storeKeyForBiometric()`, add `SecureStore.setItemAsync(BIOMETRIC_KEY_EXISTS_FLAG, 'true')` after storing the protected key
- [x] 1.4 `apps/mobile/hooks/useBiometricAuth.ts` — In `clearBiometricKey()`, add `SecureStore.deleteItemAsync(BIOMETRIC_KEY_EXISTS_FLAG)` alongside deleting the protected key
- [x] 1.5 `apps/mobile/hooks/useBiometricAuth.ts` — In `authenticateWithBiometric()`, if a non-cancellation error occurs, call `clearBiometricKey()` to clear stale flag
- [x] 1.6 `apps/mobile/hooks/useBiometricAuth.ts` — Handle user cancellation in `storeKeyForBiometric()` and `authenticateWithBiometric()` as `console.log` (not `console.error`)

## 2. Fix wallet unlock after onboarding

- [x] 2.1 `apps/mobile/app/(auth)/password.tsx` — After `addAccount(account, password)` succeeds, call `await actions.unlockAccounts(password)` to set `state.locked = false` and load full account data
- [x] 2.2 `apps/mobile/app/_layout.tsx` — Add `!inAuthGroup` guard to `shouldShowLockScreen`: `state.ready && hasAccounts && state.locked && !inAuthGroup`
- [x] 2.3 `apps/mobile/app/_layout.tsx` — Add `'biometric'` to the `isPostCreationScreen` list to prevent auto-redirect during biometric enrollment

## 3. Fix AppState lock trigger

- [x] 3.1 `apps/mobile/app/_layout.tsx` — Change AppState listener to only lock on `background` transition (not `inactive`). Replace `previousState === 'active' && (nextState === 'inactive' || nextState === 'background')` with `previousState === 'active' && nextState === 'background'`

## 4. Fix LockScreenOverlay biometric-first flow

- [x] 4.1 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Add `biometricReady` state (default `false`) to gate UI rendering
- [x] 4.2 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Add `biometricInProgress` ref to prevent concurrent biometric attempts
- [x] 4.3 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — On lock screen mount: show only logo + "Welcome back" until `biometricReady` is `true`
- [x] 4.4 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Add init effect: call `refreshBiometricState()` then set `biometricReady = true`. Reset both flags on unlock.
- [x] 4.5 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Add decision effect (depends on `[locked, isVisible, biometricReady]` only): if `canUseBiometric` → auto-prompt after 400ms; else → show password. Set `hasAutoPromptedBiometric` to prevent re-triggers.
- [x] 4.6 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — On biometric failure/cancel in `handleBiometricUnlock`: set `showPasswordFallback = true`, do NOT auto-retry
- [x] 4.7 `apps/mobile/src/components/LockScreenOverlay/LockScreenOverlay.tsx` — Show "Use Face ID" / "Use Touch ID" button when biometric is available (for manual retry). Show "Enter Your Password" link when biometric is primary and password not yet shown.

## 5. Fix biometric enrollment screen

- [x] 5.1 `apps/mobile/app/(auth)/biometric.tsx` — Remove the auto-skip `useEffect` that redirects to success (device check already done in `password.tsx`)
- [x] 5.2 `apps/mobile/app/(auth)/biometric.tsx` — Ensure Face ID only triggers when user taps "Enable" button (no effects, no auto-triggers)
- [x] 5.3 `apps/mobile/app/(auth)/biometric.tsx` — On "Skip" / "Not now", navigate to success without any biometric prompt

## 6. Fix step indicator consistency

- [x] 6.1 `apps/mobile/app/(auth)/password.tsx` — Set step indicator to `{ totalSteps: 3, currentStep: 3 }` for create flow, `{ totalSteps: 2, currentStep: 2 }` for recover flow
- [x] 6.2 `apps/mobile/app/(auth)/create.tsx` — Pass `type: 'create'` param (not `isCreate: 'true'`) when navigating to password screen

## 7. Translations

- [x] 7.1 `packages/shared/src/locales/en/translation.json` — Add `wallet.create.biometric_title`, `wallet.create.biometric_subtitle`, `wallet.create.biometric_enable`, `wallet.create.biometric_skip`, `wallet.create.biometric_error`
- [x] 7.2 `packages/shared/src/locales/es/translation.json` — Add Spanish translations for the same keys
