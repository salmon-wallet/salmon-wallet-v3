## Context

When the wallet auto-locks after 5 minutes of inactivity, a redirect loop occurs between LockPage and HomePage on both web and extension. The root cause is a three-way gap:

1. `lockAccounts()` (`packages/shared/src/hooks/useAccounts.ts:736`) clears `STASH_KEYS.PASSWORD` and `STASH_KEYS.DERIVED_KEY` but does **not** clear the session key stored in `sessionStorage` (web) or `chrome.storage.session` (extension).
2. `unlockAccounts()` and `unlockWithCachedKey()` do **not** call `updateLastActivity()` after unlocking.
3. `useInactivityTimeout`'s `initialize()` checks `isSessionTimedOut()` on every enable-cycle. Since `lastActivity` is never refreshed, the stale timestamp always evaluates as timed-out.

The session key cache is platform-specific — each app has its own `sessionKeyCache.ts` (`apps/web/src/utils/sessionKeyCache.ts` and `apps/extension/src/utils/sessionKeyCache.ts`). The shared `useAccounts` hook has no awareness of it.

Mobile is unaffected: it has no `useInactivityTimeout`, no session key cache, and its lock screen is a `LockScreenOverlay` rendered on top of the app (no route/state swap).

## Goals / Non-Goals

**Goals:**
- Break the lock→unlock→lock loop so inactivity lock results in the user staying on the lock screen until they explicitly enter their password.
- Ensure `lastActivity` is fresh after every successful unlock so the inactivity timer never immediately re-fires.
- Harden the `LoadingScreen` component against unnecessary re-renders caused by intermediate context state changes during `load()`.

**Non-Goals:**
- Refactoring `load()` to batch its `setState` calls (separate optimization, not needed to fix the loop).
- Memoizing the `actions` object returned by `useAccounts` (would help performance broadly but is not the loop fix).
- Changing mobile's lock/unlock architecture (not affected).
- Modifying `useInactivityTimeout` internals (the hook is correct; the consumers are not cleaning up properly).

## Decisions

### 1. Clear session key in the `onTimeout` callback, not inside `lockAccounts()`

**Decision:** Each app's `onTimeout` handler will call `clearSessionKey()` before or alongside `lockAccounts()`.

**Why not inside `lockAccounts()`:** The session key cache is platform-specific (`sessionStorage` on web, `chrome.storage.session` on extension, non-existent on mobile). `lockAccounts()` lives in `packages/shared` and has no access to the platform-specific session key utilities. Pulling platform-specific imports into shared would break the architecture.

**Why not add a callback/hook parameter to `lockAccounts()`:** Over-engineering. The two call sites (web `App.tsx`, extension `App.tsx`) are simple one-liners. Adding a callback abstraction adds complexity for no gain.

**Alternative considered:** Create a `clearSessionKey` in `packages/shared` with platform adapters. Rejected — the session key cache is intentionally app-local (different storage APIs per platform), and only two call sites need the change.

### 2. Add `updateLastActivity()` inside `unlockAccounts()` and `unlockWithCachedKey()`

**Decision:** Call `updateLastActivity()` (from `packages/shared/src/storage/stash.ts`) right after `setLocked(false)` in both unlock functions.

**Why here and not in the consumer:** The unlock functions are the canonical "session starts" moments. Every consumer (password unlock, cached key unlock, init auto-unlock) goes through these functions. Placing the call here guarantees no unlock path can forget to reset the timer.

**Why after `setLocked(false)` and not before:** The activity timestamp should reflect when the wallet became usable, not when decryption started.

### 3. Wrap `LoadingScreen` in `React.memo`

**Decision:** Add `React.memo` to the `LoadingScreen` export in `packages/ui`.

**Why:** During `load()`, ~5-7 context state updates propagate to all context consumers. The `LoadingScreen` receives `visible`, `title`, `showTips`, and `tipInterval` — none of which change during these intermediate renders. `React.memo` short-circuits these re-renders with a shallow prop comparison, preventing potential CSS animation restarts.

**Why not `useMemo` on the parent side:** The parent (`LockPage`) itself re-renders from context changes, so memoizing at the child level is simpler and covers all consumers of `LoadingScreen`.

## Risks / Trade-offs

**[Risk] `clearSessionKey()` is async and `onTimeout` is sync** → Both `clearSessionKey` implementations are simple storage operations that won't fail meaningfully. Fire-and-forget (`void clearSessionKey()`) is acceptable here. The critical state change is `lockAccounts()` which runs synchronously via `setLocked(true)`.

**[Risk] `updateLastActivity()` adds an async stash write to the unlock hot path** → `updateLastActivity()` writes a single number to the stash. On both platforms this is sub-millisecond. It runs after `setLocked(false)` so it doesn't delay the unlock-to-home transition.

**[Trade-off] Session key cleared on inactivity lock means the user must enter their password after timeout** → This is the intended UX. The session key is a convenience cache for the "close and reopen quickly" flow, not a way to bypass inactivity lock. If the wallet locked for inactivity, requiring the password is the correct security posture.
