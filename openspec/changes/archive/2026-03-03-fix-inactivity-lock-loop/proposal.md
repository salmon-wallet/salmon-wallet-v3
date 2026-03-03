## Why

After the inactivity timeout locks the wallet, the app enters a redirect loop between the lock screen and the home screen. `lockAccounts()` clears the stash password and derived key but leaves the session key intact, so `LockPage` immediately auto-unlocks via `unlockWithCachedKey`. Because neither the unlock nor the lock path updates `lastActivity`, the inactivity timeout fires again the instant `HomePage` mounts — creating a lock → unlock → lock → unlock loop that the user perceives as rapid flickering between the logo splash and the home screen. Affects both web and extension; mobile is not affected (no `useInactivityTimeout` hook, and lock screen is an overlay rather than a route/state swap).

## What Changes

- **Clear the session key on inactivity lock** — When `useInactivityTimeout` triggers `lockAccounts()`, the session key (in `sessionStorage` / `chrome.storage.session`) must be cleared so `LockPage` cannot auto-unlock and re-enter the loop.
- **Update `lastActivity` on successful unlock** — Both `unlockAccounts()` and `unlockWithCachedKey()` should call `updateLastActivity()` after setting `locked = false`, so the inactivity timer starts fresh after any unlock and cannot immediately re-fire.
- **Memoize `LoadingScreen` to prevent unnecessary re-renders** — Wrap the component in `React.memo` so that intermediate context re-renders during `load()` (which still exist regardless of the loop fix) don't propagate to the loading overlay. This is a secondary hardening measure to eliminate visual flicker even if re-renders occur.

## Capabilities

### New Capabilities

- `inactivity-lock-session-cleanup`: Ensures the inactivity auto-lock path leaves the wallet in a fully locked state (session key cleared, last-activity reset) so that subsequent unlock requires explicit user action (password or biometric).

### Modified Capabilities

- `security-settings`: The auto-lock behavior described in the security spec now requires that session keys are invalidated on inactivity lock, and that unlock always resets the inactivity timer.

## Impact

- **`packages/shared`**
  - `src/hooks/useAccounts.ts` — `unlockAccounts` and `unlockWithCachedKey` gain an `updateLastActivity()` call.
  - `src/hooks/useInactivityTimeout.ts` — No code change needed; consumers must clear the session key in their `onTimeout` callback.
- **`apps/web`**
  - `src/App.tsx` — `onTimeout` callback must also call `clearSessionKey()`.
- **`apps/extension`**
  - `src/entrypoints/popup/App.tsx` — `onTimeout` callback must also call `clearSessionKey()`.
- **`packages/ui`**
  - `src/components/LoadingScreen/LoadingScreen.tsx` — Wrap export in `React.memo`.
- **`apps/mobile`** — No changes. Mobile does not use `useInactivityTimeout` and its lock screen is an overlay (no route-based loop possible).
