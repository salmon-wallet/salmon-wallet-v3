## ADDED Requirements

### Requirement: Clear session key on inactivity lock
The system SHALL clear the platform-specific session key cache when the inactivity timeout triggers a wallet lock. On web, this means clearing `sessionStorage`. On extension, this means clearing the key from `chrome.storage.session`. This ensures that `LockPage` cannot auto-unlock with a stale cached key after an inactivity lock.

**Package:** `apps/web`, `apps/extension`

#### Scenario: Inactivity timeout fires on web
- **WHEN** the `useInactivityTimeout` hook detects inactivity exceeding 5 minutes on web
- **THEN** the system SHALL call `clearSessionKey()` from `apps/web/src/utils/sessionKeyCache.ts`
- **THEN** the system SHALL call `lockAccounts()` to set `locked = true`
- **THEN** the user SHALL be redirected to `/lock`
- **THEN** the `LockPage` session key check SHALL find no valid key and show the password form

#### Scenario: Inactivity timeout fires on extension
- **WHEN** the `useInactivityTimeout` hook detects inactivity exceeding 5 minutes on extension
- **THEN** the system SHALL call `clearSessionKey()` from `apps/extension/src/utils/sessionKeyCache.ts`
- **THEN** the system SHALL call `lockAccounts()` to set `locked = true`
- **THEN** the `App` state machine SHALL render `LockPage`
- **THEN** the `LockPage` session key check SHALL find no valid key and show the password form

#### Scenario: Manual lock does not clear session key
- **WHEN** the user manually locks the wallet (e.g., via a lock button in settings)
- **THEN** the system SHALL call `lockAccounts()` only
- **THEN** the session key SHALL remain cached
- **THEN** `LockPage` MAY auto-unlock using the cached session key (existing behavior preserved)

### Requirement: Update last activity on successful unlock
The system SHALL call `updateLastActivity()` after every successful unlock, both via password and via cached key. This ensures the inactivity timer starts from the moment of unlock, preventing immediate re-lock from a stale `lastActivity` timestamp.

**Package:** `packages/shared`

#### Scenario: Password unlock resets inactivity timer
- **WHEN** `unlockAccounts(password)` succeeds and sets `locked = false`
- **THEN** the system SHALL call `updateLastActivity()` to record the current timestamp
- **THEN** the next `isSessionTimedOut(5min)` check SHALL return `false`

#### Scenario: Cached key unlock resets inactivity timer
- **WHEN** `unlockWithCachedKey(keyCache)` succeeds and sets `locked = false`
- **THEN** the system SHALL call `updateLastActivity()` to record the current timestamp
- **THEN** the next `isSessionTimedOut(5min)` check SHALL return `false`

#### Scenario: Failed unlock does not update activity
- **WHEN** `unlockAccounts(password)` or `unlockWithCachedKey(keyCache)` fails
- **THEN** the system SHALL NOT call `updateLastActivity()`
- **THEN** the `lastActivity` timestamp SHALL remain unchanged

### Requirement: LoadingScreen memoization
The `LoadingScreen` component SHALL be wrapped in `React.memo` to prevent re-renders when its props have not changed. This prevents visual artifacts (animation restarts) caused by parent re-renders propagating through the context during the unlock process.

**Package:** `packages/ui`

#### Scenario: Context state changes during unlock do not re-render LoadingScreen
- **WHEN** `load()` triggers intermediate `setState` calls in the accounts context
- **THEN** the `LoadingScreen` component SHALL NOT re-render if its props (`visible`, `title`, `subtitle`, `showTips`, `tipInterval`, `logoSize`, `spinnerSize`) have not changed
- **THEN** the CSS fade-in animation SHALL NOT restart during the unlock process
