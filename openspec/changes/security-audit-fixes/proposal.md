## Why

A verified security audit (2026-03-17) identified 2 CRITICAL, 6 HIGH, and 9 MEDIUM vulnerabilities across mobile, extension, and shared packages. The critical findings involve plaintext mnemonic exposure in navigation state and missing biometric protection for seed phrase backup. These must be addressed before the next production release.

## What Changes

### CRITICAL
- Move mnemonic from Expo Router URL params to in-memory stash in `recover.tsx`, `create.tsx`, and `password.tsx`
- Add biometric authentication gate to `BackupPanel` (matching existing `PrivateKeyPanel` pattern)

### HIGH
- Stop storing plaintext password in stash; use only `DerivedKeyCache` for re-encryption in `encrypt-mnemonics.ts` and `useAccounts.ts`
- Remove hardcoded Helius API key from `eas.json` (replace with EAS Secrets placeholder)
- Restrict extension content script to HTTPS-only origins and `allFrames: false` in `content.ts`
- Remove redundant `authenticateAsync()` call in `useBiometricAuth.ts` (eliminate double biometric prompt)
- Add TTL to seed cache and hash mnemonic key in `mnemonic.ts`
- Increase password `MAX_LENGTH` from 20 to 128 in `password.ts`

### MEDIUM
- Invalidate biometric key on password change in `useAccounts.ts`
- Add `useInactivityTimeout` to mobile root layout
- Add `.env.prod`, `.env.production`, `.env.staging` to extension `.gitignore`
- Use `crypto.getRandomValues` instead of `Math.random()` in `generateValidationPositions`
- Throw error instead of silent fallback in Bitcoin transfer when `rawTx` missing
- Fix BTC-to-satoshis float conversion to avoid IEEE 754 precision loss
- Remove dead `postMessage` method from `SolanaProvider.ts`
- Use `crypto.randomUUID()` for request IDs in `SolanaProvider.ts`

## Capabilities

### New Capabilities
- `security-hardening`: Cross-platform security fixes spanning crypto, storage, biometrics, extension messaging, and build configuration

### Modified Capabilities
- `security-settings`: Biometric gate added to backup panel, password constraints updated, biometric key invalidated on password change
- `seed-phrase-verification`: Seed cache TTL, mnemonic removed from URL params
- `inactivity-lock-session-cleanup`: Mobile inactivity timeout integration

## Impact

- **packages/shared**: `crypto/encryption.ts`, `crypto/mnemonic.ts`, `crypto/password.ts`, `crypto/encrypt-mnemonics.ts`, `hooks/useAccounts.ts`, `blockchain/bitcoin/transfer.ts`, `utils/decimals.ts`
- **apps/mobile**: `app/(auth)/recover.tsx`, `app/(auth)/create.tsx`, `app/(auth)/password.tsx`, `app/_layout.tsx`, `hooks/useBiometricAuth.ts`, `src/components/BackupPanel/BackupPanel.tsx`
- **apps/extension**: `src/entrypoints/content.ts`, `src/lib/SolanaProvider.ts`, `.gitignore`, `eas.json` (mobile)
- **No new dependencies**. All fixes use existing APIs and libraries.
- **No breaking API changes**. All changes are internal implementation hardening.
