## Context

Security audit (2026-03-17) identified vulnerabilities across shared crypto, mobile, and extension. All fixes use existing APIs and patterns already in the codebase. No new dependencies needed.

## Goals / Non-Goals

**Goals:**
- Fix all CRITICAL and HIGH findings from the verified audit
- Fix all MEDIUM findings
- Maintain backward compatibility with existing vaults and stored data
- Zero regressions in functionality

**Non-Goals:**
- Migrating to Argon2 or other KDF (future work)
- Hardware wallet integration
- Adding Sentry/error reporting changes
- Test coverage (separate effort)

## Decisions

### D1: Mnemonic transfer via stash (not URL params)
Use the existing `setStashItem`/`getStashItem` from `packages/shared/src/storage/stash.ts` with a new key `STASH_KEYS.PENDING_MNEMONIC`. The mnemonic is set before navigation and read+cleared immediately in `password.tsx`. This avoids serialization in Expo Router navigation state.

### D2: BackupPanel biometric gate
Inject `biometricAvailable` and `authenticateWithBiometric` props into `BackupPanel` following the exact pattern of `PrivateKeyPanel`. The biometric check gates the reveal action, not the panel mount. Falls back to immediate reveal if biometrics unavailable.

### D3: Eliminate password from stash
Remove all `setStashItem(STASH_KEYS.PASSWORD, password)` calls. The `DerivedKeyCache` (already stored in stash with 5-min TTL) is sufficient for re-encryption via `lockWithKey()`. For the extension auto-unlock on re-init, use the `DerivedKeyCache` with `unlockWithKey()` instead of replaying the password. Add a new `STASH_KEYS.PENDING_MNEMONIC` for the auth flow transfer.

### D4: Helius API key removal from eas.json
Replace the hardcoded value with empty string. Document in a comment that the key must be set via EAS Secrets.

### D5: Content script HTTPS restriction
Change `matches` from `['http://*/*', 'https://*/*']` to `['https://*/*', 'http://localhost/*', 'http://127.0.0.1/*']`. Set `allFrames: false` (top frame only). Localhost kept for development.

### D6: Single biometric prompt
Remove the explicit `LocalAuthentication.authenticateAsync()` call. Rely solely on `SecureStore.getItemAsync()` with `requireAuthentication: true`, which triggers its own OS-level biometric prompt. This eliminates the double-prompt issue on iOS.

### D7: Seed cache with TTL
Add `expiresAt` timestamp to cached entries. Use 30-second TTL. Hash the mnemonic with SHA-256 (via `@noble/hashes` already in dependencies) as the cache key instead of the raw mnemonic string.

### D8: Password MAX_LENGTH increase
Change `MAX_LENGTH` from 20 to 128 in `password.ts`. Update the `hasMaxLength` check. No migration needed — existing passwords under 20 chars remain valid.

### D9: Biometric key invalidation on password change
In `changePassword()` of `useAccounts.ts`, call `removeStashItem` for derived key (already done) AND dispatch a callback to clear the biometric SecureStore key. Since `useAccounts` is platform-agnostic, expose an `onPasswordChanged` callback that the mobile layout can use to call `clearBiometricKey()`.

### D10: Mobile inactivity timeout
Import and use `useInactivityTimeout` from `@salmon/shared` in the mobile root `_layout.tsx`. Configure 5-minute timeout matching the extension behavior. Call `actions.lockAccounts()` on timeout.

### D11: Remaining medium fixes
- Extension `.gitignore`: add `.env.prod`, `.env.production`, `.env.staging` patterns
- `generateValidationPositions`: replace `Math.random()` with `crypto.getRandomValues(new Uint32Array(1))`
- Bitcoin `transfer.ts`: replace silent witnessUtxo fallback with `throw new Error`
- `btcToSatoshis` in `utils/decimals.ts` and `transfer.ts`: use `Math.round` instead of `Math.floor` to handle IEEE 754 correctly
- Remove dead `postMessage` method from `SolanaProvider.ts`
- Replace `#nextRequestId` counter with `crypto.randomUUID()` in `SolanaProvider.ts`

### D12: derived-accounts mnemonic param removal (CRITICAL follow-up)
`apps/mobile/app/(auth)/derived-accounts.tsx` declared `useLocalSearchParams<{ mnemonic: string }>()` and resolved the mnemonic via `params.mnemonic || activeAccount?.mnemonic`. Its only runtime caller (`success.tsx`) navigates without params, so the URL-param branch is dead in practice — but it leaves a deep-link / future-caller attack surface that is identical to the one D1 closed in `recover/create/password`. Drop the import, drop the `params` declaration, and resolve the mnemonic exclusively from the in-memory `activeAccount?.mnemonic`. No new contract is introduced; the screen keeps the same behavior because the active account is already unlocked when this route is reachable.

### D13: Stash JSDoc examples no longer model `STASH_KEYS.PASSWORD`
`packages/shared/src/storage/index.ts` and `packages/shared/src/storage/stash.ts` have four JSDoc snippets that show `setStashItem(STASH_KEYS.PASSWORD, ...)` / `getStashItem<string>(STASH_KEYS.PASSWORD)` as the canonical usage. After D3 those calls are forbidden in real code, so the doc examples were silently advertising the deprecated pattern. Replace each example with the equivalent shape using `STASH_KEYS.DERIVED_KEY` (the cache that is actually allowed by the spec), keeping the API surface unchanged.

## Risks / Trade-offs

- **D3 (password removal from stash)**: The `encryptMnemonics` function currently falls back to stashed password when no password argument is provided. After this change, it will fall back to `DerivedKeyCache` and use `lockWithKey()`. If the cache has expired (>5min), the operation will fail and require re-authentication. This is more secure but slightly changes UX for long idle sessions.
- **D5 (HTTPS only)**: Developers using HTTP dApps locally will need localhost specifically. Non-localhost HTTP dApps will not see the wallet provider.
- **D6 (single biometric)**: On some Android devices, `SecureStore.getItemAsync` with `requireAuthentication: true` may not show a visible prompt. The explicit `authenticateAsync` was added as a safety net. We accept this risk since expo-secure-store handles biometric internally.
- **D9 (biometric invalidation)**: Requires threading a callback through the accounts hook to the biometric layer. Keeps the shared hook platform-agnostic.
