## 1. Search & Reuse Audit

- [ ] 1.1 Verify existing `STASH_KEYS` in `packages/shared/src/storage/types.ts` — confirm structure for adding `PENDING_MNEMONIC`
- [ ] 1.2 Verify existing `useInactivityTimeout` hook in `packages/shared/src/hooks/` — confirm API and params
- [ ] 1.3 Verify `clearBiometricKey` exists in `apps/mobile/hooks/useBiometricAuth.ts` — confirm callable from layout
- [ ] 1.4 Verify `@noble/hashes` is already a dependency for SHA-256 hashing in seed cache

## 2. packages/shared — Crypto & Storage Hardening

- [ ] 2.1 `packages/shared/src/storage/types.ts` — Add `PENDING_MNEMONIC: 'pending_mnemonic'` to `STASH_KEYS`
- [ ] 2.2 `packages/shared/src/crypto/password.ts` — Change `MAX_LENGTH` from 20 to 128
- [ ] 2.3 `packages/shared/src/crypto/mnemonic.ts` — Add 30s TTL to seed cache entries; hash mnemonic with SHA-256 as cache key instead of raw mnemonic string
- [ ] 2.4 `packages/shared/src/crypto/mnemonic.ts` — Replace `Math.random()` with `crypto.getRandomValues` in `generateValidationPositions`
- [ ] 2.5 `packages/shared/src/crypto/encrypt-mnemonics.ts` — Remove `setStashItem(STASH_KEYS.PASSWORD, password)` call; use `DerivedKeyCache` via `lockWithKey()` for fallback re-encryption
- [ ] 2.6 `packages/shared/src/hooks/useAccounts.ts` — Remove all `setStashItem(STASH_KEYS.PASSWORD, password)` calls; use `DerivedKeyCache` for auto-unlock via `unlockWithKey()` instead of replaying password
- [ ] 2.7 `packages/shared/src/hooks/useAccounts.ts` — In `changePassword()`, add `onPasswordChanged` callback invocation to notify platform layer to clear biometric keys
- [ ] 2.8 `packages/shared/src/blockchain/bitcoin/transfer.ts` — Replace silent witnessUtxo fallback with `throw new Error('UTXO missing rawTx')` when rawTx is not available
- [ ] 2.9 `packages/shared/src/blockchain/bitcoin/transfer.ts` — Fix BTC-to-satoshis conversion: use `Math.round` instead of `Math.floor` to handle IEEE 754 precision correctly
- [ ] 2.10 `packages/shared/src/utils/decimals.ts` — Fix `btcToSatoshis` function to use `Math.round` instead of `Math.floor`

## 3. apps/mobile — Critical Auth Fixes

- [ ] 3.1 `apps/mobile/app/(auth)/recover.tsx` — Replace `router.push({ params: { mnemonic } })` with `setStashItem(STASH_KEYS.PENDING_MNEMONIC, normalized)` then navigate without mnemonic param
- [ ] 3.2 `apps/mobile/app/(auth)/create.tsx` — Same: store mnemonic in stash before navigating to password screen
- [ ] 3.3 `apps/mobile/app/(auth)/password.tsx` — Read mnemonic from stash via `getStashItem(STASH_KEYS.PENDING_MNEMONIC)` instead of `useLocalSearchParams`; remove it from stash immediately after reading
- [ ] 3.4 `apps/mobile/hooks/useBiometricAuth.ts` — Remove explicit `LocalAuthentication.authenticateAsync()` call in `authenticateWithBiometric`; rely solely on SecureStore's built-in biometric prompt
- [ ] 3.5 `apps/mobile/src/components/BackupPanel/BackupPanel.tsx` — Add `biometricAvailable` and `authenticateWithBiometric` props; gate seed phrase reveal behind biometric auth (matching PrivateKeyPanel pattern)
- [ ] 3.6 `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Pass biometric props to BackupPanel instantiation
- [ ] 3.7 `apps/mobile/app/_layout.tsx` — Integrate `useInactivityTimeout` with 5-minute timeout calling `actions.lockAccounts()`
- [ ] 3.8 `apps/mobile/app/_layout.tsx` or `apps/mobile/app/(app)/(tabs)/_layout.tsx` — Wire `onPasswordChanged` callback to call `clearBiometricKey()` when password changes

## 4. apps/extension — Content Script & Provider Hardening

- [ ] 4.1 `apps/extension/src/entrypoints/content.ts` — Change `matches` to `['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*']`; change `allFrames` to `false`
- [ ] 4.2 `apps/extension/src/lib/SolanaProvider.ts` — Remove dead `postMessage` method entirely
- [ ] 4.3 `apps/extension/src/lib/SolanaProvider.ts` — Replace `#nextRequestId` sequential counter with `crypto.randomUUID()`
- [ ] 4.4 `apps/extension/.gitignore` — Add `.env.prod`, `.env.production`, `.env.staging` patterns

## 5. apps/mobile — Build Config

- [ ] 5.1 `apps/mobile/eas.json` — Remove hardcoded `EXPO_PUBLIC_HELIUS_API_KEY` value; replace with empty string and add comment about EAS Secrets

## 6. Verification

- [ ] 6.1 Run typecheck: `pnpm turbo run typecheck`
- [ ] 6.2 Run lint: `pnpm turbo run lint`
- [ ] 6.3 Run build: `pnpm turbo run build`
- [ ] 6.4 Fix any errors found before marking the change as complete
