## ADDED Requirements

### Requirement: Mnemonic encryption helper

The system SHALL provide an `encryptMnemonics()` function in `packages/shared/src/crypto/encrypt-mnemonics.ts` that encrypts a mnemonic collection using the best available key source. The function SHALL accept `mnemonics: Record<string, string>` and an optional `password?: string`.

#### Scenario: Explicit password with valid cached key
- **WHEN** `encryptMnemonics(mnemonics, password)` is called and a valid `DerivedKeyCache` exists in stash
- **THEN** the function SHALL encrypt using `lockWithKey` with the cached key and return `{ vault: LockedVault & { isEncrypted: true }, requiredLock: true }`

#### Scenario: Explicit password without cached key
- **WHEN** `encryptMnemonics(mnemonics, password)` is called and no valid cached key exists in stash
- **THEN** the function SHALL derive a new key via `lockAndGetKey`, store the new key cache in stash, store the password in stash, and return `{ vault: LockedVault & { isEncrypted: true }, requiredLock: true }`

#### Scenario: No password with valid cached key
- **WHEN** `encryptMnemonics(mnemonics)` is called without password and a valid cached key exists
- **THEN** the function SHALL encrypt using `lockWithKey` and return `{ vault: LockedVault & { isEncrypted: true }, requiredLock: true }`

#### Scenario: No password with stashed password
- **WHEN** `encryptMnemonics(mnemonics)` is called without password, no cached key exists, but a stashed password exists
- **THEN** the function SHALL encrypt using `lock` with the stashed password and return `{ vault: LockedVault & { isEncrypted: true }, requiredLock: true }`

#### Scenario: No password and no encryption context
- **WHEN** `encryptMnemonics(mnemonics)` is called without password, no cached key, and no stashed password
- **THEN** the function SHALL return `{ vault: mnemonics, requiredLock: false }` (plain, unencrypted)

### Requirement: Return type includes lock state

The `encryptMnemonics` return type SHALL include a `requiredLock: boolean` field so the caller can update React state accordingly, and a `vault` field containing either the encrypted vault or plain mnemonics.

#### Scenario: Caller uses return value
- **WHEN** the caller receives the result from `encryptMnemonics`
- **THEN** the caller SHALL persist `result.vault` to `STORAGE_KEYS.MNEMONICS` and call `setRequiredLock(result.requiredLock)`
