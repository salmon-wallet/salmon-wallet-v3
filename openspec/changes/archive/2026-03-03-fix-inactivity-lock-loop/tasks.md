## 1. Shared — Update last activity on unlock

- [x] 1.1 In `packages/shared/src/hooks/useAccounts.ts`, add `await updateLastActivity()` after `setLocked(false)` in `unlockAccounts()` (line ~772). Import `updateLastActivity` from `../storage/stash`.
- [x] 1.2 In `packages/shared/src/hooks/useAccounts.ts`, add `await updateLastActivity()` after `setLocked(false)` in `unlockWithCachedKey()` (line ~822).

## 2. Web — Clear session key on inactivity lock

- [x] 2.1 In `apps/web/src/App.tsx`, import `clearSessionKey` from `./utils/sessionKeyCache` (already exists at `apps/web/src/utils/sessionKeyCache.ts`).
- [x] 2.2 In `apps/web/src/App.tsx`, update the `onTimeout` callback in `InactivityGuard` to call `void clearSessionKey()` before `actions.lockAccounts()`.

## 3. Extension — Clear session key on inactivity lock

- [x] 3.1 In `apps/extension/src/entrypoints/popup/App.tsx`, import `clearSessionKey` from `../../utils/sessionKeyCache` (already exists at `apps/extension/src/utils/sessionKeyCache.ts`).
- [x] 3.2 In `apps/extension/src/entrypoints/popup/App.tsx`, update the `onTimeout` callback in `useInactivityTimeout` to call `void clearSessionKey()` before `actions.lockAccounts()`.

## 4. UI — Memoize LoadingScreen

- [x] 4.1 In `packages/ui/src/components/LoadingScreen/LoadingScreen.tsx`, wrap the component export with `React.memo` to prevent re-renders when props haven't changed.

## 5. Verification

- [x] 5.1 Run `pnpm turbo run typecheck --filter=@salmon/shared --filter=@salmon/ui --filter=@salmon/web --filter=@salmon/extension` to verify no type errors.
- [ ] 5.2 Manual test on web: unlock wallet, wait 5+ minutes for inactivity lock, verify lock screen shows password form (no auto-unlock loop).
- [ ] 5.3 Manual test on extension: same as 5.2 — verify lock screen shows password form after inactivity lock.
- [ ] 5.4 Manual test: close and reopen without inactivity timeout — verify session key still auto-unlocks (existing behavior preserved for non-inactivity locks).
