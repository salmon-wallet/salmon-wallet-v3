## 1. Type System

- [x] 1.1 Add `'network_error'` to `ValidationResultCode` union in `packages/shared/src/types/validation.ts`
- [x] 1.2 Add `NETWORK_ERROR` constant to `VALIDATION_RESULTS` in `packages/shared/src/types/validation.ts` with `type: 'ERROR', code: 'network_error'`

## 2. Solana Validator

- [x] 2.1 Wrap `connection.getAccountInfo()` in try-catch in `validatePublicKey()` in `packages/shared/src/blockchain/solana/validation.ts` — return `NETWORK_ERROR` on failure
- [x] 2.2 Update `validateDomain()` catch block in `packages/shared/src/blockchain/solana/validation.ts` to return `NETWORK_ERROR` for network exceptions vs `INVALID_DOMAIN` for resolution failures
- [x] 2.3 Import `NETWORK_ERROR` from `VALIDATION_RESULTS` in the destructure at the top of the file

## 3. Hook & Messages

- [x] 3.1 Change catch block in `useAddressValidation` hook (`packages/shared/src/hooks/useAddressValidation.ts`) to use `code: 'network_error'` instead of `code: 'invalid'`
- [x] 3.2 Add `network_error: 'Could not verify address. Check your connection.'` to `VALIDATION_MESSAGES` in `packages/shared/src/utils/validation.ts`

## 4. i18n

- [x] 4.1 ~~Add i18n key~~ — Skipped: `VALIDATION_MESSAGES` uses hardcoded strings, not i18n keys. Internationalizing the validation system is out of scope for this fix.

## 5. Verification

- [x] 5.1 Run typecheck (`pnpm turbo run typecheck --filter=@salmon/shared`) to ensure no type errors
