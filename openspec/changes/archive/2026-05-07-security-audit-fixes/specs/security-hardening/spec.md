## ADDED Requirements

### Requirement: Mnemonic must not be passed via URL params
Sensitive mnemonic data SHALL be transferred between auth screens using in-memory storage (stash), never via route parameters that could be serialized to navigation state or deep link URLs.

#### Scenario: User recovers wallet with seed phrase
- **WHEN** user enters a valid mnemonic on the recover screen and proceeds
- **THEN** the mnemonic is stored in stash as `PENDING_MNEMONIC` and navigation to password screen uses no params containing the mnemonic

#### Scenario: User creates new wallet
- **WHEN** user completes seed phrase verification on the create screen and proceeds
- **THEN** the mnemonic is stored in stash as `PENDING_MNEMONIC` and navigation to password screen uses no params containing the mnemonic

#### Scenario: Password screen reads mnemonic
- **WHEN** the password screen mounts
- **THEN** it reads the mnemonic from stash and immediately removes it from stash after reading

#### Scenario: Derived-accounts screen resolves mnemonic from in-memory account
- **WHEN** the derived-accounts screen mounts
- **THEN** the mnemonic is resolved exclusively from the unlocked active account in memory, never from `useLocalSearchParams`, even if a deep link or future caller attempts to pass `mnemonic` as a route parameter

### Requirement: BackupPanel requires biometric authentication before revealing seed phrase
The backup seed phrase panel MUST require biometric authentication (or password confirmation if biometrics unavailable) before displaying the mnemonic, matching the security level of PrivateKeyPanel.

#### Scenario: User reveals backup seed phrase with biometrics available
- **WHEN** user taps "Reveal" on the BackupPanel and biometric auth is available
- **THEN** a biometric prompt is shown and the seed phrase is only revealed after successful authentication

#### Scenario: User reveals backup seed phrase without biometrics
- **WHEN** user taps "Reveal" on the BackupPanel and biometric auth is not available
- **THEN** the seed phrase is revealed immediately (existing behavior)

### Requirement: Password must not be stored in session stash
The plaintext password MUST NOT be stored in the in-memory stash. Only the DerivedKeyCache (with TTL) SHALL be permitted for session-level caching of cryptographic material.

#### Scenario: User unlocks wallet with password
- **WHEN** unlock succeeds
- **THEN** only the DerivedKeyCache is stored in stash, not the plaintext password

#### Scenario: Re-encryption needed during session
- **WHEN** a mnemonic re-encryption is needed (e.g., adding account)
- **THEN** the system uses the cached DerivedKeyCache via `lockWithKey()`, not the password

#### Scenario: Stash API documentation models the allowed pattern
- **WHEN** a developer reads the JSDoc examples in `packages/shared/src/storage/index.ts` or `packages/shared/src/storage/stash.ts`
- **THEN** the examples reference `STASH_KEYS.DERIVED_KEY` and never `STASH_KEYS.PASSWORD`, so the public API documentation does not advertise the prohibited pattern

### Requirement: Content script restricted to secure origins
The extension content script MUST only inject the wallet provider on HTTPS pages (plus localhost for development). It SHALL NOT run in iframes.

#### Scenario: User visits HTTPS dApp
- **WHEN** user navigates to an HTTPS page
- **THEN** the wallet provider is injected and available

#### Scenario: User visits HTTP page
- **WHEN** user navigates to a non-localhost HTTP page
- **THEN** the wallet provider is NOT injected

### Requirement: Single biometric prompt for unlock
Biometric unlock MUST trigger exactly one OS-level biometric prompt, not two consecutive prompts.

#### Scenario: User unlocks with biometrics
- **WHEN** user triggers biometric unlock
- **THEN** SecureStore's built-in biometric prompt is used (single prompt), not a manual authenticateAsync followed by SecureStore access

### Requirement: Seed cache must have TTL and hashed keys
The BIP39 seed cache MUST automatically expire entries and MUST NOT store the raw mnemonic as a Map key.

#### Scenario: Seed derived during unlock
- **WHEN** a seed is derived from a mnemonic
- **THEN** it is cached with a 30-second TTL and the cache key is a SHA-256 hash of the mnemonic

#### Scenario: Seed cache entry expires
- **WHEN** 30 seconds pass since a seed was cached
- **THEN** the cached entry is no longer returned and must be re-derived

### Requirement: Password maximum length must be at least 128 characters
Users SHALL be able to create passwords up to 128 characters to support passphrases.

#### Scenario: User creates a 50-character passphrase
- **WHEN** user enters a 50-character password
- **THEN** the password validation accepts it as valid (assuming other constraints met)

### Requirement: Biometric key invalidated on password change
When the user changes their password, the biometrically-stored derived key MUST be cleared since it corresponds to the old vault.

#### Scenario: User changes password
- **WHEN** password change succeeds
- **THEN** the biometric key stored in SecureStore is deleted and user must re-authenticate with the new password before biometric unlock works again

### Requirement: Mobile auto-lock on inactivity
The mobile app MUST auto-lock after 5 minutes of inactivity even while in the foreground.

#### Scenario: User leaves app idle in foreground
- **WHEN** 5 minutes pass with no user interaction while app is in foreground
- **THEN** the wallet locks automatically

### Requirement: Extension env files excluded from git
Production and staging environment files MUST be in `.gitignore` to prevent accidental secret commits.

#### Scenario: Repository contains extension .gitignore
- **WHEN** the extension `.gitignore` is inspected
- **THEN** it lists `.env.prod`, `.env.production`, and `.env.staging` patterns

### Requirement: Cryptographically secure random in validation positions
The `generateValidationPositions` function MUST use `crypto.getRandomValues` instead of `Math.random`.

#### Scenario: Seed-phrase verification positions are generated
- **WHEN** `generateValidationPositions` is invoked during seed-phrase verification
- **THEN** the indexes are sourced from `crypto.getRandomValues`, never from `Math.random`

### Requirement: Bitcoin transfer must fail without raw transaction
When building a Bitcoin transaction input, if `rawTx` is not available, the operation MUST throw an error instead of silently falling back to a potentially insecure witnessUtxo construction.

#### Scenario: UTXO without rawTx reaches the transfer builder
- **WHEN** `transfer.ts` attempts to add an input for a UTXO that has no `rawTx`
- **THEN** it throws `Error('UTXO <txid>:<vout> missing rawTx: cannot build secure transaction input')` and does not produce a partially signed transaction

### Requirement: BTC-to-satoshis conversion must avoid float precision loss
The conversion from BTC to satoshis MUST use integer-safe arithmetic to avoid IEEE 754 floating-point precision errors.

#### Scenario: Whole-BTC amount is converted to satoshis
- **WHEN** `btcToSatoshis` is called with a value such as `0.1`
- **THEN** it returns the exact integer satoshi count using `Math.round`, never `Math.floor`, so a `0.1 BTC` send is not silently quoted as `9_999_999` satoshis

### Requirement: Extension request IDs must be unpredictable
DApp request IDs MUST use `crypto.randomUUID()` instead of sequential integers to prevent ID collision attacks.

#### Scenario: SolanaProvider issues a dApp request
- **WHEN** the extension `SolanaProvider` builds a request envelope
- **THEN** the `id` field is generated by `crypto.randomUUID()`, not by an incrementing counter

### Requirement: Dead postMessage method removed
The unused `postMessage` method with `targetOrigin: '*'` MUST be removed from `SolanaProvider` to eliminate the potential cross-origin data leak surface.

#### Scenario: SolanaProvider source is inspected
- **WHEN** `apps/extension/src/lib/SolanaProvider.ts` is read
- **THEN** it does not export or expose any `postMessage` method that calls `window.postMessage(..., '*')`
