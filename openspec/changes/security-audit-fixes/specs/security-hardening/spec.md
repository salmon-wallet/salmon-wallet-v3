## ADDED Requirements

### Requirement: Mnemonic must not be passed via URL params
Sensitive mnemonic data must be transferred between auth screens using in-memory storage (stash), never via route parameters that could be serialized to navigation state or deep link URLs.

#### Scenario: User recovers wallet with seed phrase
- **WHEN** user enters a valid mnemonic on the recover screen and proceeds
- **THEN** the mnemonic is stored in stash as `PENDING_MNEMONIC` and navigation to password screen uses no params containing the mnemonic

#### Scenario: User creates new wallet
- **WHEN** user completes seed phrase verification on the create screen and proceeds
- **THEN** the mnemonic is stored in stash as `PENDING_MNEMONIC` and navigation to password screen uses no params containing the mnemonic

#### Scenario: Password screen reads mnemonic
- **WHEN** the password screen mounts
- **THEN** it reads the mnemonic from stash and immediately removes it from stash after reading

### Requirement: BackupPanel requires biometric authentication before revealing seed phrase
The backup seed phrase panel must require biometric authentication (or password confirmation if biometrics unavailable) before displaying the mnemonic, matching the security level of PrivateKeyPanel.

#### Scenario: User reveals backup seed phrase with biometrics available
- **WHEN** user taps "Reveal" on the BackupPanel and biometric auth is available
- **THEN** a biometric prompt is shown and the seed phrase is only revealed after successful authentication

#### Scenario: User reveals backup seed phrase without biometrics
- **WHEN** user taps "Reveal" on the BackupPanel and biometric auth is not available
- **THEN** the seed phrase is revealed immediately (existing behavior)

### Requirement: Password must not be stored in session stash
The plaintext password must never be stored in the in-memory stash. Only the DerivedKeyCache (with TTL) is permitted for session-level caching of cryptographic material.

#### Scenario: User unlocks wallet with password
- **WHEN** unlock succeeds
- **THEN** only the DerivedKeyCache is stored in stash, not the plaintext password

#### Scenario: Re-encryption needed during session
- **WHEN** a mnemonic re-encryption is needed (e.g., adding account)
- **THEN** the system uses the cached DerivedKeyCache via `lockWithKey()`, not the password

### Requirement: Content script restricted to secure origins
The extension content script must only inject the wallet provider on HTTPS pages (plus localhost for development). It must not run in iframes.

#### Scenario: User visits HTTPS dApp
- **WHEN** user navigates to an HTTPS page
- **THEN** the wallet provider is injected and available

#### Scenario: User visits HTTP page
- **WHEN** user navigates to a non-localhost HTTP page
- **THEN** the wallet provider is NOT injected

### Requirement: Single biometric prompt for unlock
Biometric unlock must trigger exactly one OS-level biometric prompt, not two consecutive prompts.

#### Scenario: User unlocks with biometrics
- **WHEN** user triggers biometric unlock
- **THEN** SecureStore's built-in biometric prompt is used (single prompt), not a manual authenticateAsync followed by SecureStore access

### Requirement: Seed cache must have TTL and hashed keys
The BIP39 seed cache must automatically expire entries and must not store the raw mnemonic as a Map key.

#### Scenario: Seed derived during unlock
- **WHEN** a seed is derived from a mnemonic
- **THEN** it is cached with a 30-second TTL and the cache key is a SHA-256 hash of the mnemonic

#### Scenario: Seed cache entry expires
- **WHEN** 30 seconds pass since a seed was cached
- **THEN** the cached entry is no longer returned and must be re-derived

### Requirement: Password maximum length must be at least 128 characters
Users must be able to create passwords up to 128 characters to support passphrases.

#### Scenario: User creates a 50-character passphrase
- **WHEN** user enters a 50-character password
- **THEN** the password validation accepts it as valid (assuming other constraints met)

### Requirement: Biometric key invalidated on password change
When the user changes their password, the biometrically-stored derived key must be cleared since it corresponds to the old vault.

#### Scenario: User changes password
- **WHEN** password change succeeds
- **THEN** the biometric key stored in SecureStore is deleted and user must re-authenticate with the new password before biometric unlock works again

### Requirement: Mobile auto-lock on inactivity
The mobile app must auto-lock after 5 minutes of inactivity even while in the foreground.

#### Scenario: User leaves app idle in foreground
- **WHEN** 5 minutes pass with no user interaction while app is in foreground
- **THEN** the wallet locks automatically

### Requirement: Extension env files excluded from git
Production and staging environment files must be in `.gitignore` to prevent accidental secret commits.

### Requirement: Cryptographically secure random in validation positions
The `generateValidationPositions` function must use `crypto.getRandomValues` instead of `Math.random`.

### Requirement: Bitcoin transfer must fail without raw transaction
When building a Bitcoin transaction input, if `rawTx` is not available, the operation must throw an error instead of silently falling back to a potentially insecure witnessUtxo construction.

### Requirement: BTC-to-satoshis conversion must avoid float precision loss
The conversion from BTC to satoshis must use integer-safe arithmetic to avoid IEEE 754 floating-point precision errors.

### Requirement: Extension request IDs must be unpredictable
DApp request IDs must use `crypto.randomUUID()` instead of sequential integers to prevent ID collision attacks.

### Requirement: Dead postMessage method removed
The unused `postMessage` method with `targetOrigin: '*'` must be removed from `SolanaProvider` to eliminate the potential cross-origin data leak surface.
