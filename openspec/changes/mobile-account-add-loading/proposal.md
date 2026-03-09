## Why

The mobile `AccountAddPanel` is missing the loading overlay and error handling that the web/extension version has. When a user taps "Confirm" to create an account, the async `createAccount()` call (which derives BIP-44 keys for Solana, Bitcoin, and Ethereum) runs with zero visual feedback. Users can double-tap, see no progress, and errors are silently swallowed. The web version already solves this with a `LoadingScreen` overlay — and a mobile `LoadingScreen` component already exists but isn't wired into the account creation flow.

## What Changes

- Add `loading` state to mobile `AccountAddPanel.handleConfirm` matching the web pattern
- Render `LoadingScreen` overlay during account creation (component already exists at `apps/mobile/src/components/LoadingScreen/`)
- Add error feedback via `Alert.alert()` on creation failure (platform-appropriate equivalent of web error handling)
- Prevent double-tap by gating `handleConfirm` on `loading` state

## Capabilities

### New Capabilities

_(none — this is fixing missing behavior in an existing capability)_

### Modified Capabilities

- `account-add`: Adding loading state, visual feedback overlay, and error handling to the mobile account creation confirmation step

## Impact

- **apps/mobile** — `AccountAddPanel.tsx` is the only file that needs changes
- **Reuse** — The existing `LoadingScreen` component and `LoadingScreenBaseProps` type from `@salmon/shared` are already available; no new components needed
- **No shared logic changes** — The `createAccount()` factory and `accountActions.addAccount()` APIs remain unchanged
