## Context

The mobile app has a biometric authentication system built on `expo-secure-store` (biometric-protected key storage) and `expo-local-authentication` (Face ID/Touch ID prompts). The system has three instances of the `useBiometricAuth` hook (root layout, onboarding biometric screen, and tabs layout) and a `LockScreenOverlay` component that auto-prompts biometric on lock.

**Current bugs:**
1. After onboarding, `addAccount()` sets `requiredLock: true`. When navigating from auth→app group, the initialization flow detects an encrypted vault with no cached key → sets `locked: true` → LockScreenOverlay appears → auto-prompts Face ID.
2. `checkBiometricCapabilities()` reads `SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE)` to check if a key exists. Since that key was stored with `requireAuthentication: true`, this read triggers a Face ID prompt on every hook mount.
3. LockScreenOverlay depends on `canUseBiometric` which changes async, causing a flash of password UI before biometric state loads, and re-triggering the auto-prompt effect.
4. AppState listener locks on `inactive` (not just `background`), and iOS sets state to `inactive` during Face ID system overlays — creating a lock loop.

## Goals / Non-Goals

**Goals:**
- After onboarding completes, the wallet is unlocked — no lock screen, no Face ID prompt
- Face ID only prompts in two scenarios: (a) lock screen auto-prompt on app re-open, (b) user taps "Use Face ID" button
- Biometric enrollment (onboarding + settings) only triggers Face ID when user taps "Enable"
- Password UI is a fallback, not the default when biometric is available
- Users who skip biometric enrollment during onboarding can enable it later from Settings > Security

**Non-Goals:**
- Changing the PBKDF2/encryption architecture
- Adding biometric support to extension or web
- Changing the auto-lock timeout logic (5 minutes)

## Decisions

### D1: Keep wallet unlocked after onboarding via `addAccount`

After `addAccount(account, password)` in `password.tsx`, the derived key is cached in stash (`STASH_KEYS.DERIVED_KEY`) with `cacheNewKey: true`. The wallet should stay unlocked because the user just authenticated with their password.

**Approach:** Call `actions.unlockAccounts(password)` after `addAccount()` in `password.tsx`. This sets `locked = false` and loads the full account data. The `addAccount` already encrypted and stored everything — `unlockAccounts` will find the cached key in stash and use it (fast, no re-derivation).

**Alternative considered:** Adding a `setLocked(false)` call inside `addAccount()` — rejected because `addAccount` is used in multiple contexts (onboarding, add-account-to-existing-wallet) and shouldn't assume unlock semantics.

### D2: Plain flag for biometric key existence check

Replace `SecureStore.getItemAsync(BIOMETRIC_KEY_STORAGE)` in `checkBiometricCapabilities()` with a plain (non-protected) flag `BIOMETRIC_KEY_EXISTS_FLAG = 'salmon_biometric_key_exists'`.

- Set flag to `'true'` in `storeKeyForBiometric()` alongside the protected key
- Delete flag in `clearBiometricKey()`
- Read flag in `checkBiometricCapabilities()` — no biometric prompt triggered

This is already partially implemented. The design formalizes it.

### D3: AppState listener — only lock on `background`

Change the AppState check from `inactive || background` to only `background`. iOS sets state to `inactive` for system overlays (Face ID, Control Center, notifications) — locking on `inactive` creates a loop when biometric prompts are shown.

Already partially implemented. The design formalizes it.

### D4: LockScreenOverlay — biometric readiness gate

Add a `biometricReady` state that prevents any UI rendering until the biometric state is determined:

1. On lock screen mount: show only logo + "Welcome back" (no password, no buttons)
2. Call `refreshBiometricState()` → when complete, set `biometricReady = true`
3. Once ready: if `canUseBiometric` → auto-prompt Face ID (once, via `hasAutoPromptedBiometric` ref)
4. If Face ID fails/cancelled → show password + "Use Face ID" button
5. If no biometric available → show password immediately

The auto-prompt effect depends only on `[locked, isVisible, biometricReady]` — NOT on `canUseBiometric` or `handleBiometricUnlock` — to prevent re-triggers from reference changes.

### D5: Suppress lock screen during auth→app transition

In `_layout.tsx`, add `!inAuthGroup` to the `shouldShowLockScreen` condition:

```
shouldShowLockScreen = state.ready && hasAccounts && state.locked && !inAuthGroup
```

This prevents the lock screen from appearing during the onboarding flow. Combined with D1 (unlock after addAccount), the wallet will be unlocked when navigating to the app group.

### D6: Biometric enrollment — user-initiated only

The `biometric.tsx` screen must NOT have any `useEffect` that triggers Face ID. The only trigger is the "Enable Face ID" button's `onPress` handler. The `useBiometricAuth` hook mounts here but `checkBiometricCapabilities()` only reads the plain flag (D2), so no prompt occurs.

The auto-skip `useEffect` (for devices without biometric support) is removed — `password.tsx` already checks `hasHardwareAsync()` and `isEnrolledAsync()` before navigating here.

### D7: SecurityPanel biometric enrollment for users who skipped onboarding

The existing SecurityPanel already has a biometric toggle. When a user who skipped onboarding toggles it ON:

1. `setEnableBiometric(true)` is called
2. The next password unlock in LockScreenOverlay will store the derived key via `storeKeyForBiometric()` (existing behavior in `handleUnlock`)
3. Future unlocks will have `canUseBiometric = true` and auto-prompt Face ID

No additional UI is needed — the existing toggle + next-unlock-stores-key pattern covers this case. The SecurityPanel already receives `isBiometricAvailable`, `isBiometricEnabled`, and `onToggleBiometric` props.

## Risks / Trade-offs

- **[Risk] Plain flag out of sync with protected key** — If the protected key is invalidated by the system (biometric change on device) but the flag remains `true`, the lock screen will attempt biometric unlock which will fail. **Mitigation:** `authenticateWithBiometric()` catches errors and falls back to password; on error, clear the flag.
- **[Risk] Race condition between navigation and state** — Navigation from auth→app and state updates (`locked`, `requiredLock`) happen asynchronously. **Mitigation:** The `!inAuthGroup` guard in `shouldShowLockScreen` provides a hard block regardless of state timing.
- **[Trade-off] `unlockAccounts` called after `addAccount`** — Adds a small overhead (re-reads storage, loads accounts). **Acceptable:** The accounts are already in memory from `addAccount`, and the cached key in stash means no PBKDF2 re-derivation.
