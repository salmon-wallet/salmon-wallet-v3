## 1. Search & Reuse Audit

- [x] 1.1 Verify existing `STASH_KEYS` in `packages/shared/src/storage/types.ts` — confirm structure for adding `PENDING_MNEMONIC`
- [x] 1.2 Verify existing `useInactivityTimeout` hook in `packages/shared/src/hooks/` — confirm API and params
- [x] 1.3 Verify `clearBiometricKey` exists in `apps/mobile/hooks/useBiometricAuth.ts` — confirm callable from layout
- [x] 1.4 Verify `@noble/hashes` is already a dependency for SHA-256 hashing in seed cache

## 2. packages/shared — Crypto & Storage Hardening

- [x] 2.1 `packages/shared/src/storage/types.ts` — Add `PENDING_MNEMONIC: 'pending_mnemonic'` to `STASH_KEYS`
- [x] 2.2 `packages/shared/src/crypto/password.ts` — Change `MAX_LENGTH` from 20 to 128
- [x] 2.3 `packages/shared/src/crypto/mnemonic.ts` — Add 30s TTL to seed cache entries; hash mnemonic with SHA-256 as cache key instead of raw mnemonic string
- [x] 2.4 `packages/shared/src/crypto/mnemonic.ts` — Replace `Math.random()` with `crypto.getRandomValues` in `generateValidationPositions`
- [x] 2.5 `packages/shared/src/crypto/encrypt-mnemonics.ts` — Remove `setStashItem(STASH_KEYS.PASSWORD, password)` call; use `DerivedKeyCache` via `lockWithKey()` for fallback re-encryption
- [x] 2.6 `packages/shared/src/hooks/useAccounts.ts` — Remove all `setStashItem(STASH_KEYS.PASSWORD, password)` calls; use `DerivedKeyCache` for auto-unlock via `unlockWithKey()` instead of replaying password
- [x] 2.7 `packages/shared/src/hooks/useAccounts.ts` — In `changePassword()`, add `onPasswordChanged` callback invocation to notify platform layer to clear biometric keys
- [x] 2.8 `packages/shared/src/blockchain/bitcoin/transfer.ts` — Replace silent witnessUtxo fallback with `throw new Error('UTXO missing rawTx')` when rawTx is not available
- [x] 2.9 `packages/shared/src/blockchain/bitcoin/transfer.ts` — Fix BTC-to-satoshis conversion: use `Math.round` instead of `Math.floor` to handle IEEE 754 precision correctly
- [x] 2.10 `packages/shared/src/utils/decimals.ts` — Fix `btcToSatoshis` function to use `Math.round` instead of `Math.floor`
- [x] 2.11 `packages/shared/src/storage/index.ts` and `packages/shared/src/storage/stash.ts` — Replace the four JSDoc examples that showed `STASH_KEYS.PASSWORD` usage with `STASH_KEYS.DERIVED_KEY`-shaped examples, so the public API documentation stops modeling the pattern that D3 prohibits

## 3. apps/mobile — Critical Auth Fixes

- [x] 3.1 `apps/mobile/app/(auth)/recover.tsx` — Replace `router.push({ params: { mnemonic } })` with `setStashItem(STASH_KEYS.PENDING_MNEMONIC, normalized)` then navigate without mnemonic param
- [x] 3.2 `apps/mobile/app/(auth)/create.tsx` — Same: store mnemonic in stash before navigating to password screen
- [x] 3.3 `apps/mobile/app/(auth)/password.tsx` — Read mnemonic from stash via `getStashItem(STASH_KEYS.PENDING_MNEMONIC)` instead of `useLocalSearchParams`; remove it from stash immediately after reading
- [x] 3.4 `apps/mobile/hooks/useBiometricAuth.ts` — Remove explicit `LocalAuthentication.authenticateAsync()` call in `authenticateWithBiometric`; rely solely on SecureStore's built-in biometric prompt
- [x] 3.5 `apps/mobile/src/components/BackupPanel/BackupPanel.tsx` — Add `biometricAvailable` and `authenticateWithBiometric` props; gate seed phrase reveal behind biometric auth (matching PrivateKeyPanel pattern)
- [x] 3.6 `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Pass biometric props to BackupPanel instantiation
- [x] 3.7 `apps/mobile/app/_layout.tsx` — Integrate `useInactivityTimeout` with 5-minute timeout calling `actions.lockAccounts()`
- [x] 3.8 `apps/mobile/app/_layout.tsx` or `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Wire `onPasswordChanged` callback to call `clearBiometricKey()` when password changes
- [x] 3.9 `apps/mobile/app/(auth)/derived-accounts.tsx` — Drop the `useLocalSearchParams<{ mnemonic: string }>()` declaration and the `params.mnemonic ||` fallback; resolve mnemonic exclusively from `activeAccount?.mnemonic`. Remove the now-unused `useLocalSearchParams` import.

## 4. apps/extension — Content Script & Provider Hardening

- [x] 4.1 `apps/extension/src/entrypoints/content.ts` — Change `matches` to `['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*']`; change `allFrames` to `false`
- [x] 4.2 `apps/extension/src/lib/SolanaProvider.ts` — Remove dead `postMessage` method entirely
- [x] 4.3 `apps/extension/src/lib/SolanaProvider.ts` — Replace `#nextRequestId` sequential counter with `crypto.randomUUID()`
- [x] 4.4 `apps/extension/.gitignore` — Add `.env.prod`, `.env.production`, `.env.staging` patterns

## 5. apps/mobile — Build Config

- [x] 5.1 `apps/mobile/eas.json` — Remove hardcoded `EXPO_PUBLIC_HELIUS_API_KEY` value; replace with empty string and add comment about EAS Secrets

## 6. Verification

- [x] 6.1 Run typecheck: `pnpm turbo run typecheck`
- [x] 6.2 Run lint: `pnpm turbo run lint`
- [x] 6.3 Run build: `pnpm turbo run build`
- [x] 6.4 Fix any errors found before marking the change as complete
